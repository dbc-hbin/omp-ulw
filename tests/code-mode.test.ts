import { describe, expect, test } from "bun:test";
import { registerCodeMode, type CodeModeApi } from "../code-mode";

const js = { type: "object", properties: { language: { enum: ["py", "js"] }, code: { type: "string" } } };
const args = { type: "object", properties: { path: { type: "string" } }, required: ["path"] };
const gpt = { id: "deployment", name: "Alias", provider: "azure", api: "openai-responses", identity: { class: "openai", family: "gpt" } };
const responseTool = (name: string, parameters: unknown = args) => ({
	type: "function", name, description: `wire ${name}`, parameters, strict: true,
});
const native = (name: string, parameters: unknown = args) => ({
	name, description: `native ${name}`, parameters, promptGuidelines: [`policy ${name}`],
});
type Model = NonNullable<Parameters<Parameters<CodeModeApi["on"]>[1]>[1]["model"]> & {
	id?: string;
	name?: string;
	provider?: string;
	identity?: { class?: string; family?: string; logicalId?: string };
};

function host(names = ["eval", "read", "write", "bash"]) {
	const handlers = new Map<string, (event: { payload: unknown }, ctx: { model: Model; ui: { notify(message: string): void } }) => unknown>();
	const warnings: string[] = [];
	const state: { active: string[]; tools: ReturnType<CodeModeApi["getAllTools"]> } = {
		active: [...names],
		tools: names.map(name => native(name, name === "eval" ? js : args)),
	};
	const pi = {
		getAllTools: () => state.tools,
		getActiveTools: () => state.active,
		on: (event: string, handler: (event: { payload: unknown }, ctx: { model: Model; ui: { notify(message: string): void } }) => unknown) => {
			handlers.set(event, handler);
		},
	} as CodeModeApi;
	registerCodeMode(pi);
	return {
		state, warnings,
		request<T>(payload: T, model: Model = gpt): T {
			const result = handlers.get("before_provider_request")!({ payload }, { model, ui: { notify: message => warnings.push(message) } });
			return (result === undefined ? payload : result) as T;
		},
		reset(event: string) {
			handlers.get(event)!({ payload: undefined }, { model: gpt, ui: { notify: message => warnings.push(message) } });
		},
	};
}

function responses(names = ["eval", "read", "write", "bash"]) {
	return { tools: names.map(name => responseTool(name, name === "eval" ? js : args)), input: [{ role: "user", content: "now" }] };
}

