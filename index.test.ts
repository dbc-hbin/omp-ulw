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
  const payload = { messages: [{ role: "system", content: original }, { role: "user", content: original }, { role: "tool", content: original }], tools: [{ type: "function", function: { name: "task", description: "Read-only research MUST use `scout` only when files unknown." } }] };
  const hook = handlers.get("before_provider_request")![0];
  for (const id of ["gpt-6-astra", "gpt-6.1-sol", "gpt-6-astra-fast", "unknown-model"]) {
    ctx.model.id = id;
    const policy = `<omp-ulw-policy>\n<ultrawork-mode>${selectUlwDirective(id)}</ultrawork-mode>\n</omp-ulw-policy>`;
    const expected = original.replace(/<omp-ulw-policy>[\s\S]*?<\/omp-ulw-policy>/g, () => policy);
    expect(hook({ payload } as never, ctx as never)).toEqual({ ...payload, messages: [{ role: "system", content: expected }, payload.messages[1], payload.messages[2]] });
  }
});

test("child profiles follow their model while preserving role, assignment, tools and completion", () => {
  const handlers = new Map<string, Handler[]>();
  let activeTools = ["read", "eval"];
  ompUlw({
    setLabel: () => {}, getActiveTools: () => activeTools, getAllTools: () => [{ name: "read" }, { name: "eval" }, { name: "ask" }],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx: UlwContext & { mode: "rpc"; model: { id: string; name: string; provider: string; api: string } } = {
    cwd: ".", mode: "rpc", agent: { kind: "sub" },
    sessionManager: { getSessionId: () => "child-assignment", getBranch: () => [] },
    ui: { notify: () => {} },
    model: { id: "gpt-6.1-terra", name: "GPT 6.1 Terra", provider: "openai", api: "openai-completions" },
  };
  const base = "Host\n§ Role\nOriginal host role\n§ Runtime\nRuntime\n§ Tool Policy\nPolicy\n# Tool I/O\nTools\n# Delegation\nDelegation\n§ Workflow\nChild verification policy";
  const assignment = [base, "<project-context>Keep project rules</project-context>", "§ Role\nRead-only specialist\n§ Context\nChild assignment\n§ Completion\nReturn through host protocol"];
  let blocks = assignment;
  for (const handler of handlers.get("before_agent_start") ?? []) {
    const result = handler({ prompt: "implement the assigned unit", systemPrompt: blocks } as never, ctx as never);
    if (typeof result === "object" && result !== null && "systemPrompt" in result && Array.isArray(result.systemPrompt)) blocks = result.systemPrompt as string[];
  }
  const profile = renderPreset({ id: "gpt-6.1-sol" }, { surface: "app", toolNames: activeTools, subagent: true })!.prompt;
  expect(blocks[0]).toContain(`<omp-model-preset>\n${profile}`);
  expect(blocks.slice(1)).toEqual(assignment.slice(1));
  expect(assignment[0]).toBe(base);
  const originalProfile = /<omp-model-preset>\n([\s\S]*?)\n<\/omp-model-preset>/.exec(blocks[0])![1];
  const scope = originalProfile.slice(profile.length);
  const user = { role: "user", content: blocks[0] };
  const tools = [{ type: "function", function: { name: "read", parameters: { type: "object" } } }];
  const hook = handlers.get("before_provider_request")![0];
  for (const id of ["claude-haiku-5.5", "gpt-6.1-terra-fast", "deepseek-v4.1-flash", "unknown-model", "gpt-6-astra"]) {
    ctx.model.id = id;
    ctx.model.name = id;
    const expected = renderPreset({ ...ctx.model, id: id.replace("terra", "sol") }, { surface: "app", toolNames: activeTools, subagent: true })?.prompt ?? base.slice(base.indexOf("\n§ Role\n") + "\n§ Role\n".length, base.indexOf("\n§ Runtime\n"));
    const payload = { messages: [...blocks.map(content => ({ role: "system", content })), user], tools };
    const updated = hook({ payload } as never, ctx as never) as typeof payload;
    expect(updated.messages[0].content).toContain(`<omp-model-preset>\n${expected}${scope}\n</omp-model-preset>`);
    expect(updated.messages.slice(1)).toEqual(payload.messages.slice(1));
    expect(updated.messages.at(-1)).toBe(user);
    expect(updated.tools).toBe(tools);
    expect(updated.messages[0].content.match(/<omp-model-preset>/g)).toHaveLength(1);
    expect(updated.messages[0].content).not.toContain("<omp-ulw-policy>");
    expect(hook({ payload: updated } as never, ctx as never)).toBe(updated);
  }
  // A new turn must use the child's current tool set, not a parent's or an earlier turn's.
  activeTools = ["read"];
  const result = handlers.get("before_agent_start")![1]({ prompt: "continue", systemPrompt: assignment } as never, ctx as never) as { systemPrompt: string[] };
  expect(result.systemPrompt[0]).toContain(`<omp-model-preset>\n${renderPreset(ctx.model, { surface: "app", toolNames: activeTools, subagent: true })!.prompt}`);
  expect(result.systemPrompt.slice(1)).toEqual(assignment.slice(1));
});

test("custom child prompts and their request payloads remain untouched", () => {
  const handlers = new Map<string, Handler[]>();
  ompUlw({
    setLabel: () => {}, getActiveTools: () => ["read"], getAllTools: () => [{ name: "read" }],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx = {
    cwd: ".", mode: "rpc", agent: { kind: "sub" },
    sessionManager: { getSessionId: () => "custom-child", getBranch: () => [] },
    ui: { notify: () => {} },
    model: { id: "gpt-6-astra", api: "openai-completions" },
  };
  const systemPrompt = ["Custom child system", "Assignment and completion"];
  for (const handler of handlers.get("before_agent_start") ?? []) {
    expect(handler({ prompt: "ulw inspect", systemPrompt } as never, ctx as never)).toBeUndefined();
  }
  const payload = { messages: systemPrompt.map(content => ({ role: "system", content })) };
  expect(handlers.get("before_provider_request")![0]({ payload } as never, ctx as never)).toBe(payload);
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
