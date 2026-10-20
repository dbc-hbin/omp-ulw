import { expect, test } from "bun:test";
import ompUlw from "./index";
import { renderPreset } from "./presets";
import type { UlwContext } from "./ulw";
import { selectUlwDirective } from "./ulw";

type Handler = (event: never, ctx: never) => unknown;

test("provider fallback refreshes the profile even with identical model id and name", () => {
  const handlers = new Map<string, Handler[]>();
  ompUlw({
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
    const content = payload.messages[0].content.replace(/<omp-model-preset>[\s\S]*?<\/omp-model-preset>/g, () => `<omp-model-preset>\n${prompt}\n</omp-model-preset>`);
    expect(hook({ payload } as never, ctx as never)).toEqual({ messages: [{ role: "system", content }] });
  }
});

test("ULW policy follows request-model fallback without touching user or tool text", () => {
  const handlers = new Map<string, Handler[]>();
  ompUlw({
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
    const policy = `<omp-ulw-policy>\n<ultrawork-mode>${selectUlwDirective(id)}</ultrawork-mode>\n</omp-ulw-policy>`;
    const expected = original.replace(/<omp-ulw-policy>[\s\S]*?<\/omp-ulw-policy>/g, () => policy);
    expect(hook({ payload } as never, ctx as never)).toEqual({ messages: [{ role: "system", content: expected }, payload.messages[1], payload.messages[2]] });
  }
});

test("child assignments are not replaced by the main-agent preset", () => {
  const handlers = new Map<string, Handler[]>();
  ompUlw({
    setLabel: () => {}, getActiveTools: () => [], getAllTools: () => [],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx: UlwContext & { mode: "rpc"; model: { id: string; name: string; provider: string; api: string } } = {
    cwd: ".", mode: "rpc", agent: { kind: "sub" },
    sessionManager: { getSessionId: () => "child-assignment", getBranch: () => [] },
    ui: { notify: () => {} },
    model: { id: "gpt-6-astra", name: "GPT 6 Astra", provider: "openai", api: "openai-completions" },
  };
  const assignment = ["Host role", "Child assignment: edit only src/owned.ts", "Delegation contract: report to parent"];
  let blocks = assignment;
  for (const handler of handlers.get("before_agent_start") ?? []) {
    const result = handler({ prompt: "implement the assigned unit", systemPrompt: blocks } as never, ctx as never);
    if (typeof result === "object" && result !== null && "systemPrompt" in result && Array.isArray(result.systemPrompt)) blocks = result.systemPrompt as string[];
  }
  expect(blocks).toEqual(assignment);
});

test("inactive tools mentioned by the host do not enable preset branches", () => {
  const handlers = new Map<string, Handler[]>();
  ompUlw({
    setLabel: () => {}, getActiveTools: () => ["read"], getAllTools: () => [{ name: "read" }, { name: "ask" }],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx: UlwContext & { mode: "rpc"; model: { id: string; name: string; provider: string; api: string } } = {
    cwd: ".", mode: "rpc", agent: { kind: "main" },
    sessionManager: { getSessionId: () => "tool-availability", getBranch: () => [] },
    ui: { notify: () => {} },
    model: { id: "gpt-6-astra", name: "GPT 6 Astra", provider: "openai", api: "openai-completions" },
  };
  const base = "Host\n§ Role\nRole\n§ Runtime\nRuntime\n§ Tool Policy\nPolicy mentions `ask`\n# Tool I/O\nTools\n# Delegation\nDelegation\n§ Workflow\nWorkflow";
  const result = handlers.get("before_agent_start")![1]({ prompt: "implement this", systemPrompt: [base] } as never, ctx as never) as { systemPrompt: string[] };
  expect(result.systemPrompt.join("\n")).not.toContain("through ask when it is available");
});

test("print and json surfaces use app routing without terminal-only preambles", () => {
  for (const mode of ["print", "json"] as const) {
    const handlers = new Map<string, Handler[]>();
    ompUlw({
      setLabel: () => {}, getActiveTools: () => [], getAllTools: () => [],
      registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
      getFlag: () => false, appendEntry: () => {},
      on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
    });
    const ctx: UlwContext & { mode: typeof mode; model: { id: string; name: string; provider: string; api: string } } = {
      cwd: ".", mode, agent: { kind: "main" },
      sessionManager: { getSessionId: () => `surface-${mode}`, getBranch: () => [] },
      ui: { notify: () => {} },
      model: { id: "gpt-6-astra", name: "GPT 6 Astra", provider: "openai", api: "openai-completions" },
    };
    const base = "Host\n§ Role\nRole\n§ Runtime\nRuntime\n§ Tool Policy\nPolicy\n# Tool I/O\nTools\n# Delegation\nDelegation\n§ Workflow\nWorkflow";
    let blocks = [base];
    for (const handler of handlers.get("before_agent_start") ?? []) {
      const result = handler({ prompt: "implement this", systemPrompt: blocks } as never, ctx as never);
      if (typeof result === "object" && result !== null && "systemPrompt" in result && Array.isArray(result.systemPrompt)) blocks = result.systemPrompt as string[];
    }
    const preset = blocks.join("\n");
    expect(preset).not.toContain("Open every turn with one short routing line");
    expect(preset).not.toContain("I read this as [intent]");
  }
});
