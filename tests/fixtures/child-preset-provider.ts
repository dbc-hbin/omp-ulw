import installPreset from "../../index";

export const provider = "omo-child-preset-probe";
export const childModels = { task: "gpt-6-astra", sonic: "claude-haiku-5.5", scout: "deepseek-v4.1-flash" } as const;
export const parentModel = "gpt-6.1-sol";
export interface Observation {
  phase: "before" | "after";
  session: string;
  kind: string;
  name?: string;
  model: { provider: string; id: string; name: string };
  blocks: string[];
  tools: string[];
  prompt: string;
}
interface Context {
  agent: { kind: string; name?: string };
  model: Observation["model"];
  sessionManager: { getSessionId(): string };
}
interface FixtureApi {
  registerProvider(name: string, config: unknown): void;
  getActiveTools(): string[];
  on(event: "before_agent_start", handler: (event: { systemPrompt: string[]; prompt: string }, ctx: Context) => Promise<void>): void;
  on(event: "before_subagent_spawn", handler: (event: { agent: string }) => { model: string }): void;
}

// One factory brackets the real extension in registration order, in every native session.
// No production role, tool, or prompt is overridden by the fixture.
export default function childPresetFixture(api: Parameters<typeof installPreset>[0] & FixtureApi): void {
  const base = process.env.OMO_CHILD_PRESET_BASE_URL;
  if (!base || new URL(base).hostname !== "127.0.0.1") throw new Error("Child probe requires its loopback provider");
  api.registerProvider(provider, {
    baseUrl: `${base}/v1`, apiKey: "local-test-only", api: "openai-completions",
    models: [parentModel, ...Object.values(childModels)].map(id => ({
      id, name: id, api: "openai-completions", baseUrl: `${base}/v1`,
      reasoning: false, input: ["text"], contextWindow: 131072, maxTokens: 1024,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    })),
  });
  api.on("before_subagent_spawn", event => {
    if (!(event.agent in childModels)) throw new Error(`Unexpected child agent: ${event.agent}`);
    return { model: `${provider}/${childModels[event.agent as keyof typeof childModels]}` };
  });
  const observe = (phase: Observation["phase"]) => async (event: { systemPrompt: string[]; prompt: string }, ctx: Context) => {
    if (ctx.model.provider !== provider) throw new Error(`Nonlocal model selected: ${ctx.model.provider}/${ctx.model.id}`);
    const observation: Observation = {
      phase, session: ctx.sessionManager.getSessionId(), kind: ctx.agent.kind, name: ctx.agent.name,
      model: { provider: ctx.model.provider, id: ctx.model.id, name: ctx.model.name },
      blocks: [...event.systemPrompt], tools: [...api.getActiveTools()], prompt: event.prompt,
    };
    const response = await fetch(`${base}/observe`, { method: "POST", body: JSON.stringify(observation) });
    if (!response.ok) throw new Error(`Probe observer failed: ${response.status}`);
  };
  api.on("before_agent_start", observe("before"));
  installPreset(api);
  api.on("before_agent_start", observe("after"));
}
