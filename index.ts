/**
 * OMP model-prompt port, generated from pinned upstream GitHub sources. Installed in the global extensions directory;
 * new omp sessions discover index.ts automatically. Restart omp to load it.
 * Changelog: initial faithful core/shared-builder/tuning port, with omp tool
 * transport adaptation and request-model refresh for supported provider hooks.
 * Changelog: port complete Native ULW doctrine, session arming, specialised
 * workflow pointers and evidence-bound loop/execute continuation.
 * Invoke /ulw <task> or the specialised /ulw-* and /mass-ulw commands.
 * Additional commands: /debugging, /review-work, /visual-qa, /visualize,
 * /frontend, /data-scientist, /remove-ai-slops, /hyperplan, /memory-advisor,
 * /reflection and /init-deep. These do not implicitly arm ULW.
 * Exact Astra/Astra-fast model IDs select the shorter ULW doctrine; provider
 * hooks refresh it when the request model changes. Other models keep baseline.
 * The existing prompts/ulw.md template remains a native-discovery fallback.
 * ULW keywords arm the session; flags can disable arming/pointers/continuation.
 * Native omp transports and approval rules replace Senpi-only APIs.
 * User/custom prompts, project rules, skills and worker assignments are preserved.
 * Unrecognized templates are left unchanged with a warning. Unsupported models
 * retain omp behavior; runtime requires neither upstream packages nor network access.
 * Cursor blob prompts and providers bypassing onPayload (including command-code-go
 * and GitLab workflow) receive turn-start profiles but cannot refresh them mid-turn.
 * Regression checks: bun test in this directory. Upstream provenance and the
 * reproducible updater live in upstream/; presets.ts contains transport adaptations.
 */
import { replaceHostBehavior } from "./host";
import { rewritePresetPayload } from "./payload";
import { renderPreset } from "./presets";
import type { PresetModel, PresetOptions } from "./presets";
import { registerUlw, selectUlwDirective } from "./ulw";
import type { UlwApi, UlwContext } from "./ulw";

interface PromptContext extends UlwContext {
  model?: PresetModel & { api: string };
  mode: "tui" | "rpc" | "json" | "print";
  ui: { notify(message: string, level: "warning"): void };
}
interface ModelPromptApi {
  setLabel(label: string): void;
  getActiveTools(): string[];
  getAllTools(): Array<{ name: string }>;
  on(event: "before_agent_start", handler: (event: { systemPrompt: string[] }, ctx: PromptContext) => { systemPrompt: string[] } | undefined): void;
  on(event: "before_provider_request", handler: (event: { payload: unknown }, ctx: PromptContext) => unknown): void;
}

type ExtensionApi = ModelPromptApi & UlwApi;

export default function omoPrompts(pi: ExtensionApi): void {
  pi.setLabel("OMP model prompts");
  registerUlw(pi);
  let originalBehavior: string | undefined;
  let options: PresetOptions = { surface: "terminal", toolNames: [] };
  const profiles = new Map<string, string>();
  let warned = false;

  pi.on("before_agent_start", (event, ctx) => {
    originalBehavior = undefined;
    profiles.clear();
    // Worker prompts carry an assignment and delegation context owned by the
    // host. Do not replace their role with the main-agent model preset.
    if (ctx.agent.kind !== "main") return;
    const active = new Set(pi.getActiveTools());
    options = {
      // print/json are non-interactive machine/app surfaces: terminal routing
      // lines would become user-visible output. Only the TUI gets terminal
      // routing instructions.
      surface: ctx.mode === "tui" ? "terminal" : "app",
      // The active tool set is authoritative. Do not enable prompt branches
      // merely because a host or skill mentions a tool that is unavailable.
      toolNames: pi.getAllTools().map(tool => tool.name).filter(name => active.has(name)),
    };
    const preset = ctx.model ? renderPreset(ctx.model, options) : undefined;
    const marked = "<omp-model-preset>\n" + (preset?.prompt ?? "") + "\n</omp-model-preset>";
    const result = replaceHostBehavior(event.systemPrompt, marked);
    if (!result) {
      if (!warned) {
        ctx.ui.notify("OMP prompts: custom or unfamiliar system template preserved; model preset replacement not applied.", "warning");
        warned = true;
      }
      return;
    }
    originalBehavior = result.originalBehavior;
    if (preset && ctx.model) profiles.set(JSON.stringify([ctx.model.provider, ctx.model.id, ctx.model.name]), marked);
    if (!preset) result.blocks[0] = result.blocks[0].replace(marked, "<omp-model-preset>\n" + originalBehavior + "\n</omp-model-preset>");
    return { systemPrompt: result.blocks };
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (!ctx.model || ctx.agent.kind !== "main") return;
    const payload = rewritePresetPayload(event.payload, ctx.model.api,
      `<omp-ulw-policy>\n<ultrawork-mode>${selectUlwDirective(ctx.model.id)}</ultrawork-mode>\n</omp-ulw-policy>`,
      /<(om[op]-ulw-policy)>[\s\S]*?<\/\1>/g);
    if (originalBehavior === undefined) return payload;
    const key = JSON.stringify([ctx.model.provider, ctx.model.id, ctx.model.name]);
    let replacement = profiles.get(key);
    if (replacement === undefined) {
      const preset = renderPreset(ctx.model, options);
      replacement = "<omp-model-preset>\n" + (preset?.prompt ?? originalBehavior) + "\n</omp-model-preset>";
      profiles.set(key, replacement);
    }
    // The adapter touches only our system-prompt marker, never advisor/custom/user messages.
    return rewritePresetPayload(payload, ctx.model.api, replacement);
  });
}
