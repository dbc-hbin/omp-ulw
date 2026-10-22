import { describe, expect, test } from "bun:test";
import { rewritePresetPayload, rewriteTaskGuidancePayload } from "./payload";
import { adaptResearchRouting } from "./host";

const oldPreset = "<omp-model-preset>old profile</omp-model-preset>";
const newPreset = "<omp-model-preset>new profile $& $` $' $$</omp-model-preset>";
const oldText = `Host instructions\n\n${oldPreset}\n\nProject rules`;
const newText = `Host instructions\n\n${newPreset}\n\nProject rules`;

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
		const result = rewriteTaskGuidancePayload(input, api);
		expect(result).toEqual({ ...expected, messages, metadata: { description } });
		expect(input).toEqual(snapshot);
		expect(rewriteTaskGuidancePayload(result, api)).toBe(result);
	}
	const custom = { tools: [{ type: "function", function: { ...task, description: "User-authored task contract" } }] };
	expect(rewriteTaskGuidancePayload(custom, "openai-completions")).toBe(custom);
	const unknown = { tools: [task], messages };
	expect(rewriteTaskGuidancePayload(unknown, "unknown-api")).toBe(unknown);
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
