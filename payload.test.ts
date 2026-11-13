import { describe, expect, test } from "bun:test";
import { rewritePresetPayload, rewriteToolGuidancePayload } from "./payload";
import { adaptResearchRouting } from "./host";
import { adaptToolGuidance } from "./host-guidance";
import { renderPreset } from "./presets";

const oldPreset = "<omp-model-preset>old profile</omp-model-preset>";
const newPreset = "<omp-model-preset>new profile $& $` $' $$</omp-model-preset>";
const oldText = `Host instructions\n\n${oldPreset}\n\nProject rules`;
const newText = `Host instructions\n\n${newPreset}\n\nProject rules`;

// Pinned v18.19.0 todo.md and eval.md mechanics; model appendices remain their sole duplicate owner.
const nativeTodo = [
	"`todo` NEVER takes a turn of its own: emit it in the same response as your next real tool call (parallel tool calls), `init` beside the first read or action, `done`/`start` beside the next action or check. A response whose only call is `todo` wastes a full model round trip.",
	"Tasks identified by verbatim content, NEVER generated IDs (task-1). Unique, stable task/phase names; lost text: view, NEVER guess.",
	"`append` requires `items`; omitted `phase` uses the in-progress task's phase, else the first pending task's phase, else the last phase, else a new `Tasks` phase. Supply `phase` to target another phase; an empty name is invalid.",
	"Before work, init for 3+ steps, requested task sets, or new instructions. MUST list EVERY user item separately (phased/numbered/bulleted/N); NEVER omit or remember leftovers.",
	"After successful mutation: no active means earliest pending starts (phase order); multiple active means only earliest stays. Done out of order may rewind pointer but NEVER reopen completed. Mark done immediately; follow phase order.",
].join("\n");
const nativeShBlocks = [
	[
		"sh(command, cwd?, timeout?); JS: await sh(…) or await sh`cmd ${arg}` — embedded bash engine, runs to completion (never backgrounded)",
		"  returns stdout+stderr; non-zero exit raises ShellError (.exit_code/.exitCode, .output)",
		"  JS interpolations are shell-quoted; starts in the session cwd unless cwd is given",
	].join("\n"),
	[
		"sh(command, cwd?, timeout?) — embedded bash engine, runs to completion (never backgrounded)",
		"  returns stdout+stderr; non-zero exit raises ShellError (`.exit_code`, `.output`); starts in the session cwd unless `cwd` is given",
	].join("\n"),
	[
		"await sh(command, { cwd?, timeout? })  await sh`cmd ${arg}` — embedded bash engine, runs to completion (never backgrounded)",
		"  resolves to stdout+stderr; non-zero exit throws ShellError (`.exitCode`, `.output`)",
		"  interpolations are shell-quoted; starts in the session cwd unless `cwd` is given",
	].join("\n"),
];
const workpoolRule = "For 2+ independent items, use a named `workpool()`; results auto-deliver.";
const shellRule = "Use `sh()` only when the live eval documentation exposes it, for short commands. It runs to completion without auto-backgrounding and uses persistent shell state separate from the bash tool; do not assume variables or functions transfer between them.";
const profile = renderPreset({ id: "gpt-6.1-terra" }, { surface: "app", toolNames: ["todo", "eval", "bash"] })!.prompt;
function nativeEval(sh: string): string {
	return [
		"One cell per call; top-level state persists, including across compaction.", workpoolRule,
		"On error, retry only the failed step; earlier steps may have taken effect.",
		"<prelude>", "`await` marks async helpers; the rest are sync.", "```",
		"print(value, ...)  log(message)  phase(title)  env(key?, value?)",
		"read(path, offset?, limit?)  write(path, content)  output(*ids, format?, query?, offset?, limit?)",
		"wait(handles, timeout?=None, raise_errors?=True)", "await tool.<name>(args)", sh,
		"```", "Session tool names: read, bash, todo.", "</prelude>",
		"<namespaces>More globals → xd://eval/helpers</namespaces>",
		"<critical>NEVER repeat successful setup. Kernel-loss notice means reload setup.</critical>",
		"Long cells may auto-background and deliver later; the kernel stays busy.",
		"`timeout: 0` disables the cell deadline, not the foreground wait.",
	].join("\n");
}

