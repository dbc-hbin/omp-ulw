type ObjectValue = Record<string, unknown>;
type RequestModel = {
	id?: string;
	name?: string;
	provider?: string;
	api?: string;
	identity?: { class?: string; family?: string; logicalId?: string };
};
type ToolInfo = {
	name: string;
	description?: string;
	parameters?: unknown;
	promptGuidelines?: string[];
};
type RequestContext = {
	model?: RequestModel;
	ui?: { notify(message: string, type?: "info" | "warning" | "error"): void };
};
type Lifecycle = "session_start" | "session_switch" | "session_branch" | "session_tree" | "session_shutdown";

/** Only public extension APIs; projection never changes the session's enabled tools. */
export interface CodeModeApi {
	getAllTools(): ToolInfo[];
	getActiveTools(): string[];
	on(event: Lifecycle, handler: (event: unknown, ctx: RequestContext) => void): void;
	on(
		event: "before_provider_request",
		handler: (event: { payload: unknown }, ctx: RequestContext) => unknown,
	): void;
}

const DIRECT = new Set([
	"eval", "ask", "wait", "todo", "yield", "think",
	"task", "checkpoint", "rewind", "new_context", "write",
]);
const BRIDGE_EXCLUDED = new Set([
	"eval", "ask", "wait", "todo", "yield", "think", "task", "checkpoint", "rewind", "new_context",
]);
const REGION = /<omp-code-mode>[\s\S]*?<\/omp-code-mode>/g;

function object(value: unknown): ObjectValue | undefined {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? value as ObjectValue : undefined;
}

function gptName(value: unknown): boolean {
	if (typeof value !== "string") return false;
	const name = value.toLowerCase().replace(/[_\s]+/g, "-");
	// Provider prefixes and reseller paths are allowed; substrings such as "notgpt" are not.
	return /(?:^|[/:.])(?:chatgpt|gpt)(?:-|$)/.test(name)
		&& !/(?:^|[/:.])(?:chatgpt|gpt)-image(?:-|$)/.test(name);
}

function isGpt(model: RequestModel): boolean {
	const identity = model.identity;
	const namedGpt = (): boolean => gptName(identity?.logicalId) || gptName(model.id) || gptName(model.name);
	if (identity?.class && identity.class !== "unknown") {
		// GPT OSS is a separate catalog lineage, not an OpenAI transport hint.
		if (identity.class === "gpt-oss") return true;
		if (identity.class !== "openai") return false;
		if (identity.family) {
			if (identity.family === "gpt" || identity.family === "chatgpt") return true;
			// Catalog Codex families override GPT even for gpt-*-codex ids.
			// Require explicit GPT identity evidence rather than enabling every
			// unrelated/bare Codex product served by openai-codex.
			return (identity.family === "codex" || identity.family === "codex-spark") && namedGpt();
		}
	}
	return namedGpt();
}

function acceptsJs(schema: unknown): boolean {
	const root = object(schema);
	const language = object(object(root?.properties)?.language);
	if (!language) return false;
	const accepts = (value: unknown): boolean => {
		const entry = object(value);
		if (!entry) return false;
		if (entry.const === "js" || entry.const === "javascript") return true;
		if (Array.isArray(entry.enum)) return entry.enum.includes("js") || entry.enum.includes("javascript");
		return ["anyOf", "oneOf"].some(key => Array.isArray(entry[key]) && entry[key].some(accepts));
	};
	return accepts(language);
}

type WireTool = {
	name: string;
	description: unknown;
	schema: unknown;
	/** A custom tool has a freeform wire format, not a JSON argument schema. */
	format?: unknown;
	definition: ObjectValue;
	descriptionKey: string;
};
type ToolList = {
	tools: unknown[];
	replace(tools: unknown[]): unknown;
	kind: "responses" | "chat" | "bedrock" | "anthropic";
};

function toolLists(payload: unknown, api: string): ToolList[] | undefined {
	const root = object(payload);
	if (!root) return undefined;
	const list = (container: ObjectValue, kind: ToolList["kind"], replace: (value: ObjectValue) => unknown): ToolList | undefined =>
		Array.isArray(container.tools)
			? { tools: container.tools, kind, replace: tools => replace({ ...container, tools }) }
			: undefined;
	if (["openai-responses", "openai-codex-responses", "azure-openai-responses"].includes(api)) {
		const found = list(root, "responses", value => value);
		return found ? [found] : undefined;
	}
	if (["openai-completions", "openrouter", "ollama", "ollama-chat", "anthropic-messages"].includes(api)) {
		const found = list(root, api === "anthropic-messages" ? "anthropic" : "chat", value => value);
		return found ? [found] : undefined;
	}
	if (api === "bedrock-converse-stream") {
		// Match payload.ts: current direct commandInput and an explicit wrapper.
		const wrapped = object(root.commandInput);
		const body = wrapped ?? root;
		const config = object(body.toolConfig);
		if (!config) return undefined;
		const found = list(config, "bedrock", value => {
			const next = { ...body, toolConfig: value };
			return wrapped ? { ...root, commandInput: next } : next;
		});
		return found ? [found] : undefined;
	}
	return undefined;
}

