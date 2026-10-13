import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface ProbeContext { cwd: string; sessionManager: { getSessionId(): string } }
interface ProbeApi {
  registerProvider(name: string, config: unknown): void;
  on(event: "session_start", handler: (event: unknown, ctx: ProbeContext) => void): void;
}
export default function probe(pi: ProbeApi): void {
  const provider = process.env.OMO_ULW_PROBE_PROVIDER || undefined;
  const model = process.env.OMO_ULW_PROBE_MODEL || "gpt-6.1-sol";
  pi.registerProvider(provider ?? "omo-ulw-probe", {
    baseUrl: process.env.OMO_ULW_PROBE_BASE_URL,
    apiKey: "local-test-only",
    api: "openai-completions",
    models: [{
      id: provider ? "deepseek-v4-flash-omo-local-probe" : model, name: provider ? "DeepSeek V4 Flash" : model, api: "openai-completions",
      baseUrl: process.env.OMO_ULW_PROBE_BASE_URL,
      reasoning: false, input: ["text"], contextWindow: 131072, maxTokens: 256,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    }],
  });
  if (process.env.OMO_ULW_PROBE_CONTINUATION) pi.on("session_start", (_event, ctx) => {
    const id = ctx.sessionManager.getSessionId();
    const kind = process.env.OMO_ULW_PROBE_CONTINUATION;
    let path: string;
    if (kind === "loop") {
      const dir = join(ctx.cwd, "doc/ulw-loop", id);
      mkdirSync(dir, { recursive: true });
      path = join(dir, "goals.json");
      writeFileSync(path, JSON.stringify({ status: "active", goals: [{ status: "pending" }] }));
    } else {
      mkdirSync(join(ctx.cwd, "doc/plans"), { recursive: true });
      path = join(ctx.cwd, "doc/plans/probe.md");
      writeFileSync(path, kind === "execute-blocked" ? "- [~] 1. Unmet criterion\n"
        : kind === "execute-mixed" ? "- [~] 1. Unmet criterion\n- [~] 2. blocked by 1\n- [ ] 3. Independent task\n\n## Final verification wave\n- [ ] F1. Verify delivered work\n"
          : "- [ ] 1. Local hook probe\n");
      writeFileSync(join(ctx.cwd, "doc/boulder.json"), JSON.stringify({ schema_version: 2, works: { probe: { status: "active", session_ids: ["omp:" + id], active_plan: "doc/plans/probe.md" } } }));
    }
    console.log(JSON.stringify({ type: "ulw_probe_state", kind, path }));
  });
}
