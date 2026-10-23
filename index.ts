/**
 * OMP model-prompt port, generated from pinned upstream GitHub sources. Installed in the global extensions directory;
 * new omp sessions discover index.ts automatically. Restart omp to load it.
 * Changelog: initial faithful core/shared-builder/tuning port, with omp tool
 * transport adaptation and request-model refresh for supported provider hooks.
 * Changelog: child sessions receive their own model profile while preserving
 * host-owned specialist roles, assignments, tools and completion protocols.
 * Changelog: port complete Native ULW doctrine, session arming, specialised
 * workflow pointers and evidence-bound loop/execute continuation.
 * Invoke /ulw <task> or the specialised /ulw-* and /mass-ulw commands.
 * Additional commands: /debugging, /review-work, /visual-qa, /visualize,
 * /frontend, /data-scientist, /remove-ai-slops, /hyperplan, /memory-advisor,
 * /reflection, /init-deep, /ast-grep, /lsp-setup and /refactor. These do not
 * implicitly arm ULW.
 * GPT-6 family model IDs select the shorter ULW doctrine; provider hooks
 * refresh it when the request model changes. Other models keep baseline.
 * The existing prompts/ulw.md template remains a native-discovery fallback.
 * ULW keywords arm the session; flags can disable arming/pointers/continuation.
 * Native OMP transports and approval rules replace legacy transport APIs.
 * User/custom prompts, project rules, skills and worker assignments are preserved.
 * Unrecognized templates are left unchanged with a warning. Unsupported models
 * retain omp behavior; runtime requires neither upstream packages nor network access.
 * Cursor blob prompts and providers bypassing onPayload (including command-code-go
 * and GitLab workflow) receive turn-start profiles but cannot refresh them mid-turn.
 * Regression checks: bun test in this directory. Upstream provenance and the
 * reproducible updater live in upstream/; presets.ts contains transport adaptations.
 */
import { replaceHostBehavior } from "./host";
import { rewritePresetPayload, rewriteTaskGuidancePayload } from "./payload";
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

function markPreset(prompt: string, subagent: boolean): string {
  const scope = subagent
    ? "\n\n## Delegated execution\n\nYou are a subagent, not the main agent. Apply this model's working methods within the host-provided specialist role and assigned task. The host's child role, tool restrictions, shared context, assignment, cooperation rules and completion/output protocol take precedence over generic directions in this preset. Preserve read-only and no-edit limits; do not acquire tools or permissions from this text. Do not take over the parent's orchestration, user-facing routing lines, progress reports or todo tracking. Follow the child's verification limits and return required evidence and unrun checks to the parent; do not run builds, tests or formatters when the host forbids them. Finish through the host's actual child completion protocol, including yield only when provided."
    : "";
  return "<omp-model-preset>\n" + prompt + scope + "\n</omp-model-preset>";
}

export default function ompUlw(pi: ExtensionApi): void {
  pi.setLabel("omp-ulw");
  registerUlw(pi);
  let originalBehavior: string | undefined;
  let options: PresetOptions = { surface: "terminal", toolNames: [] };
  const profiles = new Map<string, string>();
  let warned = false;

  pi.on("before_agent_start", (event, ctx) => {
    originalBehavior = undefined;
    profiles.clear();
    const active = new Set(pi.getActiveTools());
    options = {
      // print/json are non-interactive machine/app surfaces: terminal routing
      // lines would become user-visible output. Only the TUI gets terminal
      // routing instructions.
      surface: ctx.agent.kind === "main" && ctx.mode === "tui" ? "terminal" : "app",
      // The active tool set is authoritative. Do not enable prompt branches
      // merely because a host or skill mentions a tool that is unavailable.
      toolNames: pi.getAllTools().map(tool => tool.name).filter(name => active.has(name)),
    };
    const preset = ctx.model ? renderPreset(ctx.model, options) : undefined;
    // Only the base role is replaced. OMP appends the child's specialist role,
    // assignment and completion contract in later blocks, which remain intact.
    const marked = markPreset(preset?.prompt ?? "", ctx.agent.kind === "sub");
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
    if (!preset) result.blocks[0] = result.blocks[0].replace(marked, markPreset(originalBehavior, ctx.agent.kind === "sub"));
    return { systemPrompt: result.blocks };
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (!ctx.model) return;
    const payload = ctx.agent.kind === "main" ? rewritePresetPayload(event.payload, ctx.model.api,
      `<omp-ulw-policy>\n<ultrawork-mode>${selectUlwDirective(ctx.model.id)}</ultrawork-mode>\n</omp-ulw-policy>`,
      /<(om[op]-ulw-policy)>[\s\S]*?<\/\1>/g) : event.payload;
    if (originalBehavior === undefined) return payload;
    const key = JSON.stringify([ctx.model.provider, ctx.model.id, ctx.model.name]);
    let replacement = profiles.get(key);
    if (replacement === undefined) {
      const preset = renderPreset(ctx.model, options);
      replacement = markPreset(preset?.prompt ?? originalBehavior, ctx.agent.kind === "sub");
      profiles.set(key, replacement);
    }
    // Adapt only native task routing prose alongside our owned profile marker.
    // Tool schemas, custom prompts and child assignments remain host-owned.
    return rewriteTaskGuidancePayload(rewritePresetPayload(payload, ctx.model.api, replacement), ctx.model.api);
  });
}
