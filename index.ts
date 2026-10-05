/**
 * OMO 5.1.18 model-prompt port. Installed in the global extensions directory;
 * new omp sessions discover index.ts automatically. Restart omp to load it.
 * Changelog: initial faithful core/shared-builder/tuning port, with omp tool
 * transport adaptation and request-model refresh for supported provider hooks.
 * User/custom prompts, project rules, skills and worker assignments are preserved.
 * Unrecognized templates are left unchanged with a warning. Unsupported models
 * retain omp behavior; runtime does not read the omo binary or require a parser.
 * Cursor blob prompts and providers bypassing onPayload (including command-code-go
 * and GitLab workflow) receive turn-start profiles but cannot refresh them mid-turn.
 * Regression checks: bun test in this directory. Upstream provenance and the
 * reproducible extractor live in upstream/; presets.ts contains transport adaptations.
 */
import { replaceHostBehavior } from "./host";
import { rewritePresetPayload } from "./payload";
import { renderPreset } from "./presets";
import type { PresetModel, PresetOptions } from "./presets";

interface PromptContext {
  model?: PresetModel & { api: string };
  mode: "tui" | "rpc" | "json" | "print";
  ui: { notify(message: string, level: "warning"): void };
}
interface ExtensionApi {
  setLabel(label: string): void;
  getActiveTools(): string[];
  getAllTools(): Array<{ name: string }>;
  on(event: "before_agent_start", handler: (event: { systemPrompt: string[] }, ctx: PromptContext) => { systemPrompt: string[] } | undefined): void;
  on(event: "before_provider_request", handler: (event: { payload: unknown }, ctx: PromptContext) => unknown): void;
}

export default function omoPrompts(pi: ExtensionApi): void {
  pi.setLabel("OMO model prompts");
  let originalBehavior: string | undefined;
  let options: PresetOptions = { surface: "terminal", toolNames: [] };
  const profiles = new Map<string, string>();
  let warned = false;

  pi.on("before_agent_start", (event, ctx) => {
    originalBehavior = undefined;
    profiles.clear();
    const active = new Set(pi.getActiveTools());
    const host = event.systemPrompt.join("\n");
    options = {
      surface: ctx.mode === "rpc" ? "app" : "terminal",
      toolNames: pi.getAllTools().map(tool => tool.name).filter(name => active.has(name) || host.includes("`" + name + "`") || host.includes("tool." + name)),
    };
    const preset = ctx.model ? renderPreset(ctx.model, options) : undefined;
    const marked = "<omo-model-preset>\n" + (preset?.prompt ?? "") + "\n</omo-model-preset>";
    const result = replaceHostBehavior(event.systemPrompt, marked);
    if (!result) {
      if (!warned) {
        ctx.ui.notify("OMO prompts: custom or unfamiliar system template preserved; model preset replacement not applied.", "warning");
        warned = true;
      }
      return;
    }
    originalBehavior = result.originalBehavior;
    if (preset && ctx.model) profiles.set(ctx.model.id + "\n" + (ctx.model.name ?? ""), marked);
    if (!preset) result.blocks[0] = result.blocks[0].replace(marked, "<omo-model-preset>\n" + originalBehavior + "\n</omo-model-preset>");
    return { systemPrompt: result.blocks };
  });

  pi.on("before_provider_request", (event, ctx) => {
    if (originalBehavior === undefined || !ctx.model) return;
    const key = ctx.model.id + "\n" + (ctx.model.name ?? "");
    let replacement = profiles.get(key);
    if (replacement === undefined) {
      const preset = renderPreset(ctx.model, options);
      replacement = "<omo-model-preset>\n" + (preset?.prompt ?? originalBehavior) + "\n</omo-model-preset>";
      profiles.set(key, replacement);
    }
    // The adapter touches only our system-prompt marker, never advisor/custom/user messages.
    return rewritePresetPayload(event.payload, ctx.model.api, replacement);
  });
}
