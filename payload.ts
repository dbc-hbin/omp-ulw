import { adaptResearchRouting } from "./host";

const PRESET_REGION = /<(om[op]-model-preset)>[\s\S]*?<\/\1>/g;

type PayloadObject = Record<string, unknown>;

function payloadObject(value: unknown): PayloadObject | undefined {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
	return value as PayloadObject;
}

function rewriteText(value: unknown, replacement: string, region: RegExp): unknown {
	if (typeof value !== "string") return value;
	// Callback replacement keeps literal dollar sequences in preset text intact.
	return value.replace(region, () => replacement);
}

function rewriteField(object: PayloadObject, key: string, rewrite: (value: unknown) => unknown): PayloadObject {
	const value = object[key];
	const rewritten = rewrite(value);
	return rewritten === value ? object : { ...object, [key]: rewritten };
}

function rewriteArray(value: unknown, rewrite: (item: unknown) => unknown): unknown {
	if (!Array.isArray(value)) return value;
	let result: unknown[] | undefined;
	for (let index = 0; index < value.length; index++) {
		const item: unknown = value[index];
		const rewritten = rewrite(item);
		if (rewritten !== item) {
			result ??= value.slice();
			result[index] = rewritten;
		}
	}
	return result ?? value;
}

function rewriteBlocks(value: unknown, replacement: string, typed: boolean, region: RegExp): unknown {
	if (typeof value === "string") return rewriteText(value, replacement, region);
	return rewriteArray(value, block => {
		const object = payloadObject(block);
		if (!object || (typed && object.type !== "text" && object.type !== "input_text")) return block;
		return rewriteField(object, "text", text => rewriteText(text, replacement, region));
	});
}

function rewriteMessages(value: unknown, replacement: string, region: RegExp): unknown {
	return rewriteArray(value, message => {
		const object = payloadObject(message);
		if (!object || (object.role !== "system" && object.role !== "developer")) return message;
		// Responses tool items may have unrelated fields; only message content is eligible.
		if (object.type !== undefined && object.type !== "message") return message;
		return rewriteField(object, "content", content => rewriteBlocks(content, replacement, true, region));
	});
}

function rewriteGoogle(object: PayloadObject, replacement: string, region: RegExp): PayloadObject {
	return rewriteField(object, "systemInstruction", instruction => {
		if (typeof instruction === "string") return rewriteText(instruction, replacement, region);
		const content = payloadObject(instruction);
		if (!content) return instruction;
		return rewriteField(content, "parts", parts => rewriteBlocks(parts, replacement, false, region));
	});
}

function rewriteGitLabFlow(object: PayloadObject, replacement: string, region: RegExp): PayloadObject {
	return rewriteField(object, "flowConfig", config => {
		const flow = payloadObject(config);
		if (!flow) return config;
		return rewriteField(flow, "prompts", prompts => rewriteArray(prompts, prompt => {
			const entry = payloadObject(prompt);
			if (!entry) return prompt;
			return rewriteField(entry, "prompt_template", template => {
				const fields = payloadObject(template);
				return fields ? rewriteField(fields, "system", text => rewriteText(text, replacement, region)) : template;
			});
		}));
	});
}

function rewriteTaskDefinition(value: unknown): unknown {
	const object = payloadObject(value);
	if (!object || object.name !== "task") return value;
	return rewriteField(object, "description", description =>
		typeof description === "string" ? adaptResearchRouting(description) : description);
}

