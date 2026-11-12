/**
 * OMP model-prompt port, generated from pinned upstream GitHub sources. Installed in the global extensions directory;
 * new omp sessions discover index.ts automatically. Restart omp to load it.
 * Changelog: initial faithful core/shared-builder/tuning port, with omp tool
 * transport adaptation and request-model refresh for supported provider hooks.
 * Changelog: child sessions receive their own model profile while preserving
 * host-owned specialist roles, assignments, tools and completion protocols.
 * Changelog: retain ULW activation, specialised workflow state and continuation;
 * model profiles own working methods; native tools, permissions and modes remain authoritative.
 * Invoke /ulw <task> or the specialised /ulw-* and /mass-ulw commands.
 * Additional commands: /web-browser, /ultimate-browsing,
 * /debugging, /review-work, /eval-integrity, /visual-qa, /visualize,
 * /frontend, /data-scientist, /remove-ai-slops, /hyperplan, /memory-advisor,
 * /reflection, /init-deep, /ast-grep, /lsp-setup and /refactor. These do not
 * implicitly arm ULW.
 * All models share one compact ULW policy; provider hooks refresh stale
 * policy blocks without changing model-specific working profiles.
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
import { adaptOrchestrateNotice, projectHostGuidance } from "./host-guidance";
import { rewritePresetPayload, rewriteToolGuidancePayload } from "./payload";
import { renderPreset } from "./presets";
import type { PresetModel, PresetOptions } from "./presets";
import { adaptPrewalkNotice, registerPrewalk } from "./prewalk";
import type { PrewalkApi } from "./prewalk";
import { registerUlw, ulwDirective } from "./ulw";
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
  on(event: "context", handler: (event: { messages: Record<string, unknown>[] }, ctx: PromptContext) => { messages: Record<string, unknown>[] } | undefined): void;
  on(event: "before_provider_request", handler: (event: { payload: unknown }, ctx: PromptContext) => unknown): void;
}

type ExtensionApi = ModelPromptApi & UlwApi & PrewalkApi;

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
  let originalHost: string | undefined;
  let options: PresetOptions = { surface: "terminal", toolNames: [] };
  const profiles = new Map<string, { prompt: string; modelGuidance: boolean }>();
  let warned = false;

  pi.on("before_agent_start", (event, ctx) => {
    originalBehavior = undefined;
    originalHost = undefined;
    profiles.clear();
    const active = new Set(pi.getActiveTools());
    options = {
      // print/json are non-interactive machine/app surfaces: terminal routing
      // lines would become user-visible output. Only the TUI gets terminal
      // routing instructions.
      surface: ctx.agent.kind === "main" && ctx.mode === "tui" ? "terminal" : "app",
      subagent: ctx.agent.kind === "sub",
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
    if (preset && ctx.model) profiles.set(JSON.stringify([ctx.model.provider, ctx.model.id, ctx.model.name, options.toolNames]), { prompt: marked, modelGuidance: true });
    if (!preset) result.blocks[0] = result.blocks[0].replace(marked, markPreset(originalBehavior, ctx.agent.kind === "sub"));
    originalHost = result.blocks[0];
    result.blocks[0] = projectHostGuidance(result.blocks[0], originalHost, preset !== undefined);
    return { systemPrompt: result.blocks };
  });

  pi.on("context", (event, ctx) => {
    if (originalHost === undefined || !ctx.model || !renderPreset(ctx.model, options)) return;
    let changed = false;
    const messages = event.messages.map(message => {
      if (message.role !== "custom" || typeof message.customType !== "string" || typeof message.content !== "string") return message;
      const content = message.customType === "orchestrate-notice"
        ? adaptOrchestrateNotice(message.content) : adaptPrewalkNotice(message.customType, message.content);
      if (content === message.content) return message;
      changed = true;
      return { ...message, content };
    });
    return changed ? { messages } : undefined;
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (!ctx.model) return;
    const payload = ctx.agent.kind === "main" ? rewritePresetPayload(event.payload, ctx.model.api,
      `<omp-ulw-policy>\n<ultrawork-mode>${ulwDirective}</ultrawork-mode>\n</omp-ulw-policy>`,
      /<(om[op]-ulw-policy)>[\s\S]*?<\/\1>/g) : event.payload;
    if (originalBehavior === undefined || originalHost === undefined) return payload;
    const active = new Set(pi.getActiveTools());
    options = { ...options, toolNames: pi.getAllTools().map(tool => tool.name).filter(name => active.has(name)) };
    const key = JSON.stringify([ctx.model.provider, ctx.model.id, ctx.model.name, options.toolNames]);
    let replacement = profiles.get(key);
    if (replacement === undefined) {
      const preset = renderPreset(ctx.model, options);
      replacement = { prompt: markPreset(preset?.prompt ?? originalBehavior, ctx.agent.kind === "sub"), modelGuidance: preset !== undefined };
      profiles.set(key, replacement);
    }
    const host = originalHost;
    const modelGuidance = replacement.modelGuidance;
    const refreshed = rewritePresetPayload(payload, ctx.model.api, replacement.prompt);
    const projected = rewritePresetPayload(refreshed, ctx.model.api,
      text => projectHostGuidance(text, host, modelGuidance), /^[\s\S]+$/);
    return modelGuidance ? rewriteToolGuidancePayload(projected, ctx.model.api) : projected;
  });
  registerPrewalk(pi);
}