function wireTool(value: unknown, kind: ToolList["kind"]): WireTool | undefined {
	const entry = object(value);
	if (!entry) return undefined;
	const definition = kind === "chat" ? object(entry.function)
		: kind === "bedrock" ? object(entry.toolSpec) : entry;
	if (!definition || typeof definition.name !== "string") return undefined;
	if (kind === "responses" && definition.type !== "function" && definition.type !== "custom") return undefined;
	const schema = kind === "bedrock" ? object(definition.inputSchema)?.json
		: kind === "anthropic" ? definition.input_schema : definition.parameters;
	return {
		name: definition.name, description: definition.description, schema,
		format: definition.type === "custom" ? definition.format : undefined,
		definition, descriptionKey: "description",
	};
}

function namespace(value: unknown, kind: ToolList["kind"]): ObjectValue | undefined {
	const entry = object(value);
	return kind === "responses" && entry?.type === "namespace" && entry.name === "functions"
		&& Array.isArray(entry.tools) ? entry : undefined;
}

function collect(tools: unknown[], kind: ToolList["kind"], result: WireTool[]): void {
	for (const entry of tools) {
		const group = namespace(entry, kind);
		if (group) collect(group.tools as unknown[], kind, result);
		else {
			const tool = wireTool(entry, kind);
			if (tool) result.push(tool);
		}
	}
}

function replaceDescription(entry: unknown, kind: ToolList["kind"], tool: WireTool, description: string): unknown {
	const definition = { ...tool.definition, [tool.descriptionKey]: description };
	if (kind === "chat") return { ...object(entry), function: definition };
	if (kind === "bedrock") return { ...object(entry), toolSpec: definition };
	return definition;
}

function project(
	tools: unknown[], kind: ToolList["kind"], hidden: Set<string>, description: string,
): unknown[] {
	const result: unknown[] = [];
	for (const entry of tools) {
		const group = namespace(entry, kind);
		if (group) {
			const nested = project(group.tools as unknown[], kind, hidden, description);
			if (nested.length) result.push({ ...group, tools: nested });
			continue;
		}
		const tool = wireTool(entry, kind);
		if (tool && hidden.has(tool.name)) continue;
		result.push(tool?.name === "eval" ? replaceDescription(entry, kind, tool, description) : entry);
	}
	return result;
}

function choiceNames(payload: unknown): Set<string> {
	const names = new Set<string>();
	const root = object(payload);
	const body = object(root?.commandInput) ?? root;
	const choice = object(body?.toolConfig)?.toolChoice ?? body?.tool_choice;
	const visit = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const item of value) visit(item);
		} else {
			const entry = object(value);
			if (!entry) return;
			if (typeof entry.name === "string") names.add(entry.name);
			for (const [key, nested] of Object.entries(entry)) if (key !== "name") visit(nested);
		}
	};
	visit(choice);
	return names;
}

/** Register LAST, after preset/native-description rewriting. Hidden direct calls are
 * not blocked: this is an outgoing-schema projection, not an execution boundary.
 */
