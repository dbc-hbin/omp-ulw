const PRESET_REGION = /<omo-model-preset>[\s\S]*?<\/omo-model-preset>/g;

type PayloadObject = Record<string, unknown>;

function payloadObject(value: unknown): PayloadObject | undefined {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
	return value as PayloadObject;
}

function rewriteText(value: unknown, replacement: string): unknown {
	if (typeof value !== "string") return value;
	// Callback replacement keeps literal dollar sequences in preset text intact.
	return value.replace(PRESET_REGION, () => replacement);
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

function rewriteBlocks(value: unknown, replacement: string, typed: boolean): unknown {
	if (typeof value === "string") return rewriteText(value, replacement);
	return rewriteArray(value, block => {
		const object = payloadObject(block);
		if (!object || (typed && object.type !== "text" && object.type !== "input_text")) return block;
		return rewriteField(object, "text", text => rewriteText(text, replacement));
	});
}

function rewriteMessages(value: unknown, replacement: string): unknown {
	return rewriteArray(value, message => {
		const object = payloadObject(message);
		if (!object || (object.role !== "system" && object.role !== "developer")) return message;
		// Responses tool items may have unrelated fields; only message content is eligible.
		if (object.type !== undefined && object.type !== "message") return message;
		return rewriteField(object, "content", content => rewriteBlocks(content, replacement, true));
	});
}

function rewriteGoogle(object: PayloadObject, replacement: string): PayloadObject {
	return rewriteField(object, "systemInstruction", instruction => {
		if (typeof instruction === "string") return rewriteText(instruction, replacement);
		const content = payloadObject(instruction);
		if (!content) return instruction;
		return rewriteField(content, "parts", parts => rewriteBlocks(parts, replacement, false));
	});
}

function rewriteGitLabFlow(object: PayloadObject, replacement: string): PayloadObject {
	return rewriteField(object, "flowConfig", config => {
		const flow = payloadObject(config);
		if (!flow) return config;
		return rewriteField(flow, "prompts", prompts => rewriteArray(prompts, prompt => {
			const entry = payloadObject(prompt);
			if (!entry) return prompt;
			return rewriteField(entry, "prompt_template", template => {
				const fields = payloadObject(template);
				return fields ? rewriteField(fields, "system", text => rewriteText(text, replacement)) : template;
			});
		}));
	});
}

/** Replace only complete extension-owned regions in known provider system-prompt paths.
 * Unknown APIs/shapes, missing markers, and already-current presets retain identity.
 * Regions must be wholly contained in a single text field; blocks are never merged.
 */
export function rewritePresetPayload(payload: unknown, api: string, replacement: string): unknown {
	const object = payloadObject(payload);
	if (!object) return payload;
	switch (api) {
		case "openai-responses":
		case "openai-codex-responses":
		case "azure-openai-responses": {
			const rewritten = rewriteField(object, "instructions", text => rewriteText(text, replacement));
			return rewriteField(rewritten, "input", input => rewriteMessages(input, replacement));
		}
		case "openai-completions":
		case "openrouter":
		case "ollama":
		case "ollama-chat":
			return rewriteField(object, "messages", messages => rewriteMessages(messages, replacement));
		case "cursor-agent":
			// Root prompt blob IDs and request-context rules are outside this hook.
			return rewriteField(object, "customSystemPrompt", text => rewriteText(text, replacement));
		case "gitlab-duo-workflow":
		case "gitlab-duo-agent": {
			const rewritten = rewriteGitLabFlow(object, replacement);
			return rewriteField(rewritten, "startRequest", request => {
				const nested = payloadObject(request);
				return nested ? rewriteGitLabFlow(nested, replacement) : request;
			});
		}
		case "anthropic-messages":
			return rewriteField(object, "system", system => rewriteBlocks(system, replacement, true));
		case "google-generative-ai":
		case "google-vertex": {
			// omp's hook receives SDK params with config; wire bodies use the root field.
			const rewritten = rewriteGoogle(object, replacement);
			return rewriteField(rewritten, "config", config => {
				const nested = payloadObject(config);
				return nested ? rewriteGoogle(nested, replacement) : config;
			});
		}
		case "google-gemini-cli":
			return rewriteField(object, "request", request => {
				const nested = payloadObject(request);
				return nested ? rewriteGoogle(nested, replacement) : request;
			});
		case "bedrock-converse-stream": {
			// Current omp passes commandInput directly; also support an explicit wrapper.
			const rewritten = rewriteField(object, "system", system => rewriteBlocks(system, replacement, false));
			return rewriteField(rewritten, "commandInput", commandInput => {
				const nested = payloadObject(commandInput);
				return nested
					? rewriteField(nested, "system", system => rewriteBlocks(system, replacement, false))
					: commandInput;
			});
		}
		default:
			return payload;
	}
}
