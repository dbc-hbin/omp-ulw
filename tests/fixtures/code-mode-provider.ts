import installPreset from "../../index";

export const provider = "omp-code-mode-probe";
// Preset-recognized model ids covering representative families on one transport.
export const models = ["gpt-6.1-sol", "claude-haiku-5.5", "kimi-k3", "gemini-4-argon", "grok-4.5"];
export const directProbeNames = ["defined", "undefine"] as const;
export const bridgeProbe = {
  name: "code-mode-probe",
  label: "Code-mode bridge probe",
  loadMode: "essential",
  description: "Return the supplied value to verify native bridge tool-name dispatch.",
  parameters: { type: "object", properties: { value: { type: "string" } }, required: ["value"] },
  async execute(_toolCallId: string, { value }: { value: string }) {
    return { content: [{ type: "text" as const, text: value }], details: { value } };
  },
};
export const mountedProbe = { ...bridgeProbe, name: "code-mode-mounted-probe", loadMode: "discoverable" };
export interface WireTool {
  type: string;
  function: { name: string; description?: string; parameters: Record<string, unknown> };
}
export interface Observation {
  stage: "agent" | "provider";
  phase: "before" | "after";
  model: string;
  activeTools: string[];
  tools?: WireTool[];
  blocks?: string[];
}
interface Context { model?: { provider: string; id: string } }
interface FixtureApi {
  registerProvider(name: string, config: unknown): void;
  registerTool(config: unknown): void;
  getActiveTools(): string[];
  on(event: "before_agent_start", handler: (event: { systemPrompt: string[] }, ctx: Context) => Promise<void>): void;
  on(event: "before_provider_request", handler: (event: { payload: unknown }, ctx: Context) => Promise<void>): void;
}

// Observe the full package; do not replace tools, prompts, execution or activation.
export default function codeModeFixture(api: Parameters<typeof installPreset>[0] & FixtureApi): void {
  const base = process.env.OMP_CODE_MODE_PROBE_BASE;
  if (!base) throw new Error("Code-mode probe requires its loopback provider");
  const url = new URL(base);
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || !url.port ||
    url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Code-mode probe refuses a non-loopback provider");
  }
  api.registerTool(bridgeProbe);
  api.registerTool(mountedProbe);
  for (const name of directProbeNames) api.registerTool({ ...bridgeProbe, name });
  api.registerProvider(provider, {
    baseUrl: `${base}/v1`, apiKey: "local-test-only", api: "openai-completions",
    models: models.map(id => ({
      id, name: id, reasoning: false, input: ["text"], contextWindow: 131072, maxTokens: 1024,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    })),
  });
  async function observe(stage: Observation["stage"], phase: Observation["phase"], ctx: Context, details: Partial<Observation>): Promise<void> {
    if (ctx.model?.provider !== provider) throw new Error("Code-mode probe selected a nonlocal model");
    const observation: Observation = {
      stage, phase, model: ctx.model.id, activeTools: [...api.getActiveTools()], ...details,
    };
    const response = await fetch(`${base}/observe`, { method: "POST", body: JSON.stringify(observation) });
    if (!response.ok) throw new Error(`Code-mode observer failed: ${response.status}`);
  }
  function registerObservers(phase: Observation["phase"]): void {
    api.on("before_agent_start", async (event, ctx) => {
      await observe("agent", phase, ctx, { blocks: [...event.systemPrompt] });
    });
    api.on("before_provider_request", async (event, ctx) => {
      const payload = event.payload as { tools?: WireTool[] };
      if (!Array.isArray(payload.tools)) throw new Error("Code-mode probe requires native chat-completions tools");
      await observe("provider", phase, ctx, { tools: payload.tools });
    });
  }
  registerObservers("before");
  installPreset(api);
  registerObservers("after");
}