test("native todo deduplication keeps every mechanism and requires complete active-profile coverage", () => {
	const parallelAdapted = nativeTodo.replace(" (parallel tool calls)", "");
	const expected = parallelAdapted
		.replace("`todo` NEVER takes a turn of its own: emit it in the same response as your next real tool call, ", "")
		.replace(" A response whose only call is `todo` wastes a full model round trip.", "");
	expect(profile).toMatch(/Never make a todo-only turn: (?:send|emit) todo in the same response as the next real tool call\./);
	for (const description of [nativeTodo, parallelAdapted]) {
		expect(adaptToolGuidance("todo", description, profile)).toBe(expected);
		for (const verb of ["send", "emit"]) {
			expect(adaptToolGuidance("todo", description, `Never make a todo-only turn: ${verb} todo in the same response as the next real tool call.`)).toBe(expected);
		}
	}
	for (const missing of ["", newPreset, "Never make a todo-only turn.", "Emit todo in the same response as the next real tool call."]) {
		expect(adaptToolGuidance("todo", nativeTodo, missing)).toBe(parallelAdapted);
	}
	for (const custom of [
		"Custom todo: " + nativeTodo,
		nativeTodo.replace("as your next real tool call", "before the next real tool call"),
		nativeTodo.replace("`init` beside the first read or action", "`init` before the first action"),
		nativeTodo.replace("A response whose only call is `todo` wastes a full model round trip.", "A todo-only response is forbidden."),
	]) {
		expect(adaptToolGuidance("todo", custom, profile)).toBe(custom.startsWith("`todo`") ? custom.replace(" (parallel tool calls)", "") : custom);
	}
	expect(adaptToolGuidance("custom_todo", nativeTodo, profile)).toBe(nativeTodo);
});

test("native eval deduplication recognizes all sh contracts without changing helpers or cell lifecycle", () => {
	expect(profile).toContain(shellRule);
	for (const sh of nativeShBlocks) {
		const description = nativeEval(sh);
		const parallelAdapted = description.replace(workpoolRule, "`workpool()` results auto-deliver.");
		const expected = parallelAdapted.replace(", runs to completion (never backgrounded)", "");
		expect(adaptToolGuidance("eval", description, profile)).toBe(expected);
		expect(adaptToolGuidance("eval", expected, profile)).toBe(expected);
		for (const missing of ["", newPreset, profile.replace(shellRule, ""), profile.replace("without auto-backgrounding", ""), profile.replace("runs to completion", "is never backgrounded")]) {
			expect(adaptToolGuidance("eval", description, missing)).toBe(parallelAdapted);
		}
		for (const custom of [
			description.replace("One cell per call; top-level state persists, including across compaction.", "One cell per call; custom execution."),
			description.replace("embedded bash engine", "external bash process"),
			description.replace("runs to completion (never backgrounded)", "runs to completion; never backgrounded"),
			description.replace("ShellError", "CustomError"),
		]) {
			expect(adaptToolGuidance("eval", custom, profile)).toBe(custom.replace(workpoolRule, "`workpool()` results auto-deliver."));
		}
		expect(adaptToolGuidance("eval", "Custom eval\n" + description, profile)).toBe("Custom eval\n" + description);
		expect(adaptToolGuidance("custom_eval", description, profile)).toBe(description);
	}
});