/** Change only the native task description; schemas, execution and other tools stay intact. */
export function rewriteTaskGuidancePayload(payload: unknown, api: string): unknown {
	const object = payloadObject(payload);
	if (!object) return payload;
	const rewriteFunctions = (value: unknown): unknown => rewriteArray(value, tool => {
		const entry = payloadObject(tool);
		if (!entry) return tool;
		if (entry.type === "namespace" && entry.name === "functions") {
			return rewriteField(entry, "tools", rewriteFunctions);
		}
		return entry.type === "function" ? rewriteTaskDefinition(entry) : tool;
	});
	const rewriteChatTools = (value: unknown): unknown => rewriteArray(value, tool => {
		const entry = payloadObject(tool);
		return entry?.type === "function" ? rewriteField(entry, "function", rewriteTaskDefinition) : tool;
	});
	const rewriteGoogleTools = (value: unknown): unknown => rewriteArray(value, tool => {
		const entry = payloadObject(tool);
		return entry ? rewriteField(entry, "functionDeclarations", declarations => rewriteArray(declarations, rewriteTaskDefinition)) : tool;
	});
	const rewriteBedrock = (value: unknown): unknown => {
		const entry = payloadObject(value);
		return entry ? rewriteField(entry, "toolConfig", config => {
			const configObject = payloadObject(config);
			return configObject ? rewriteField(configObject, "tools", tools => rewriteArray(tools, tool => {
				const definition = payloadObject(tool);
				return definition ? rewriteField(definition, "toolSpec", rewriteTaskDefinition) : tool;
			})) : config;
		}) : value;
	};
	switch (api) {
		case "openai-responses":
		case "openai-codex-responses":
		case "azure-openai-responses":
			return rewriteField(object, "tools", rewriteFunctions);
		case "openai-completions":
		case "openrouter":
		case "ollama":
		case "ollama-chat":
			return rewriteField(object, "tools", rewriteChatTools);
		case "anthropic-messages":
			return rewriteField(object, "tools", tools => rewriteArray(tools, rewriteTaskDefinition));
		case "google-generative-ai":
		case "google-vertex": {
			const rewritten = rewriteField(object, "tools", rewriteGoogleTools);
			return rewriteField(rewritten, "config", config => {
				const entry = payloadObject(config);
				return entry ? rewriteField(entry, "tools", rewriteGoogleTools) : config;
			});
		}
		case "google-gemini-cli":
			return rewriteField(object, "request", request => {
				const entry = payloadObject(request);
				return entry ? rewriteField(entry, "tools", rewriteGoogleTools) : request;
			});
		case "bedrock-converse-stream":
			return rewriteField(rewriteBedrock(object) as PayloadObject, "commandInput", rewriteBedrock);
		default:
			return payload;
	}
}

/** Replace only complete extension-owned regions in known provider system-prompt paths.
 * Unknown APIs/shapes, missing markers, and already-current presets retain identity.
 * Regions must be wholly contained in a single text field; blocks are never merged.
 */
export function rewritePresetPayload(payload: unknown, api: string, replacement: string, region = PRESET_REGION): unknown {
	const object = payloadObject(payload);
	if (!object) return payload;
	switch (api) {
		case "openai-responses":
		case "openai-codex-responses":
		case "azure-openai-responses": {
			const rewritten = rewriteField(object, "instructions", text => rewriteText(text, replacement, region));
			return rewriteField(rewritten, "input", input => rewriteMessages(input, replacement, region));
		}
		case "openai-completions":
		case "openrouter":
		case "ollama":
		case "ollama-chat":
			return rewriteField(object, "messages", messages => rewriteMessages(messages, replacement, region));
		case "cursor-agent":
			// Root prompt blob IDs and request-context rules are outside this hook.
			return rewriteField(object, "customSystemPrompt", text => rewriteText(text, replacement, region));
		case "gitlab-duo-workflow":
		case "gitlab-duo-agent": {
			const rewritten = rewriteGitLabFlow(object, replacement, region);
			return rewriteField(rewritten, "startRequest", request => {
				const nested = payloadObject(request);
				return nested ? rewriteGitLabFlow(nested, replacement, region) : request;
			});
		}
		case "anthropic-messages":
			return rewriteField(object, "system", system => rewriteBlocks(system, replacement, true, region));
		case "google-generative-ai":
		case "google-vertex": {
			// omp's hook receives SDK params with config; wire bodies use the root field.
			const rewritten = rewriteGoogle(object, replacement, region);
			return rewriteField(rewritten, "config", config => {
				const nested = payloadObject(config);
				return nested ? rewriteGoogle(nested, replacement, region) : config;
			});
		}
		case "google-gemini-cli":
			return rewriteField(object, "request", request => {
				const nested = payloadObject(request);
				return nested ? rewriteGoogle(nested, replacement, region) : request;
			});
		case "bedrock-converse-stream": {
			// Current omp passes commandInput directly; also support an explicit wrapper.
			const rewritten = rewriteField(object, "system", system => rewriteBlocks(system, replacement, false, region));
			return rewriteField(rewritten, "commandInput", commandInput => {
				const nested = payloadObject(commandInput);
				return nested
					? rewriteField(nested, "system", system => rewriteBlocks(system, replacement, false, region))
					: commandInput;
			});
		}
		default:
			return payload;
	}
}
