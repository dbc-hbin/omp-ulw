import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import ompUlw from "./index";
import { renderPreset } from "./presets";
import type { UlwContext } from "./ulw";
import { ulwDirective } from "./ulw";

type Handler = (event: never, ctx: never) => unknown;

test("unsupported models preserve native policy and tools at turn start and after supported-model fallback", () => {
  const base = readFileSync(new URL("./tests/fixtures/omp-system-prompt.md", import.meta.url), "utf8");
  const nativeTools = ["eval", "todo", "bash"].map(name => ({
    type: "function",
    function: {
      name,
      description: name === "eval" ? [
        "One cell per call; top-level state persists, including across compaction.",
        "For 2+ independent items, use a named `workpool()`; results auto-deliver.",
        "<prelude>", "```",
        "sh(command, cwd?, timeout?); JS: await sh(…) or await sh`cmd ${arg}` — embedded bash engine, runs to completion (never backgrounded)",
        "  returns stdout+stderr; non-zero exit raises ShellError (.exit_code/.exitCode, .output)",
        "  JS interpolations are shell-quoted; starts in the session cwd unless cwd is given",
        "```", "</prelude>",
      ].join("\n")
        : name === "todo" ? "`todo` NEVER takes a turn of its own: emit it in the same response as your next real tool call (parallel tool calls), `init` beside the first read or action, `done`/`start` beside the next action or check. A response whose only call is `todo` wastes a full model round trip.\nTasks identified by verbatim content, NEVER generated IDs (task-1)."
        : "Persistent bash 5.3.\ncwd will reset after each turn, don't rely on cd; `pty` = interactive.",
      parameters: { type: "object", properties: { value: { type: "string" } } },
    },
  }));
  for (const initialModel of ["unknown-model", "gpt-6.1-sol", "gpt-6.1-terra"]) {
    const handlers = new Map<string, Handler[]>();
    let activeTools = ["eval", "todo", "bash"];
    ompUlw({
      setLabel: () => {}, getActiveTools: () => activeTools, getAllTools: () => nativeTools.map(tool => ({ name: tool.function.name })),
      registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
      getFlag: () => false, appendEntry: () => {},
      on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
    });
    const ctx = {
      cwd: ".", mode: "rpc", agent: { kind: "main" },
      sessionManager: { getSessionId: () => "native-fallback", getBranch: () => [] },
      ui: { notify: () => {} }, model: { id: initialModel, api: "openai-completions" },
    };
    let blocks = [base];
    for (const handler of handlers.get("before_agent_start") ?? []) {
      const result = Reflect.apply(handler, undefined, [{ prompt: "ordinary task", systemPrompt: blocks }, ctx]);
      if (typeof result === "object" && result !== null && "systemPrompt" in result && Array.isArray(result.systemPrompt)) blocks = result.systemPrompt;
    }
    const nativeRegion = base.slice(base.indexOf("\n§ Tool Policy\n"));
    if (initialModel === "unknown-model") expect(blocks[0].slice(blocks[0].indexOf("\n§ Tool Policy\n"))).toBe(nativeRegion);
    const request = handlers.get("before_provider_request")?.[0];
    if (!request) throw new Error("Expected provider request hook");
    const payload = { messages: [{ role: "system", content: blocks[0] }], tools: nativeTools };
    for (const id of ["unknown-model", "gpt-6.1-sol", "gpt-6.1-terra", "unknown-model"]) {
      ctx.model.id = id;
      const result: unknown = Reflect.apply(request, undefined, [{ payload }, ctx]);
      if (typeof result !== "object" || result === null || !("messages" in result) || !Array.isArray(result.messages) || !("tools" in result)) throw new Error("Expected provider payload");
      const message: unknown = result.messages[0];
      if (typeof message !== "object" || message === null || !("content" in message) || typeof message.content !== "string") throw new Error("Expected system content");
      if (id === "unknown-model") {
        expect(message.content.slice(message.content.indexOf("\n§ Tool Policy\n"))).toBe(nativeRegion);
        expect(result.tools).toEqual(nativeTools);
      } else {
        expect(message.content.slice(message.content.indexOf("\n§ Tool Policy\n"))).not.toBe(nativeRegion);
        expect(message.content).toMatch(/Never make a todo-only turn: (?:send|emit) todo in the same response as the next real tool call\./);
        expect(message.content).toContain("Use `sh()` only when the live eval documentation exposes it, for short commands. It runs to completion without auto-backgrounding");
        expect(result.tools).toEqual(nativeTools.map(tool => ({
          ...tool,
          function: {
            ...tool.function,
            description: tool.function.name === "eval"
              ? tool.function.description.replace("For 2+ independent items, use a named `workpool()`; results auto-deliver.", "`workpool()` results auto-deliver.").replace(", runs to completion (never backgrounded)", "")
              : tool.function.name === "todo"
                ? tool.function.description.replace("`todo` NEVER takes a turn of its own: emit it in the same response as your next real tool call (parallel tool calls), ", "").replace(" A response whose only call is `todo` wastes a full model round trip.", "")
                : tool.function.description,
          },
        })));
      }
    }
    // The current tool-dependent profile, not stale preset text or tool descriptions, owns coverage.
    ctx.model.id = "gpt-6.1-terra";
    activeTools = ["bash"];
    const missingCoverage: unknown = Reflect.apply(request, undefined, [{ payload }, ctx]);
    if (typeof missingCoverage !== "object" || missingCoverage === null || !("tools" in missingCoverage)) throw new Error("Expected provider tools");
    expect(missingCoverage.tools).toEqual(nativeTools.map(tool => ({
      ...tool,
      function: {
        ...tool.function,
        description: tool.function.description
          .replace("For 2+ independent items, use a named `workpool()`; results auto-deliver.", "`workpool()` results auto-deliver.")
          .replace(" (parallel tool calls)", ""),
      },
    })));
  }
});

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