test("native duplicate rewriting preserves schemas and user text across provider tool paths", () => {
	const description = nativeEval(nativeShBlocks[0]);
	const schema = { type: "object", description: nativeTodo, properties: { command: { type: "string", description } } };
	const definitions = [
		{ name: "todo", description: nativeTodo, parameters: schema, strict: true },
		{ name: "eval", description, parameters: schema, strict: true },
		{ name: "custom_todo", description: nativeTodo, parameters: schema },
	];
	const changed = definitions.map(tool => ({ ...tool, description: adaptToolGuidance(tool.name, tool.description, profile) }));
	const messages = [{ role: "system", content: profile }, { role: "user", content: profile + nativeTodo + description }, { role: "tool", content: nativeTodo + description }];
	const shapes = [
		{ api: "openai-responses", wrap: (tools: typeof definitions) => ({ tools: tools.map(tool => ({ type: "function", ...tool })) }) },
		{ api: "openai-codex-responses", wrap: (tools: typeof definitions) => ({ tools: [{ type: "namespace", name: "functions", tools: tools.map(tool => ({ type: "function", ...tool })) }] }) },
		{ api: "openai-completions", wrap: (tools: typeof definitions) => ({ tools: tools.map(tool => ({ type: "function", function: tool })) }) },
		{ api: "anthropic-messages", wrap: (tools: typeof definitions) => ({ tools: tools.map(({ parameters, ...tool }) => ({ ...tool, input_schema: parameters, cache_control: { type: "ephemeral" } })) }) },
		{ api: "google-generative-ai", wrap: (tools: typeof definitions) => ({ config: { tools: [{ functionDeclarations: tools }] } }) },
		{ api: "google-vertex", wrap: (tools: typeof definitions) => ({ tools: [{ functionDeclarations: tools }] }) },
		{ api: "google-gemini-cli", wrap: (tools: typeof definitions) => ({ request: { tools: [{ functionDeclarations: tools }] } }) },
		{ api: "bedrock-converse-stream", wrap: (tools: typeof definitions) => ({ toolConfig: { tools: tools.map(toolSpec => ({ toolSpec })) } }) },
		{ api: "bedrock-converse-stream", wrap: (tools: typeof definitions) => ({ commandInput: { toolConfig: { tools: tools.map(toolSpec => ({ toolSpec })) } } }) },
	];
	for (const { api, wrap } of shapes) {
		const payload = { ...wrap(definitions), messages, metadata: { description: nativeTodo } };
		const snapshot = structuredClone(payload);
		const result = rewriteToolGuidancePayload(payload, api, profile);
		expect(result).toEqual({ ...wrap(changed), messages, metadata: payload.metadata });
		expect(payload).toEqual(snapshot);
		expect(rewriteToolGuidancePayload(result, api, profile)).toBe(result);
		// Arbitrary system/user content is never evidence of profile coverage.
		const retained = definitions.map(tool => ({ ...tool, description: adaptToolGuidance(tool.name, tool.description, "") }));
		expect(rewriteToolGuidancePayload(payload, api, "")).toEqual({ ...wrap(retained), messages, metadata: payload.metadata });
	}
	const unknown = { tools: definitions, messages };
	expect(rewriteToolGuidancePayload(unknown, "unknown-api", profile)).toBe(unknown);
});

test("task routing adaptation preserves transport structure, schemas, unrelated tools and messages", () => {
	const description = "Read-only research MUST use `scout` only when files unknown.";
	const schema = { type: "object", properties: { tasks: { type: "array" } }, required: ["tasks"] };
	const task = { name: "task", description, parameters: schema, strict: true };
	const other = { name: "custom_task", description, parameters: schema };
	const changed = { ...task, description: adaptResearchRouting(description) };
	expect(changed.description).not.toBe(description);
	const messages = [{ role: "user", content: description }, { role: "tool", content: description }];
	const shapes = [
		{ api: "openai-responses", payload: { tools: [{ type: "function", ...task }, { type: "function", ...other }] }, expected: { tools: [{ type: "function", ...changed }, { type: "function", ...other }] } },
		{ api: "openai-codex-responses", payload: { tools: [{ type: "namespace", name: "functions", tools: [{ type: "function", ...task }] }, { type: "namespace", name: "custom", tools: [{ type: "function", ...task }] }] }, expected: { tools: [{ type: "namespace", name: "functions", tools: [{ type: "function", ...changed }] }, { type: "namespace", name: "custom", tools: [{ type: "function", ...task }] }] } },
		{ api: "openai-completions", payload: { tools: [{ type: "function", function: task }, { type: "function", function: other }] }, expected: { tools: [{ type: "function", function: changed }, { type: "function", function: other }] } },
		{ api: "anthropic-messages", payload: { tools: [{ name: task.name, description, input_schema: schema, cache_control: { type: "ephemeral" } }, other] }, expected: { tools: [{ name: task.name, description: changed.description, input_schema: schema, cache_control: { type: "ephemeral" } }, other] } },
		{ api: "google-generative-ai", payload: { config: { tools: [{ functionDeclarations: [task, other] }] } }, expected: { config: { tools: [{ functionDeclarations: [changed, other] }] } } },
		{ api: "google-vertex", payload: { tools: [{ functionDeclarations: [task] }] }, expected: { tools: [{ functionDeclarations: [changed] }] } },
		{ api: "google-gemini-cli", payload: { request: { tools: [{ functionDeclarations: [task] }] } }, expected: { request: { tools: [{ functionDeclarations: [changed] }] } } },
		{ api: "bedrock-converse-stream", payload: { toolConfig: { tools: [{ toolSpec: task }] } }, expected: { toolConfig: { tools: [{ toolSpec: changed }] } } },
		{ api: "bedrock-converse-stream", payload: { commandInput: { toolConfig: { tools: [{ toolSpec: task }] } } }, expected: { commandInput: { toolConfig: { tools: [{ toolSpec: changed }] } } } },
	];
	for (const { api, payload, expected } of shapes) {
		const input = { ...payload, messages, metadata: { description } };
		const snapshot = structuredClone(input);
		const result = rewriteToolGuidancePayload(input, api, newPreset);
		expect(result).toEqual({ ...expected, messages, metadata: { description } });
		expect(input).toEqual(snapshot);
		expect(rewriteToolGuidancePayload(result, api, newPreset)).toBe(result);
	}
	const custom = { tools: [{ type: "function", function: { ...task, description: "User-authored task contract" } }] };
	expect(rewriteToolGuidancePayload(custom, "openai-completions", newPreset)).toBe(custom);
	const unknown = { tools: [task], messages };
	expect(rewriteToolGuidancePayload(unknown, "unknown-api", newPreset)).toBe(unknown);
});

