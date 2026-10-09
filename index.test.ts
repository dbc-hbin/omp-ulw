import { expect, test } from "bun:test";
import omoPrompts from "./index";
import { renderPreset } from "./presets";
import type { UlwContext } from "./ulw";
import { selectUlwDirective } from "./ulw";

type Handler = (event: never, ctx: never) => unknown;

test("provider fallback refreshes the profile even with identical model id and name", () => {
  const handlers = new Map<string, Handler[]>();
  omoPrompts({
    setLabel: () => {}, getActiveTools: () => [], getAllTools: () => [],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx: UlwContext & { mode: "rpc"; model: { id: string; name: string; provider: string; api: string } } = {
    cwd: ".", mode: "rpc", agent: { kind: "main" },
    sessionManager: { getSessionId: () => "profile-test", getBranch: () => [] },
    ui: { notify: message => { throw new Error(message); } },
    model: { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "deepseek", api: "openai-completions" },
  };
  const base = "Host\n§ Role\nRole\n§ Runtime\nRuntime\n§ Tool Policy\nPolicy\n# Tool I/O\nTools\n# Delegation\nDelegation\n§ Workflow\nWorkflow";
  let blocks = [base];
  for (const handler of handlers.get("before_agent_start") ?? []) {
    const result = handler({ prompt: "ordinary task", systemPrompt: blocks } as never, ctx as never);
    if (typeof result === "object" && result !== null && "systemPrompt" in result && Array.isArray(result.systemPrompt) && result.systemPrompt.every((block: unknown) => typeof block === "string")) blocks = result.systemPrompt;
  }
  const hook = handlers.get("before_provider_request")![0];
  const payload = { messages: [{ role: "system", content: blocks.join("\n") }] };
  for (const provider of ["deepseek", "openrouter", "deepseek", "openrouter"]) {
    ctx.model.provider = provider;
    const prompt = renderPreset(ctx.model, { surface: "app", toolNames: [] })!.prompt;
    const content = payload.messages[0].content.replace(/<omo-model-preset>[\s\S]*?<\/omo-model-preset>/g, () => `<omo-model-preset>\n${prompt}\n</omo-model-preset>`);
    expect(hook({ payload } as never, ctx as never)).toEqual({ messages: [{ role: "system", content }] });
  }
});

test("ULW policy follows request-model fallback without touching user or tool text", () => {
  const handlers = new Map<string, Handler[]>();
  omoPrompts({
    setLabel: () => {}, getActiveTools: () => [], getAllTools: () => [],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx: UlwContext & { mode: "rpc"; model: { id: string; api: string } } = {
    cwd: ".", mode: "rpc", agent: { kind: "main" },
    sessionManager: { getSessionId: () => "model-fallback", getBranch: () => [] },
    ui: { notify: () => {} }, model: { id: "gpt-6.1-sol", api: "openai-completions" },
  };
  let blocks = ["custom host and project rules"];
  for (const handler of handlers.get("before_agent_start") ?? []) {
    const result = handler({ prompt: "ulw perform the task", systemPrompt: blocks } as never, ctx as never);
    if (typeof result === "object" && result !== null && "systemPrompt" in result && Array.isArray(result.systemPrompt) && result.systemPrompt.every((block: unknown) => typeof block === "string")) blocks = result.systemPrompt;
  }
  const original = blocks.join("\n");
  const payload = { messages: [{ role: "system", content: original }, { role: "user", content: original }, { role: "tool", content: original }] };
  const hook = handlers.get("before_provider_request")![0];
  for (const id of ["gpt-6-astra", "gpt-6.1-sol", "gpt-6-astra-fast", "unknown-model"]) {
    ctx.model.id = id;
    const policy = `<omo-ulw-policy>\n<ultrawork-mode>${selectUlwDirective(id)}</ultrawork-mode>\n</omo-ulw-policy>`;
    const expected = original.replace(/<omo-ulw-policy>[\s\S]*?<\/omo-ulw-policy>/g, () => policy);
    expect(hook({ payload } as never, ctx as never)).toEqual({ messages: [{ role: "system", content: expected }, payload.messages[1], payload.messages[2]] });
  }
});
