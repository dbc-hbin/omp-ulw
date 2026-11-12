import installPreset from "../../index";
import { fileURLToPath } from "node:url";

export const provider = "omp-prewalk-probe";
export const sourceModel = "gpt-6.1-sol";
export const targetModel = "claude-haiku-5.5";
export interface Observation {
  prompt: string;
  enabled: unknown;
  auto: unknown;
  enabledSource: string;
  autoSource: string;
}
interface FixtureApi {
  registerProvider(name: string, config: unknown): void;
  on(event: "resources_discover", handler: () => { skillPaths: string[] }): void;
}

export default async function prewalkFixture(api: Parameters<typeof installPreset>[0] & FixtureApi): Promise<void> {
  const base = process.env.OMP_PREWALK_PROBE_BASE;
  if (!base || new URL(base).hostname !== "127.0.0.1") throw new Error("Prewalk probe requires its loopback provider");
  api.registerProvider(provider, {
    baseUrl: `${base}/v1`, apiKey: "local-test-only", api: "openai-completions",
    models: [sourceModel, targetModel].map(id => ({
      id, name: id, reasoning: false, input: ["text"], contextWindow: 131072, maxTokens: 1024,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    })),
  });
  api.on("resources_discover", () => ({
    skillPaths: [fileURLToPath(new URL("../../skills/ulw-plan", import.meta.url))],
  }));
  const [{ lookup }, { findScopedSettings }] = await Promise.all([
    import("@oh-my-pi/pi-coding-agent/config/registry"),
    import("@oh-my-pi/pi-coding-agent/config/settings"),
  ]);
  const enabled = lookup("prewalk.enabled");
  const auto = lookup("prewalk.auto");
  if (!enabled || !auto) throw new Error("Missing native prewalk settings");
  api.on("session_start", async (_event, ctx) => {
    if (!process.env.OMP_PREWALK_PROBE_SEED || ctx.agent.kind !== "main") return;
    const scope = findScopedSettings(ctx.cwd);
    if (!scope) throw new Error("Missing probe session scope");
    auto.override(scope, "on");
    enabled.override(scope, true);
    await Promise.resolve();
  });
  api.on("before_agent_start", (event: { prompt: string }, ctx: { cwd: string }) => {
    if (process.env.OMP_PREWALK_PROBE_SEED !== "operator-clear" || !event.prompt.startsWith("Implement")) return;
    const scope = findScopedSettings(ctx.cwd);
    if (!scope) throw new Error("Missing probe session scope");
    enabled.clearOverride(scope);
    auto.clearOverride(scope);
  });
  installPreset(api);
  api.on("before_agent_start", async (event: { prompt: string }, ctx: { cwd: string }) => {
    const scope = findScopedSettings(ctx.cwd);
    if (!scope) throw new Error("Missing probe session scope");
    const observation: Observation = {
      prompt: event.prompt, enabled: enabled.get(scope), auto: auto.get(scope),
      enabledSource: enabled.provenance(scope), autoSource: auto.provenance(scope),
    };
    const response = await fetch(`${base}/observe`, { method: "POST", body: JSON.stringify(observation) });
    if (!response.ok) throw new Error(`Prewalk observation failed: ${response.status}`);
  });
}