const realisticShapes: { api: string; payload: unknown; expected: unknown }[] = [
	... ["ollama", "ollama-chat"].map(api => ({
		api,
		payload: { model: "qwen3", messages: [{ role: "system", content: oldText }, { role: "user", content: oldPreset }, { role: "tool", content: oldPreset, tool_name: "shell" }], stream: true, think: true, options: { num_ctx: 32768 } },
		expected: { model: "qwen3", messages: [{ role: "system", content: newText }, { role: "user", content: oldPreset }, { role: "tool", content: oldPreset, tool_name: "shell" }], stream: true, think: true, options: { num_ctx: 32768 } },
	})),
	{
		api: "cursor-agent",
		payload: { $typeName: "agent.v1.AgentRunRequest", customSystemPrompt: oldText, conversationId: "c1", conversationState: { rootPromptMessagesJson: [new Uint8Array([1, 2, 3])] }, action: { case: "userMessage", value: { text: oldPreset } }, requestedModel: { modelId: "gpt-5.4" } },
		expected: { $typeName: "agent.v1.AgentRunRequest", customSystemPrompt: newText, conversationId: "c1", conversationState: { rootPromptMessagesJson: [new Uint8Array([1, 2, 3])] }, action: { case: "userMessage", value: { text: oldPreset } }, requestedModel: { modelId: "gpt-5.4" } },
	},
	... ["gitlab-duo-workflow", "gitlab-duo-agent"].flatMap(api => [false, true].map(wrapped => {
		const prompt = { name: "omp-inline", prompt_id: "omp-inline", unit_primitives: ["duo_agent_platform"], prompt_template: { system: oldText, user: oldPreset, placeholder: "history" } };
		const flowConfig = { version: "v1", environment: "ambient", prompts: [prompt], components: [{ name: "agent", type: "AgentComponent" }] };
		const payload = { flowConfig, flowConfigSchemaVersion: "v1", goal: oldPreset, mcpTools: [], workflowID: "w1" };
		const expected = { ...payload, flowConfig: { ...flowConfig, prompts: [{ ...prompt, prompt_template: { ...prompt.prompt_template, system: newText } }] } };
		return { api, payload: wrapped ? { startRequest: payload } : payload, expected: wrapped ? { startRequest: expected } : expected };
	})),
	... ["openai-responses", "azure-openai-responses", "openai-codex-responses"].map(api => ({
		api,
		payload: {
			model: "gpt-5.4", instructions: oldText, stream: true,
			input: [{ role: "user", content: oldPreset }],
			prompt_cache_key: "session", client_metadata: { turn: "abc" },
		},
		expected: {
			model: "gpt-5.4", instructions: newText, stream: true,
			input: [{ role: "user", content: oldPreset }],
			prompt_cache_key: "session", client_metadata: { turn: "abc" },
		},
	})),
	{
		api: "openai-codex-responses",
		payload: {
			type: "response.create", instructions: "Host prefix", previous_response_id: "resp_1",
			input: [
				{ role: "developer", content: oldText },
				{ role: "system", type: "message", content: [{ type: "input_text", text: oldPreset }] },
				{ type: "function_call_output", call_id: "call_1", output: oldPreset },
			],
		},
		expected: {
			type: "response.create", instructions: "Host prefix", previous_response_id: "resp_1",
			input: [
				{ role: "developer", content: newText },
				{ role: "system", type: "message", content: [{ type: "input_text", text: newPreset }] },
				{ type: "function_call_output", call_id: "call_1", output: oldPreset },
			],
		},
	},
	... ["openai-completions", "openrouter"].map(api => ({
		api,
		payload: {
			model: "gpt-5", messages: [
				{ role: "system", content: "Host prefix" },
				{ role: "developer", content: oldText, name: "policy" },
				{ role: "system", content: [{ type: "text", text: oldPreset, cache_control: { type: "ephemeral" } }] },
				{ role: "user", content: [{ type: "text", text: oldPreset }] },
				{ role: "tool", tool_call_id: "t1", content: oldPreset },
				{ role: "assistant", content: oldPreset },
			], tools: [{ type: "function", function: { name: "shell", description: oldPreset } }],
		},
		expected: {
			model: "gpt-5", messages: [
				{ role: "system", content: "Host prefix" },
				{ role: "developer", content: newText, name: "policy" },
				{ role: "system", content: [{ type: "text", text: newPreset, cache_control: { type: "ephemeral" } }] },
				{ role: "user", content: [{ type: "text", text: oldPreset }] },
				{ role: "tool", tool_call_id: "t1", content: oldPreset },
				{ role: "assistant", content: oldPreset },
			], tools: [{ type: "function", function: { name: "shell", description: oldPreset } }],
		},
	})),
	{
		api: "anthropic-messages",
		payload: {
			model: "claude-opus-4-6", system: [
				{ type: "text", text: "OAuth billing prefix" },
				{ type: "text", text: oldText, cache_control: { type: "ephemeral", ttl: "1h" }, extra: "keep" },
			], messages: [{ role: "user", content: [{ type: "text", text: oldPreset }] }],
			metadata: { user_id: "account-session" }, max_tokens: 8192,
		},
		expected: {
			model: "claude-opus-4-6", system: [
				{ type: "text", text: "OAuth billing prefix" },
				{ type: "text", text: newText, cache_control: { type: "ephemeral", ttl: "1h" }, extra: "keep" },
			], messages: [{ role: "user", content: [{ type: "text", text: oldPreset }] }],
			metadata: { user_id: "account-session" }, max_tokens: 8192,
		},
	},
	{ api: "anthropic-messages", payload: { system: oldText }, expected: { system: newText } },
	... ["google-generative-ai", "google-vertex"].flatMap(api => [
		{
			api,
			payload: { model: "gemini-3-pro", config: { systemInstruction: { parts: [{ text: oldText }] }, temperature: 0.5 }, contents: [{ role: "user", parts: [{ text: oldPreset }] }] },
			expected: { model: "gemini-3-pro", config: { systemInstruction: { parts: [{ text: newText }] }, temperature: 0.5 }, contents: [{ role: "user", parts: [{ text: oldPreset }] }] },
		},
		{
			api,
			payload: { systemInstruction: { role: "system", parts: [{ text: "Host prefix" }, { text: oldText }] }, generationConfig: { maxOutputTokens: 4096 } },
			expected: { systemInstruction: { role: "system", parts: [{ text: "Host prefix" }, { text: newText }] }, generationConfig: { maxOutputTokens: 4096 } },
		},
	]),
	{
		api: "google-gemini-cli",
		payload: { project: "project-1", model: "gemini-3-pro", request: { systemInstruction: { role: "user", parts: [{ text: oldText }] }, contents: [{ role: "user", parts: [{ text: oldPreset }] }], sessionId: "s1" }, requestId: "req-1" },
		expected: { project: "project-1", model: "gemini-3-pro", request: { systemInstruction: { role: "user", parts: [{ text: newText }] }, contents: [{ role: "user", parts: [{ text: oldPreset }] }], sessionId: "s1" }, requestId: "req-1" },
	},
	... [false, true].map(wrapped => {
		const payload = { system: [{ text: oldText }, { cachePoint: { type: "default", ttl: "1h" } }], messages: [{ role: "user", content: [{ text: oldPreset }] }], inferenceConfig: { maxTokens: 8192 } };
		const expected = { ...payload, system: [{ text: newText }, { cachePoint: { type: "default", ttl: "1h" } }] };
		return { api: "bedrock-converse-stream", payload: wrapped ? { commandInput: payload } : payload, expected: wrapped ? { commandInput: expected } : expected };
	}),
];