export function registerCodeMode(pi: CodeModeApi): void {
	const models = new Map<string, boolean>();
	const notices = new Set<string>();
	let catalog: { key: string; text: string } | undefined;
	const reset = (): void => {
		models.clear();
		notices.clear();
		catalog = undefined;
	};
	for (const event of ["session_start", "session_switch", "session_branch", "session_tree", "session_shutdown"] as const) {
		pi.on(event, reset);
	}
	pi.on("before_provider_request", (event, ctx) => {
		const model = ctx.model;
		if (!model) return;
		// Key the metadata actually consulted, not just a mutable provider/id pair.
		const modelKey = JSON.stringify([model.provider, model.id, model.name, model.api, model.identity]);
		let gpt = models.get(modelKey);
		if (gpt === undefined) {
			gpt = isGpt(model);
			models.set(modelKey, gpt);
		}
		if (!gpt) return;
		const warn = (reason: string): void => {
			if (notices.has(reason)) return;
			notices.add(reason);
			ctx.ui?.notify(`OMP code mode inactive: ${reason}; request left unchanged.`, "warning");
		};
		const lists = toolLists(event.payload, model.api ?? "");
		if (!lists) {
			warn(`unsupported API/tool shape (${model.api ?? "unknown"})`);
			return;
		}
		const actual: WireTool[] = [];
		for (const list of lists) collect(list.tools, list.kind, actual);
		const evals = actual.filter(tool => tool.name === "eval");
		const active = new Set(pi.getActiveTools());
		const all = pi.getAllTools();
		const native = new Map(all.filter(tool => active.has(tool.name)).map(tool => [tool.name, tool]));
		if (evals.length !== 1 || !native.has("eval") || !acceptsJs(evals[0]?.schema)) {
			warn("an active, actually exposed eval tool with JavaScript schema support is required");
			return;
		}
		const forced = choiceNames(event.payload);
		const entries: { name: string; description: string; nativeDescription: string; guidelines: string[]; schema: unknown; format?: unknown }[] = [];
		const hidden = new Set<string>();
		const unprojected = new Set<string>();
		const inspectUnknown = (tools: unknown[], kind: ToolList["kind"]): void => {
			for (const entry of tools) {
				const group = namespace(entry, kind);
				if (group) inspectUnknown(group.tools as unknown[], kind);
				else if (!wireTool(entry, kind)) {
					const value = object(entry);
					unprojected.add(String(value?.name ?? value?.type ?? "unrecognized entry"));
				}
			}
		};
		for (const list of lists) inspectUnknown(list.tools, list.kind);
		for (const tool of actual) {
			if (BRIDGE_EXCLUDED.has(tool.name)) continue;
			const info = native.get(tool.name);
			// Unmapped aliases and unknown/provider-hosted tools stay direct. ToolInfo
			// has no customWireName; guessing an alias would advertise a false bridge.
			const schema = tool.schema ?? (tool.format !== undefined ? info?.parameters : undefined);
			if (!info || !object(schema) || typeof info.description !== "string") {
				if (!DIRECT.has(tool.name)) unprojected.add(tool.name);
				continue;
			}
			entries.push({
				name: tool.name,
				description: typeof tool.description === "string" ? tool.description : info.description,
				nativeDescription: info.description,
				guidelines: info.promptGuidelines ?? [], schema, format: tool.format,
			});
			if (!DIRECT.has(tool.name) && !forced.has(tool.name)) hidden.add(tool.name);
		}
		if (unprojected.size) {
			const reason = `unprojected tools: ${Array.from(unprojected).sort().join(", ")}`;
			if (!notices.has(reason)) {
				notices.add(reason);
				ctx.ui?.notify(`OMP code mode preserves ${reason} (unknown wire entry, missing native metadata or schema); no aliases or permissions were invented.`, "warning");
			}
		}
		if (!entries.length) {
			warn("no bridge catalog with active native metadata and actual schemas is available");
			return;
		}
		// Catalog cache is a single replaceable render, never a cache of requests,
		// grants, approvals, or tool_choice. Mutable schemas/descriptions are read now.
		const key = JSON.stringify([Array.from(active).sort(), entries]);
		if (catalog?.key !== key) {
			const text = [
				"<omp-code-mode>",
				"Use native session tools from JavaScript: await tool.<name>(args). Pass one object matching its JSON Schema; await results and print only what is needed.",
				"These are the current active tools also present in this request, not new permissions. Native approval and execution rules still apply.",
				"Use direct orchestration/session-control tools when exposed; do not bridge task, checkpoint, rewind or new_context.",
				...(entries.some(entry => entry.name === "read")
					? ["Use tool.read for reads, including xd:// documentation."] : []),
				...(entries.some(entry => entry.name === "write")
					? ["Use tool.write for ordinary files; use direct write for xd:// devices, session-control and plan transports. Its shared file/device schema cannot safely be split by this extension."] : []),
				...entries.map(entry => [
					`await tool.${entry.name}(args)`,
					entry.description,
					...(entry.nativeDescription === entry.description ? [] : [`Native documentation: ${entry.nativeDescription}`]),
					...entry.guidelines,
					`JSON Schema: ${JSON.stringify(entry.schema)}`,
					...(entry.format === undefined ? [] : [`Direct custom wire format (bridge still takes JSON args): ${JSON.stringify(entry.format)}`]),
				].join("\n")),
				"</omp-code-mode>",
			].join("\n\n");
			catalog = { key, text };
		}
		const original = typeof evals[0].description === "string" ? evals[0].description : "";
		const description = `${original.replace(REGION, "")}\n\n${catalog.text}`;
		const list = lists[0];
		return list.replace(project(list.tools, list.kind, hidden, description));
	});
}
