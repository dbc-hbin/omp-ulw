import installPreset from "../../index";

export const provider = "omp-task-bridge-probe";
export const parentModel = "gpt-6.1-sol";
export const childModel = "gpt-6.1-terra";

interface FixtureApi {
  registerProvider(name: string, config: unknown): void;
  on(event: "before_subagent_spawn", handler: (event: { agent: string }) => { model: string }): void;
}

export default function taskBridgeFixture(api: Parameters<typeof installPreset>[0] & FixtureApi): void {
  const base = process.env.OMP_TASK_BRIDGE_BASE;
  if (!base || new URL(base).hostname !== "127.0.0.1") throw new Error("Task bridge probe requires loopback");
  api.registerProvider(provider, {
    baseUrl: `${base}/v1`, apiKey: "local-test-only", api: "openai-completions",
    models: [parentModel, childModel].map(id => ({
      id, name: id, reasoning: false, input: ["text"], contextWindow: 131072, maxTokens: 1024,
      // Synthetic rates expose lost usage; no remote service or actual spend.
      cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
    })),
  });
  api.on("before_subagent_spawn", event => {
    if (event.agent !== "contract") throw new Error(`Unexpected test agent: ${event.agent}`);
    return { model: `${provider}/${childModel}` };
  });
  installPreset(api);
}