describe("rewritePresetPayload", () => {
	test("legacy markers migrate only in system fields and mismatched tags stay untouched", () => {
		const legacy = "<omo-model-preset>old profile</omo-model-preset>";
		const payload = { instructions: legacy, input: [{ role: "user", content: legacy }] };
		expect(rewritePresetPayload(payload, "openai-responses", newPreset)).toEqual({ ...payload, instructions: newPreset });
		const malformed = { instructions: "<omo-model-preset>old profile</omp-model-preset>" };
		expect(rewritePresetPayload(malformed, "openai-responses", newPreset)).toBe(malformed);
	});

	for (const [index, shape] of realisticShapes.entries()) {
		test(`${shape.api} realistic shape ${index}: scoped, immutable, idempotent`, () => {
			const snapshot = structuredClone(shape.payload);
			const rewritten = rewritePresetPayload(shape.payload, shape.api, newPreset);
			expect(rewritten).toEqual(shape.expected);
			expect(shape.payload).toEqual(snapshot);
			expect(rewritePresetPayload(rewritten, shape.api, newPreset)).toBe(rewritten);
			// A later profile switch must replace the current marked region, not append.
			expect(rewritePresetPayload(rewritten, shape.api, oldPreset)).toEqual(shape.payload);
		});
	}

	test("missing system marker and user-only marker preserve original identity", () => {
		const payload = { instructions: "Host rules", input: [{ role: "user", content: oldPreset }], metadata: { text: oldPreset } };
		expect(rewritePresetPayload(payload, "openai-responses", newPreset)).toBe(payload);
	});

	test("additional providers do not scan user content, blob IDs, or workflow goals", () => {
		for (const api of ["ollama", "ollama-chat", "cursor-agent", "gitlab-duo-workflow", "gitlab-duo-agent"]) {
			const payload = { messages: [{ role: "user", content: oldPreset }], customSystemPrompt: "Host rules", action: { text: oldPreset }, conversationState: { rootPromptMessagesJson: [new Uint8Array([1, 2, 3])] }, flowConfig: { prompts: [{ prompt_template: { system: "Host rules", user: oldPreset } }] }, goal: oldPreset };
			expect(rewritePresetPayload(payload, api, newPreset)).toBe(payload);
		}
	});

	test("unsupported APIs and malformed shapes preserve original identity", () => {
		for (const payload of [null, undefined, 42, oldPreset, [], { input: oldPreset }, { instructions: { text: oldPreset } }, { input: [{ role: "developer", content: [{ type: "image_url", text: oldPreset }] }] }]) {
			expect(rewritePresetPayload(payload, "openai-responses", newPreset)).toBe(payload);
		}
		const payload = { instructions: oldPreset, system: oldPreset };
		expect(rewritePresetPayload(payload, "unknown-api", newPreset)).toBe(payload);
	});

	test("incomplete or cross-block markers are not rewritten", () => {
		const payload = { system: [{ type: "text", text: "prefix <omp-model-preset>old" }, { type: "text", text: "profile</omp-model-preset> suffix" }] };
		expect(rewritePresetPayload(payload, "anthropic-messages", newPreset)).toBe(payload);
	});

	test("multiple complete regions preserve surrounding bytes", () => {
		const payload = { instructions: `A${oldPreset}\r\nB${oldPreset}C` };
		expect(rewritePresetPayload(payload, "openai-responses", newPreset)).toEqual({ instructions: `A${newPreset}\r\nB${newPreset}C` });
	});

	test("unchanged Anthropic blocks and cache metadata retain reference identity", () => {
		const cache = { type: "ephemeral", ttl: "1h" };
		const prefix = { type: "text", text: "Host prefix" };
		const user = { role: "user", content: oldPreset };
		const payload = { system: [prefix, { type: "text", text: oldPreset, cache_control: cache }], messages: [user] };
		const rewritten = rewritePresetPayload(payload, "anthropic-messages", newPreset);
		expect(rewritten).toEqual({ ...payload, system: [prefix, { type: "text", text: newPreset, cache_control: cache }] });
		if (typeof rewritten !== "object" || rewritten === null || !("system" in rewritten) || !Array.isArray(rewritten.system)) throw new Error("Expected rewritten system blocks");
		expect(rewritten.system[0]).toBe(prefix);
		const block: unknown = rewritten.system[1];
		if (typeof block !== "object" || block === null || !("cache_control" in block)) throw new Error("Expected cache metadata");
		expect(block.cache_control).toBe(cache);
		if (!("messages" in rewritten)) throw new Error("Expected unchanged messages");
		expect(rewritten.messages).toBe(payload.messages);
	});
});