test("ULW policy refreshes stale system blocks across model fallback without touching user or tool text", () => {
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
  const stale = original.replace(ulwDirective, "previously shipped policy");
  const payload = { messages: [{ role: "system", content: stale }, { role: "user", content: stale }, { role: "tool", content: stale }], tools: [{ type: "function", function: { name: "task", description: "Read-only research MUST use `scout` only when files unknown." } }] };
  const hook = handlers.get("before_provider_request")![0];
  for (const id of ["gpt-6-astra", "gpt-6.1-sol", "gpt-6-astra-fast", "unknown-model"]) {
    ctx.model.id = id;
    expect(hook({ payload } as never, ctx as never)).toEqual({ ...payload, messages: [{ role: "system", content: original }, payload.messages[1], payload.messages[2]] });
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
  const profile = renderPreset({ id: "gpt-6-astra" }, { surface: "app", toolNames: activeTools, subagent: true })!.prompt;
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
    const expected = renderPreset(ctx.model, { surface: "app", toolNames: activeTools, subagent: true })?.prompt ?? base.slice(base.indexOf("\n§ Role\n") + "\n§ Role\n".length, base.indexOf("\n§ Runtime\n"));
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
  const currentPayload = { messages: blocks.map(content => ({ role: "system", content })) };
  const refreshed: unknown = Reflect.apply(hook, undefined, [{ payload: currentPayload }, ctx]);
  if (typeof refreshed !== "object" || refreshed === null || !("messages" in refreshed) || !Array.isArray(refreshed.messages)) {
    throw new Error("Expected refreshed provider messages");
  }
  const currentProfile = renderPreset(ctx.model, { surface: "app", toolNames: activeTools, subagent: true });
  if (!currentProfile) throw new Error("Expected selected child profile");
  expect(refreshed.messages[0].content).toContain(`<omp-model-preset>\n${currentProfile.prompt}`);
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

test("native prewalk rewriting preserves user and tool content and unsupported profiles", () => {
  const handlers = new Map<string, Handler[]>();
  ompUlw({
    setLabel: () => {}, getActiveTools: () => [], getAllTools: () => [],
    registerCommand: () => {}, sendUserMessage: () => {}, registerFlag: () => {},
    getFlag: () => false, appendEntry: () => {},
    on: (event: string, handler: Handler) => { handlers.set(event, [...(handlers.get(event) ?? []), handler]); },
  });
  const ctx = {
    cwd: ".", mode: "rpc", agent: { kind: "main" },
    sessionManager: { getSessionId: () => "prewalk-context", getBranch: () => [] },
    ui: { notify: () => {} }, model: { id: "gpt-6.1-sol", api: "openai-completions" },
  };
  const start = handlers.get("before_agent_start")?.[1];
  const context = handlers.get("context")?.[0];
  if (!start || !context) throw new Error("Expected model and context hooks");
  const systemPrompt = [readFileSync(new URL("./tests/fixtures/omp-system-prompt.md", import.meta.url), "utf8")];
  Reflect.apply(start, undefined, [{ systemPrompt }, ctx]);
  const content = "STOP: In NEXT reply write complete plan. Use todo to capture 5–9 items.";
  const user = { role: "user", content };
  const tool = { role: "toolResult", content };
  const custom = { role: "custom", customType: "user-note", content, display: false };
  const native = { role: "custom", customType: "prewalk-plan", content, display: false };
  const messages = [user, tool, custom, native];
  const result: unknown = Reflect.apply(context, undefined, [{ messages }, ctx]);
  if (typeof result !== "object" || result === null || !("messages" in result) || !Array.isArray(result.messages)) throw new Error("Expected rewritten native steering");
  const rewritten: unknown = result.messages[3];
  if (typeof rewritten !== "object" || rewritten === null || !("content" in rewritten) || typeof rewritten.content !== "string") throw new Error("Expected native steering text");
  expect(result.messages.slice(0, 3)).toEqual([user, tool, custom]);
  expect({ ...rewritten, content }).toEqual(native);
  expect(rewritten.content).toContain("Reuse the approved plan");
  expect(rewritten.content).not.toContain("5–9 items");
  expect(native.content).toBe(content);
  ctx.model.id = "unknown-model";
  expect(Reflect.apply(context, undefined, [{ messages }, ctx])).toBeUndefined();
});