describe("model-neutral request-local code mode", () => {
	test("all model families and unknown identities use the same live tool-capability gates", () => {
		const h = host();
		const input = responses();
		for (const model of [
			gpt,
			{ ...gpt, id: "claude-opus", identity: { class: "anthropic", family: "claude" } },
			{ ...gpt, id: "gemini-4", identity: { class: "google", family: "gemini" } },
			{ ...gpt, id: "deepseek-v4", identity: { class: "deepseek" } },
			{ ...gpt, id: "kimi-k3", identity: { class: "moonshot" } },
			{ ...gpt, id: "qwen3", identity: { class: "qwen" } },
			{ ...gpt, id: "grok-4.5", identity: { class: "xai" } },
			{ ...gpt, id: "llama", name: "Llama", identity: undefined },
			{ ...gpt, id: "gpt-5.3-codex", identity: { class: "openai", family: "codex" } },
			{ ...gpt, id: "gpt-oss-120b", provider: "openrouter", identity: { class: "gpt-oss", family: "120b" } },
			{ api: gpt.api },
		]) {
			const output = h.request(input, model);
			expect(output.tools.map(tool => tool.name)).toEqual(["eval", "write"]);
			expect(output.tools[0]!.description).toContain("Use eval to call listed tools");
			expect(output.tools[0]!.description).toContain('Prefer language="py"');
			expect(output.tools[0]!.description).toContain('Use language="js" when JavaScript-specific APIs or libraries are needed.');
			expect(output.tools[0]!.description).toContain("inspect results");
			expect(output.tools[0]!.description).toContain("Native permissions apply");
			expect(output.tools[0]!.description).not.toMatch(/parallel|sequential|Promise\.all/);
		}
		h.state.active = h.state.active.filter(name => name !== "eval");
		expect(h.request(input)).toBe(input);
		h.state.active.push("eval");
		expect(h.request(input).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
	});

	test("catalog accessors invoke tools with hyphenated, dotted and colon-qualified names", async () => {
		for (const name of ["foo-bar", "server.tool", "mcp:search", "$probe", "class", "None", "lambda", "read"]) {
			const h = host(["eval", name]);
			const input = { config: { tools: [{ functionDeclarations: [
				{ name: "eval", description: "eval", parametersJsonSchema: js },
				{ name, description: name, parametersJsonSchema: args },
			] }] } };
			const output = h.request(input, { ...gpt, api: "google-generative-ai" });
			const declarations = output.config.tools[0]!.functionDeclarations;
			expect(declarations.map(tool => tool.name)).toEqual(["eval"]);
			const call = declarations[0]!.description.split("\n").find(line => line.startsWith("await tool"));
			expect(call).toBe(name === "read" ? "await tool.read(args)" : `await tool[${JSON.stringify(name)}](args)`);
			const calls: { name: string; value: unknown }[] = [];
			const tools = new Proxy({}, {
				get: (_target, key) => async (value: unknown) => calls.push({ name: String(key), value }),
			});
			const value = { path: "example.txt" };
			await new Function("tool", "args", `return (async () => { ${call}; })()`)(tools, value);
			expect(calls).toEqual([{ name, value }]);
			expect(h.warnings).toEqual([]);
		}
	});

	test("Responses namespace/custom filtering retains metadata and never mutates incoming payload", () => {
		const names = ["eval", "read", "edit", "write", "task", "checkpoint", "rewind", "new_context", "ask", "wait", "todo", "yield", "think", "defined", "undefine"];
		const h = host(names);
		const direct = names.filter(name => !["read", "edit", "task", "todo"].includes(name));
		const kept = direct.filter(name => name !== "eval").map(name => ({ ...responseTool(name), cache_control: { type: "ephemeral" } }));
		const custom = { type: "custom", name: "edit", description: "freeform edit", format: { type: "grammar", definition: "patch" }, vendor: 42 };
		const unmatched = { type: "custom", name: "provider_patch", format: { type: "grammar", definition: "patch" } };
		const input = {
			...responses([]),
			tools: [{ type: "namespace", name: "functions", description: "namespace metadata", tools: [
				responseTool("eval", js), responseTool("read"), custom, responseTool("task"), responseTool("todo"), ...kept, unmatched,
			] }],
			parallel_tool_calls: true,
		};
		const before = structuredClone(input);
		const output = h.request(input);
		expect(input).toEqual(before);
		expect(output.input).toBe(input.input);
		expect(output.parallel_tool_calls).toBe(true);
		expect(output.tools[0].description).toBe("namespace metadata");
		const tools = output.tools[0].tools;
		expect(tools.map(tool => tool.name)).toEqual(["eval", ...kept.map(tool => tool.name), "provider_patch"]);
		for (const entry of kept) expect(tools.find(tool => tool.name === entry.name)).toBe(entry);
		expect(tools.at(-1)).toBe(unmatched);
		const evaluation = tools[0] as ReturnType<typeof responseTool>;
		expect(evaluation.parameters).toBe(js);
		expect(evaluation.strict).toBe(true);
		expect(evaluation.description).toContain(`JSON Schema: ${JSON.stringify(args)}`);
		expect(evaluation.description).toContain("await tool.read(args)");
		expect(evaluation.description).toContain("await tool.edit(args)");
		expect(evaluation.description).toContain('Direct custom wire format (bridge still takes JSON args): {"type":"grammar","definition":"patch"}');
		expect(evaluation.description).toContain("await tool.task(args)");
		expect(evaluation.description).toContain("await tool.todo(args)");
		for (const name of ["ask", "wait", "yield", "think"]) {
			expect(evaluation.description).not.toContain(`await tool.${name}(args)`);
		}
		expect(evaluation.description).not.toContain("Keep orchestration");
		expect(evaluation.description).not.toContain("await tool.checkpoint(args)");
		expect(evaluation.description).not.toContain("await tool.new_context(args)");
		expect(evaluation.description).not.toContain("await tool.defined(args)");
		expect(evaluation.description).not.toContain("await tool.undefine(args)");
		expect(h.warnings.some(message => message.includes("provider_patch"))).toBe(true);
	});

	test("native apply_patch stays direct while edit uses its registered JSON bridge schema", () => {
		for (const api of ["openai-responses", "openai-codex-responses", "azure-openai-responses"]) {
			const h = host(["eval", "read", "edit", "write"]);
			h.state.tools.find(tool => tool.name === "edit")!.parameters = {
				type: "object", properties: { input: { type: "string" } }, required: ["input"],
			};
			const patch = {
				type: "custom", name: "apply_patch", description: "native freeform patch",
				format: { type: "grammar", syntax: "lark", definition: "patch" },
			};
			const input = { ...responses(["eval", "read", "write"]), tools: [
				responseTool("eval", js), responseTool("read"), patch, responseTool("write"),
			] };
			const output = h.request(input, { ...gpt, api });
			expect(output.tools.map(tool => tool.name)).toEqual(["eval", "apply_patch", "write"]);
			expect(output.tools[1]).toBe(patch);
			expect(output.tools[0]!.description).toContain("await tool.read(args)");
			expect(output.tools[0]!.description).toContain("await tool.edit(args)");
			expect(output.tools[0]!.description).toContain("Read xd://edit for current documentation and JSON Schema before first use.");
			expect(output.tools[0]!.description).not.toContain("await tool.apply_patch(args)");
			expect(h.warnings).toEqual([]);
			h.state.active = h.state.active.filter(name => name !== "edit");
			expect(h.request(input, { ...gpt, api }).tools[0]!.description).not.toContain("await tool.edit(args)");
		}
	});

	test("current provider transports filter actual schema arrays, retaining provider metadata", () => {
		for (const api of ["openai-responses", "openai-codex-responses", "azure-openai-responses"]) {
			const h = host();
			expect(h.request(responses(), { ...gpt, api }).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
		}
		for (const api of ["openai-completions", "openrouter"]) {
			const h = host();
			const write = { type: "function", function: responseTool("write"), vendor: { keep: true } };
			const input = { tools: [{ type: "function", function: responseTool("eval", js) }, { type: "function", function: responseTool("read") }, write], messages: [] };
			const output = h.request(input, { ...gpt, api });
			expect(output.tools.map(tool => tool.function.name)).toEqual(["eval", "write"]);
			expect(output.tools[1]).toBe(write);
			expect(output.messages).toBe(input.messages);
			expect(output.tools[0].function.description).toContain("await tool.read(args)");
		}
		{
			const h = host();
			const write = { name: "write", description: "native write", input_schema: args, cache_control: { type: "ephemeral" } };
			const input = { tools: [
				{ name: "eval", description: "native eval", input_schema: js },
				{ name: "read", description: "native read", input_schema: args },
				write,
			], messages: [] };
			const output = h.request(input, { ...gpt, api: "anthropic-messages" });
			expect(output.tools.map(tool => tool.name)).toEqual(["eval", "write"]);
			expect(output.tools[1]).toBe(write);
			expect(output.messages).toBe(input.messages);
			expect(output.tools[0]!.description).toContain("await tool.read(args)");
		}
		for (const wrapped of [false, true]) {
			const h = host();
			const definition = (name: string) => ({ toolSpec: { name, description: name, inputSchema: { json: name === "eval" ? js : args }, vendor: 3 } });
			const write = definition("write");
			const body = { toolConfig: { tools: [definition("eval"), definition("read"), write], toolChoice: { auto: {} } }, messages: [] };
			const input = wrapped ? { commandInput: body, clientMetadata: 7 } : body;
			const before = structuredClone(input);
			const output = h.request(input, { ...gpt, api: "bedrock-converse-stream" });
			const projected = ("commandInput" in output ? output.commandInput : output) as typeof body;
			expect(projected.toolConfig.tools.map(tool => tool.toolSpec.name)).toEqual(["eval", "write"]);
			expect(projected.toolConfig.tools[1]).toBe(write);
			expect(projected.toolConfig.toolChoice).toBe(body.toolConfig.toolChoice);
			expect(projected.toolConfig.tools[0].toolSpec.inputSchema.json).toBe(js);
			expect(input).toEqual(before);
		}
	});

	test("Google SDK, CLI and raw-body projections retain declaration groups and forced choices", () => {
		for (const [api, surface] of [
			["google-generative-ai", "config"], ["google-vertex", "config"],
			["google-generative-ai", "root"], ["factory-droid-agent", "root"],
			["google-gemini-cli", "request"], ["antigravity-cli", "request"],
		]) {
			for (const schemaKey of ["parametersJsonSchema", "parameters"]) {
				const h = host(["eval", "read", "write", "bash", "task"]);
				const definition = (name: string) => ({
					name, description: `wire ${name}`, [schemaKey]: name === "eval" ? js : args,
				});
				const write = definition("write");
				const task = definition("task");
				const body = {
					tools: [
						{ functionDeclarations: [definition("eval")], vendor: "eval group" },
						{ functionDeclarations: [definition("read")], vendor: "read group" },
						{ functionDeclarations: [write, definition("bash"), task], vendor: "retained group" },
					],
					contents: [{ role: "user", parts: [{ text: "now" }] }],
				};
				const wrap = (value: typeof body) => surface === "config" ? { model: "gemini", config: value }
					: surface === "request" ? { model: "gemini", request: value } : value;
				const input = wrap(body);
				const before = structuredClone(input);
				const output = h.request(input, { ...gpt, api });
				const projected = ("config" in output ? output.config : "request" in output ? output.request : output) as typeof body;
				expect(input).toEqual(before);
				expect(projected.contents).toBe(body.contents);
				expect(projected.tools.map(group => group.vendor)).toEqual(["eval group", "retained group"]);
				expect(projected.tools.flatMap(group => group.functionDeclarations.map(tool => tool.name))).toEqual(["eval", "write"]);
				expect(projected.tools[1]!.functionDeclarations).toEqual([write]);
				expect(projected.tools[1]!.functionDeclarations[0]).toBe(write);
				const evaluation = projected.tools[0]!.functionDeclarations[0]!;
				expect(evaluation[schemaKey]).toBe(js);
				expect(evaluation.description).toContain(`JSON Schema: ${JSON.stringify(args)}`);
				expect(evaluation.description).toContain("await tool.read(args)");
				expect(evaluation.description).toContain("await tool.task(args)");
				expect(h.warnings).toEqual([]);

				const forcedBody = { ...body, toolConfig: {
					functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["read"] },
				} };
				const forced = h.request(wrap(forcedBody), { ...gpt, api });
				const forcedResult = ("config" in forced ? forced.config : "request" in forced ? forced.request : forced) as typeof forcedBody;
				expect(forcedResult.toolConfig).toBe(forcedBody.toolConfig);
				expect(forcedResult.tools.flatMap(group => group.functionDeclarations.map(tool => tool.name))).toEqual(["eval", "read", "write"]);
				const again = h.request(input, { ...gpt, api });
				const next = ("config" in again ? again.config : "request" in again ? again.request : again) as typeof body;
				expect(next.tools.flatMap(group => group.functionDeclarations.map(tool => tool.name))).toEqual(["eval", "write"]);
			}
		}
	});

	test("Anthropic prefixed tools project to native eval accessors without changing wire names", () => {
		const h = host();
		const choice = { type: "tool", name: "_bash" };
		const anchor = { type: "ephemeral" };
		const input = {
			tools: [
				{ name: "_eval", description: "eval", input_schema: js },
				{ name: "_bash", description: "bash", input_schema: args },
				{ name: "_write", description: "write", input_schema: args },
				{ name: "_read", description: "read", input_schema: args, cache_control: anchor },
			],
			tool_choice: choice,
		};
		const model = { api: "anthropic-messages" };
		const output = h.request(input, model);
		expect(output.tools.map(tool => tool.name)).toEqual(["_eval", "_bash", "_write"]);
		expect(output.tool_choice).toBe(choice);
		expect(output.tools[0]?.input_schema).toBe(js);
		expect(output.tools[0]?.description).toContain("await tool.read(args)");
		expect(output.tools[0]?.description).not.toContain("await tool._read(args)");
		expect(output.tools[2]?.cache_control).toBe(anchor);
		expect(h.warnings).toEqual([]);
		h.state.active = h.state.active.filter(name => name !== "eval");
		expect(h.request(input, model)).toBe(input);
		expect(host(["eval", "_eval", "read", "write", "bash"]).request(input, model)).toBe(input);
	});

	test("Anthropic retains its native tools-prefix anchor after hiding the anchored tool", () => {
		const h = host(["eval", "read", "write"]);
		const definition = (name: string): {
			name: string; description: string; input_schema: unknown;
			cache_control?: unknown; defer_loading?: boolean;
		} => ({ name, description: name, input_schema: name === "eval" ? js : args });
		for (const deferred of [false, true]) {
			for (const ttl of ["1h", "5m"]) {
				const anchor = { type: "ephemeral", ttl };
				const read = { ...definition("read"), cache_control: anchor };
				const write = { ...definition("write"), defer_loading: deferred };
				const input = {
					tools: [definition("eval"), ...(deferred ? [read, write] : [write, read])],
					system: [{ type: "text", text: "a changing system prefix" }],
				};
				const before = structuredClone(input);
				const output = h.request(input, { ...gpt, api: "anthropic-messages" });
				expect(input).toEqual(before);
				expect(output.tools.map(tool => tool.name)).toEqual(["eval", "write"]);
				expect(output.system).toBe(input.system);
				const target = output.tools.find(tool => tool.name === (deferred ? "eval" : "write"))!;
				expect(target.cache_control).toBe(anchor);
				expect(target.input_schema).toBe(deferred ? js : args);
				expect(output.tools.filter(tool => tool.cache_control != null)).toHaveLength(1);
				if (deferred) expect(output.tools[1]).toBe(write);
			}
		}
		const kept = { ...definition("write"), cache_control: { type: "ephemeral", ttl: "1h" } };
		const retained = h.request({ tools: [definition("eval"), kept, definition("read")] }, { ...gpt, api: "anthropic-messages" });
		expect(retained.tools[1]).toBe(kept);
		expect(retained.tools.filter(tool => tool.cache_control != null)).toHaveLength(1);
		const uncached = h.request({
			tools: [definition("eval"), definition("read")],
			system: [{ type: "text", text: "system-only anchor", cache_control: { type: "ephemeral" } }],
		}, { ...gpt, api: "anthropic-messages" });
		expect(uncached.tools.every(tool => tool.cache_control == null)).toBe(true);
	});

	test("Devin preserves named choices and proto metadata without advertising invalid schemas", () => {
		const h = host();
		const definition = (name: string) => ({
			name, description: `wire ${name}`, jsonSchemaString: JSON.stringify(name === "eval" ? js : args), strict: true,
		});
		const write = definition("write");
		const input = {
			tools: [definition("eval"), definition("read"), write],
			metadata: { session: 7n }, chatMessagePrompts: [],
			toolChoice: { choice: { case: "optionName", value: "auto" } },
		};
		const before = structuredClone(input);
		const output = h.request(input, { ...gpt, api: "devin-agent" });
		expect(input).toEqual(before);
		expect(output.tools.map(tool => tool.name)).toEqual(["eval", "write"]);
		expect(output.tools[1]).toBe(write);
		expect(output.metadata).toBe(input.metadata);
		expect(output.toolChoice).toBe(input.toolChoice);
		expect(output.tools[0]!.jsonSchemaString).toBe(input.tools[0]!.jsonSchemaString);
		expect(output.tools[0]!.description).toContain(`JSON Schema: ${JSON.stringify(args)}`);
		expect(h.warnings).toEqual([]);
		const forcedInput = { ...input, toolChoice: { choice: { case: "toolName", value: "read" } } };
		const forced = h.request(forcedInput, { ...gpt, api: "devin-agent" });
		expect(forced.tools.map(tool => tool.name)).toEqual(["eval", "read", "write"]);
		expect(forced.toolChoice).toBe(forcedInput.toolChoice);
		expect(forced.tools[1]).toBe(input.tools[1]);
		expect(forced.metadata).toBe(input.metadata);
		expect(h.request(input, { ...gpt, api: "devin-agent" }).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
		expect(h.warnings).toEqual([]);
		const invalid = { ...definition("read"), jsonSchemaString: "not JSON" };
		const kept = h.request({ ...input, tools: [definition("eval"), invalid, write] }, { ...gpt, api: "devin-agent" });
		expect(kept.tools.map(tool => tool.name)).toEqual(["eval", "read", "write"]);
		expect(kept.tools[1]).toBe(invalid);
		expect(kept.tools[0]!.description).not.toContain("await tool.read(args)");
		expect(h.warnings.some(message => message.includes("unprojected tools: read"))).toBe(true);
	});

	test("catalog follows live active/schema/description/policy changes for direct and discoverable tools", () => {
		const h = host();
		h.state.tools.push(native("mounted_only"));
		h.state.active.push("mounted_only");
		const payload = responses();
		const description = () => h.request(payload).tools[0].description;
		expect(description()).toContain("await tool.read(args)");
		expect(description()).toContain("await tool.mounted_only(args)");
		expect(description()).toContain("Read xd://mounted_only for current documentation and JSON Schema before first use.");
		h.state.active = h.state.active.filter(name => name !== "mounted_only");
		expect(description()).not.toContain("await tool.mounted_only(args)");
		h.state.active.push("mounted_only");
		expect(description()).toContain("await tool.mounted_only(args)");
		const read = payload.tools.find(tool => tool.name === "read")!;
		read.description = "new wire docs";
		read.parameters = structuredClone(args);
		(read.parameters as typeof args).properties.path.type = "number";
		h.state.tools.find(tool => tool.name === "read")!.description = "new native docs";
		h.state.tools.find(tool => tool.name === "read")!.promptGuidelines = ["new policy"];
		const current = description();
		expect(current).toContain("new wire docs");
		expect(current).toContain("new native docs");
		expect(current).toContain("new policy");
		expect(current).toContain('"path":{"type":"number"}');
		h.state.active = h.state.active.filter(name => name !== "read");
		const absent = h.request(payload);
		expect(absent.tools.some(tool => tool.name === "read")).toBe(true);
		expect(absent.tools[0].description).not.toContain("await tool.read(args)");
		h.state.active.push("read");
		expect(description()).toContain("await tool.read(args)");
	});

	test("discoverable tools share native accessors without duplicating schemas or advertising inactive and reserved tools", () => {
		const names = ["lsp", "recall", "mcp:search", "task", "todo"];
		const h = host(["eval", ...names, "checkpoint", "rewind", "new_context", "defined", "undefine"]);
		const payload = responses(["eval"]);
		const output = h.request(payload);
		expect(output.tools.map(tool => tool.name)).toEqual(["eval"]);
		const description = output.tools[0]!.description;
		for (const name of names) {
			const accessor = name.includes(":") ? `tool["${name}"]` : `tool.${name}`;
			expect(description).toContain(`await ${accessor}(args)`);
			expect(description).toContain(`Read xd://${name} for current documentation and JSON Schema before first use.`);
			expect(description).not.toContain(`native ${name}`);
			expect(description).not.toContain(`policy ${name}`);
		}
		expect(description).not.toContain("JSON Schema: ");
		for (const name of ["checkpoint", "rewind", "new_context", "defined", "undefine"]) {
			expect(description).not.toContain(`await tool.${name}(args)`);
		}
		expect(h.warnings).toEqual([]);
		h.state.active = h.state.active.filter(name => name !== "recall");
		expect(h.request(payload).tools[0]!.description).not.toContain("await tool.recall(args)");
		h.state.active.push("recall");
		expect(h.request(payload).tools[0]!.description).toContain("await tool.recall(args)");
		h.state.tools.find(tool => tool.name === "recall")!.parameters = undefined;
		expect(h.request(payload).tools[0]!.description).not.toContain("await tool.recall(args)");
	});

	test("dynamic forced choices remain direct and are never cached into the next request", () => {
		const h = host();
		const input = { ...responses(), tool_choice: { type: "function", name: "read" } };
		const forced = h.request(input);
		expect(forced.tools.map(tool => tool.name)).toEqual(["eval", "read", "write"]);
		expect(forced.tool_choice).toBe(input.tool_choice);
		expect(h.request(responses()).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
	});

	test("runtime availability selects Python first and invalidates the catalog without changing the wire schema", () => {
		const h = host();
		const input = responses();
		for (const [language, guidance] of [
			[{ enum: ["py", "js"] }, 'Prefer language="py"'],
			[{ const: "py" }, 'Use language="py" for code mode; JavaScript is not available.'],
			[{ oneOf: [{ const: "js" }] }, 'Use language="js" for code mode; Python is not available.'],
			[{ anyOf: [{ const: "js" }, { enum: ["py"] }] }, 'Prefer language="py"'],
		] as const) {
			const schema = { type: "object", properties: { language } };
			input.tools[0]!.parameters = schema;
			const output = h.request(input);
			expect(output.tools.map(tool => tool.name)).toEqual(["eval", "write"]);
			expect(output.tools[0]!.parameters).toBe(schema);
			expect(output.tools[0]!.description).toContain(guidance);
			expect(output.tools[0]!.description.match(/(?:Prefer|Use) language=/g)).toHaveLength(guidance.startsWith("Prefer") ? 2 : 1);
		}
		expect(h.warnings).toEqual([]);
	});

	test("missing eval/runtime/schema or unsupported payload never grants access; diagnostics reset with every session lifecycle", () => {
		for (const event of ["session_start", "session_switch", "session_branch", "session_tree", "session_shutdown"]) {
			const h = host();
			const input = { ...responses(), tools: [responseTool("read")] };
			expect(h.request(input)).toBe(input);
			expect(h.request(input)).toBe(input);
			expect(h.warnings).toHaveLength(1);
			h.reset(event);
			expect(h.request(input)).toBe(input);
			expect(h.warnings).toHaveLength(2);
			expect(h.request(responses()).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
		}
		const h = host();
		for (const input of [
			{ tools: [responseTool("eval", { type: "object", properties: { language: { enum: ["ruby"] } } }), responseTool("read")] },
			{ tools: [responseTool("eval", {}), responseTool("read")] },
			{ tools: "not a known schema list" },
		]) expect(h.request(input)).toBe(input);
		const unknown = responses();
		expect(h.request(unknown, { ...gpt, api: "unknown-api" })).toBe(unknown);
		h.state.active = ["read", "write"];
		expect(h.request(responses())).toEqual(responses());
		const schemaLess = host();
		schemaLess.state.tools = schemaLess.state.tools.map(tool => ({ ...tool, description: undefined, parameters: undefined }));
		const input = responses();
		expect(schemaLess.request(input)).toBe(input);
		expect(schemaLess.warnings.some(message => message.includes("no bridge catalog"))).toBe(true);
	});
});
