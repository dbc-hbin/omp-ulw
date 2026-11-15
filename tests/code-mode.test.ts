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
type Model = NonNullable<Parameters<Parameters<CodeModeApi["on"]>[1]>[1]["model"]>;

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

describe("GPT request-local code mode", () => {
	test("canonical GPT aliases and normalized GPT names work across providers, never by API/provider alone", () => {
		const h = host();
		const input = responses();
		for (const model of [
			gpt,
			{ ...gpt, id: "openai/gpt-6.1-sol", identity: undefined, provider: "openrouter" },
			{ ...gpt, id: "opaque", name: "GPT 6.1 Sol", identity: { class: "unknown" } },
		]) expect(h.request(input, model).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
		for (const model of [
			{ ...gpt, id: "claude-opus", provider: "openai-codex", identity: { class: "anthropic", family: "claude" } },
			{ ...gpt, id: "llama", name: "Llama", identity: undefined },
			{ ...gpt, id: "gpt-image-2", name: "GPT Image 2", identity: undefined },
			{ ...gpt, id: "notgpt-6", name: "NotGPT", identity: undefined },
			{ ...gpt, id: "gpt-alias", identity: { class: "anthropic", family: "claude" } },
		]) expect(h.request(input, model)).toBe(input);
		// The same provider/id and object can change lineage in place.
		const mutable = { ...gpt, identity: { class: "openai", family: "gpt" } };
		expect(h.request(input, mutable)).not.toBe(input);
		mutable.identity.class = "anthropic";
		mutable.identity.family = "claude";
		expect(h.request(input, mutable)).toBe(input);
		mutable.identity.class = "openai";
		mutable.identity.family = "gpt";
		expect(h.request(input, mutable)).not.toBe(input);
	});

	test("canonical Codex GPT variants, ChatGPT and GPT OSS stay in scope without weakening unrelated lineage vetoes", () => {
		const h = host();
		const input = responses();
		for (const model of [
			{ ...gpt, id: "gpt-5.3-codex", identity: { class: "openai", family: "codex" } },
			{ ...gpt, id: "opaque", identity: { class: "openai", family: "codex", logicalId: "gpt-5.3-codex" } },
			{ ...gpt, id: "opaque", name: "GPT 5.3 Codex Spark", identity: { class: "openai", family: "codex-spark" } },
			{ ...gpt, id: "chatgpt-latest", identity: { class: "openai", family: "chatgpt" } },
			{ ...gpt, id: "gpt-oss-120b", provider: "openrouter", identity: { class: "gpt-oss", family: "120b" } },
			{ ...gpt, id: "private-oss-alias", provider: "venice", identity: { class: "gpt-oss", family: "20b" } },
		]) expect(h.request(input, model).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
		for (const model of [
			{ ...gpt, id: "codex-other", identity: { class: "openai", family: "codex" } },
			{ ...gpt, id: "gpt-oss-alias", provider: "openai-codex", identity: { class: "anthropic", family: "claude" } },
			{ ...gpt, id: "gpt-alias", identity: { class: "qwen", family: "qwen3" } },
		]) expect(h.request(input, model)).toBe(input);
	});

	test("Responses namespace/custom filtering retains metadata and never mutates incoming payload", () => {
		const names = ["eval", "read", "edit", "write", "task", "checkpoint", "rewind", "new_context", "ask", "wait", "todo", "yield", "think"];
		const h = host(names);
		const direct = names.filter(name => !["read", "edit"].includes(name));
		const kept = direct.filter(name => name !== "eval").map(name => ({ ...responseTool(name), cache_control: { type: "ephemeral" } }));
		const custom = { type: "custom", name: "edit", description: "freeform edit", format: { type: "grammar", definition: "patch" }, vendor: 42 };
		const unmatched = { type: "custom", name: "apply_patch", format: { type: "grammar", definition: "patch" } };
		const input = {
			...responses([]),
			tools: [{ type: "namespace", name: "functions", description: "namespace metadata", tools: [
				responseTool("eval", js), responseTool("read"), custom, ...kept, unmatched,
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
		expect(tools.map(tool => tool.name)).toEqual(["eval", ...kept.map(tool => tool.name), "apply_patch"]);
		for (const entry of kept) expect(tools.find(tool => tool.name === entry.name)).toBe(entry);
		expect(tools.at(-1)).toBe(unmatched);
		const evaluation = tools[0] as ReturnType<typeof responseTool>;
		expect(evaluation.parameters).toBe(js);
		expect(evaluation.strict).toBe(true);
		expect(evaluation.description).toContain(`JSON Schema: ${JSON.stringify(args)}`);
		expect(evaluation.description).toContain("await tool.read(args)");
		expect(evaluation.description).toContain("await tool.edit(args)");
		expect(evaluation.description).toContain('Direct custom wire format (bridge still takes JSON args): {"type":"grammar","definition":"patch"}');
		expect(evaluation.description).not.toContain("await tool.task(args)");
		expect(evaluation.description).not.toContain("await tool.checkpoint(args)");
		expect(evaluation.description).not.toContain("await tool.new_context(args)");
		expect(h.warnings.some(message => message.includes("apply_patch"))).toBe(true);
	});

	test("current GPT transports filter actual schema arrays, retaining provider metadata", () => {
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

	test("catalog follows live active/schema/description/policy changes, not mounted-only tools or old renders", () => {
		const h = host();
		h.state.tools.push(native("mounted_only"));
		h.state.active.push("mounted_only");
		const payload = responses();
		const description = () => h.request(payload).tools[0].description;
		expect(description()).toContain("await tool.read(args)");
		expect(description()).not.toContain("await tool.mounted_only(args)");
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

	test("dynamic forced choices remain direct and are never cached into the next request", () => {
		const h = host();
		const input = { ...responses(), tool_choice: { type: "function", name: "read" } };
		const forced = h.request(input);
		expect(forced.tools.map(tool => tool.name)).toEqual(["eval", "read", "write"]);
		expect(forced.tool_choice).toBe(input.tool_choice);
		expect(h.request(responses()).tools.map(tool => tool.name)).toEqual(["eval", "write"]);
	});

	test("missing eval/JS/schema or unsupported payload never grants access; diagnostics reset with every session lifecycle", () => {
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
			{ tools: [responseTool("eval", { type: "object", properties: { language: { enum: ["py"] } } }), responseTool("read")] },
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
