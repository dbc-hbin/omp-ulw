import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { registerUlw, visibleUlwText } from "./ulw";
import type { UlwApi, UlwContext } from "./ulw";

type Handler = (event: never, ctx: UlwContext) => unknown;
interface Prepared { systemPrompt: string[]; message?: { content: string; display: boolean } }
interface Continued { continue: boolean; additionalContext: string }
class Host {
  handlers = new Map<string, Handler>();
  flags = new Map<string, boolean>();
  entries: Array<{ type: string; customType?: string; data?: unknown }> = [];
  warnings: string[] = [];
  commands = new Map<string, (args: string, ctx: UlwContext) => Promise<void>>();
  submitted: string | undefined;
  context: UlwContext;
  constructor(cwd = ".") {
    this.context = {
      cwd, agent: { kind: "main" },
      sessionManager: { getSessionId: () => "test-session", getBranch: () => this.entries },
      ui: { notify: message => { this.warnings.push(message); } },
    };
    const api: UlwApi = {
      registerCommand: (name, options) => { this.commands.set(name, options.handler); },
      sendUserMessage: content => { this.submitted = content; },
      registerFlag: (name, options) => { this.flags.set(name, options.default); },
      getFlag: name => this.flags.get(name),
      appendEntry: (customType, data) => { this.entries.push({ type: "custom", customType, data }); },
      on: (event, handler) => { this.handlers.set(event, handler as Handler); },
    };
    registerUlw(api);
  }
  emit(event: string, payload: unknown = {}): unknown {
    return this.handlers.get(event)?.(payload as never, this.context);
  }
  prepare(prompt: string, source: "interactive" | "rpc" | "extension" = "interactive", systemPrompt = ["host", "project rules"]): Prepared | undefined {
    const inputResult = this.emit("input", { text: prompt, source }) as { text?: string } | undefined;
    return this.emit("before_agent_start", { prompt: inputResult?.text ?? prompt, systemPrompt }) as Prepared | undefined;
  }
}

describe("Native ULW session behavior", () => {
  test("activation and model changes retain the single shipped ULW policy", () => {
    const body = readFileSync(new URL("./skills/ultrawork/SKILL.md", import.meta.url), "utf8").split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0];
    for (const id of ["gpt-6-astra", "claude-opus-5", undefined]) {
      const host = new Host();
      host.context.model = id === undefined ? undefined : { id };
      expect(host.prepare("ulw perform the assigned task")!.systemPrompt[2]).toBe(`<omp-ulw-policy>\n<ultrawork-mode>${body}</ultrawork-mode>\n</omp-ulw-policy>`);
      host.context.model = { id: "gpt-6-astra" };
      expect(host.prepare("continue")!.systemPrompt[2]).toBe(`<omp-ulw-policy>\n<ultrawork-mode>${body}</ultrawork-mode>\n</omp-ulw-policy>`);
    }
  });
  test("slash commands activate all modes without allowing unrelated extension messages to arm them", async () => {
    for (const [name, keyword] of [["ulw", ""], ["ulw-plan", "ultrathink"], ["ulw-loop", "orchestrate"], ["ulw-execute", "orchestrate"], ["ulw-research", "workflowz"], ["mass-ulw", "workflowz"]]) {
      const host = new Host();
      await host.commands.get(name)!("the requested task", host.context);
      expect(host.submitted).toBe(name === "ulw" ? "ulw the requested task" : `${name} ${keyword}\n\nthe requested task`);
      expect(host.prepare(host.submitted!, "extension")).toBeDefined();
    }
  });

  test("native workflow defaults are idempotent and preserve explicit native choices", () => {
    for (const [text, connected] of [
      ["/ulw-plan", "/ulw-plan ultrathink"],
      ["ulw plan task", "ulw plan ultrathink task"],
      ["ulwloop task", "ulwloop orchestrate task"],
      ["ulw-execute task", "ulw-execute orchestrate task"],
      ["mass ulw research task", "mass ulw research workflowz task"],
      ["mulw task", "mulw workflowz task"],
      ["/ulw-research ```\nsource", "/ulw-research workflowz ```\nsource"],
      ["/ulw-execute workflowz task", "/ulw-execute workflowz task"],
      ["/ulw-execute use workflowz.", "/ulw-execute use workflowz."],
      ["/ulw-execute use workflowz.ts", "/ulw-execute orchestrate use workflowz.ts"],
      ["/ulw-plan jevify task", "/ulw-plan jevify task"],
      ["/ulw-loop don't use orchestrate", "/ulw-loop don't use orchestrate"],
    ]) {
      const host = new Host();
      for (const source of ["interactive", "rpc"]) {
        expect(host.emit("input", { text, source })).toEqual({ text: connected });
        expect(host.emit("input", { text: connected, source })).toEqual({ text: connected });
      }
    }
  });

  test("native workflow defaults do not activate from references, child briefs or disabled workflows", () => {
    for (const text of ["Explain ulw-plan", "`ulw-plan`", "> ulw-plan task", "ulw-plan.md", "[REPORT] ulw-plan", "ulw-plan계열 설명", "/skill:ulw-plan"]) {
      const host = new Host();
      expect(host.emit("input", { text, source: "rpc" })).toBeUndefined();
    }
    const host = new Host();
    expect(host.emit("input", { text: "ulw-plan task", source: "extension" })).toBeUndefined();
    host.context.agent.kind = "sub";
    expect(host.emit("input", { text: "ulw-plan task", source: "rpc" })).toBeUndefined();
    host.context.agent.kind = "main";
    host.flags.set("omo-ulw-workflows-disabled", true);
    expect(host.emit("input", { text: "/ulw-plan task", source: "rpc" })).toBeUndefined();
  });

  test("direct ULW input enters native goal mode while workflow-specific commands keep their durable loop", () => {
    const host = new Host();
    for (const text of ["ulw ship the fix", "/ulw ship the fix", "/ULW 사진에서 셰이더 후보를 좁혀줘.", "/ulw"]) {
      const result = host.emit("input", { text, source: "interactive" });
      expect(result).toEqual({ text: `/goal ${text.replace(/^\//, "")}` });
    }
    expect(host.prepare("ulw ship the fix")?.systemPrompt.some(block => block.startsWith("<omp-ulw-policy>"))).toBe(true);

    for (const text of ["Explain `/ulw`", "Explain /ulw", "What does /ulw-plan do?", "Read /ulw/notes.md", "Explain ulw", "What does ultrawork mean?", "Please use ulw loop for this task", "Please use /ulw loop for this task"]) {
      expect(host.emit("input", { text, source: "interactive" })).toBeUndefined();
    }
    for (const source of ["rpc", "extension"]) {
      for (const text of ["ulw ship the fix", "/ulw ship the fix"]) {
        expect(host.emit("input", { text, source })).toBeUndefined();
      }
    }
    for (const [status, enabled] of [["active", true], ["paused", false], ["budget-limited", false]]) {
      host.emit("goal_updated", { goal: { status }, state: { enabled } });
      expect(host.emit("input", { text: "ulw continue the existing goal", source: "interactive" })).toBeUndefined();
      expect(host.emit("input", { text: "/ulw continue the existing goal", source: "interactive" })).toBeUndefined();
    }
    for (const status of ["complete", "dropped", undefined]) {
      host.emit("goal_updated", { goal: status ? { status } : null, state: { enabled: false } });
      expect(host.emit("input", { text: "ulw start the next goal", source: "interactive" })).toEqual({ text: "/goal ulw start the next goal" });
    }
    expect(host.emit("input", { text: "ulw-loop continue the ledger", source: "interactive" })).toEqual({ text: "ulw-loop orchestrate continue the ledger" });
  });

  test("explicit specialised invocations never create a competing plain goal, including with pointers disabled", () => {
    for (const disabled of [false, true]) {
      for (const text of ["ulw loop the task", "ulw plan the task", "ulw execute the task", "ulw research the task", "ulw mass the task"]) {
        const host = new Host();
        host.flags.set("omo-ulw-workflows-disabled", disabled);
        const result = host.emit("input", { text, source: "interactive" }) as { text: string } | undefined;
        expect(result?.text.startsWith("/goal ") ?? false).toBe(false);
        if (disabled) expect(result).toBeUndefined();
        else expect(host.prepare(text)?.message?.content).toContain("-pointer>");
      }
    }
  });
  test("legacy prompt blocks remain inert and are replaced on session resume", () => {
    for (const prefix of ["omo", "omp"]) {
      const host = new Host();
      for (const tag of [`${prefix}-ulw-loop-pointer`, `${prefix}-ultrawork-reminder`]) {
        expect(host.prepare(`<${tag}>ulw-loop resume</${tag}>`)).toBeUndefined();
      }
      host.entries = [{ type: "custom", customType: "omo-ultrawork:state", data: true }];
      host.emit("session_start");
      const blocks = ["host", `<${prefix}-ulw-policy>old directive</${prefix}-ulw-policy>`];
      const prepared = host.prepare("continue", "rpc", blocks)!;
      expect(prepared.systemPrompt).toHaveLength(2);
      expect(prepared.systemPrompt[1].startsWith("<omp-ulw-policy>")).toBe(true);
      expect(prepared.systemPrompt[1]).not.toContain("old directive");
      host.context.agent.kind = "sub";
      expect(host.prepare("continue", "rpc", blocks)).toEqual({ systemPrompt: ["host"] });
    }
  });
  test("quoted keywords, pointer blocks, skill-name-only commands and extension input cannot arm ULW", () => {
    const host = new Host();
    for (const text of ["ordinary task", "/skill:ulw-plan", "`ulw`", "``ultrawork``", "```js\nulw\n```", "~~~\nulw\n~~~", "```\nulw", "<omp-ulw-loop-pointer>ulw loop</omp-ulw-loop-pointer>", "<ultrawork-mode>ulw</ultrawork-mode>"]) {
      expect(host.prepare(text)).toBeUndefined();
    }
    expect(host.prepare("ulw build this", "extension")).toBeUndefined();
    expect(host.entries).toHaveLength(0);
    expect(visibleUlwText("```\nulw\n```\nulw outside")).toContain("ulw outside");
  });

  test("new skill commands emit installed pointers without arming ULW or leaking into children", async () => {
    expect(new Host().commands.has("computer")).toBe(false);
    for (const name of ["browser", "computer-use", "ultimate-browsing", "coding-agent-sessions", "debugging", "review-work", "eval-integrity", "visual-qa", "visualize", "frontend", "data-scientist", "remove-ai-slops", "hyperplan", "memory-advisor", "reflection", "init-deep"]) {
      const host = new Host();
      expect(host.commands.has("browser")).toBe(false);
      const command = name === "browser" ? "web-browser" : name;
      await host.commands.get(command)!("the assigned workflow", host.context);
      const prepared = host.prepare(host.submitted!, "extension")!;
      expect(prepared.systemPrompt).toEqual(["host", "project rules"]);
      expect(prepared.message?.content).toContain(`<omp-${name}-pointer>`);
      expect(existsSync(new URL(`./skills/${name}/SKILL.md`, import.meta.url))).toBe(true);
      expect(host.entries).toHaveLength(0);
      for (const text of ["`/" + name + "`", "open /" + name + "/SKILL.md", "Do not run /" + name, "[REPORT] /" + name]) expect(new Host().prepare(text)).toBeUndefined();
      expect(new Host().prepare(`/skill:${name} do the task`)).toBeUndefined();
      const child = new Host();
      child.context.agent.kind = "sub";
      expect(child.prepare(`/${name} the scoped work`)).toBeUndefined();
    }
  });

  test("native expanded skills activate only from user arguments, never their bodies", () => {
    for (const name of ["review-work", "hyperplan", "ulw-plan"]) {
      const body = readFileSync(new URL(`./skills/${name}/SKILL.md`, import.meta.url), "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
      for (const args of ["", "inspect the contract", "ulw fix this", "inspect first\nulw fix this", "ulw-plan plan this", "Explain `ulw-plan`", "Do not use ulw; inspect this", "mass-ulw do this"]) {
        const expanded = `[IMPORTANT: User invoked the "${name}" skill; follow its instructions. Full skill below.]\n\n${body}\n\n---\n\n[Skill directory: /skills/${name}]\nResolve relative paths in this skill against this directory.${args ? `\nUser: ${args}` : ""}`;
        for (const prompt of [expanded, expanded.replaceAll("\n", "\r\n"), `/skill:${name} ${args}`]) {
          const host = new Host();
          const prepared = host.emit("before_agent_start", { prompt, systemPrompt: ["host"] }) as Prepared | undefined;
          const armed = args.startsWith("ulw");
          expect(prepared?.systemPrompt.some(block => block.startsWith("<omp-ulw-policy>")) ?? false).toBe(armed);
          expect(host.entries).toHaveLength(armed ? 1 : 0);
          expect(prepared?.message?.content.includes("<omp-ulw-plan-pointer>") ?? false).toBe(args.startsWith("ulw-plan"));
          expect(prepared?.message?.content.includes("<omp-mass-ulw-pointer>") ?? false).toBe(args.startsWith("mass-ulw"));
          expect(host.prepare("continue")?.systemPrompt.some(block => block.startsWith("<omp-ulw-policy>")) ?? false).toBe(armed);
          expect(new Host().prepare(prompt, "extension")).toBeUndefined();
          const child = new Host();
          child.context.agent.kind = "sub";
          expect(child.prepare(prompt)).toBeUndefined();
        }
      }
    }
  });

  test("references, prohibitions and relayed text do not arm or emit workflow pointers", () => {
    for (const text of [
      "Explain ulw", "Explain /ulw", "What does /ulw-plan do?", "What does ultrawork mean?", "Explain ulw-plan", "Explain meth", "Please use ulw loop for this task", "Please use /ulw loop for this task",
      "check doc/ulw/notes.md, then ulw the fix", "Do not use tmux, but ulw the fix", "don\u2019t use tmux \u2014 ulw this", "don't run the old one; ulw the new one", "do not stop until done, ulw", 'Explain "ulw-loop", then ulw fix it', "> old ulw plan\nulw fix it",
      "check doc/ulw/notes.md, then /ulw the fix", "Do not use tmux, but /ulw the fix", "don't run the old one; /ulw the new one", "> old ulw plan\n/ulw fix it",
      "Read doc/ulw/notes.md", "open ulw-plan.md", "summarize ulw.md", "branch fix/ulw-plan-gate", "senpi-ulw-loop lane", "mass-ulw-loop-runner", "ulw-research_v2", "read ulw-execute/ledger.jsonl", "read C:\\ulw-plan\\notes.md",
      "Do not use ulw; fix this normally", "Don't load mass-ulw or ulw-research", "never run ulw-loop, ultrawork, or any skill here",
      "> ulw plan the old task", "[REPORT] worker mentioned ulw-loop", "[worker -> parent] ulw research", "Worker (abc), parent: ulw-loop",
      'Explain "ulw plan"', "Explain \u201Culw-loop\u201D", "see https://example.com/search?q=ulw&page=2", "see https://example.com/ulw-plan",
    ]) {
      const host = new Host();
      expect({ text, prepared: host.prepare(text) }).toEqual({ text, prepared: undefined });
      expect(host.entries).toHaveLength(0);
      expect(host.emit("before_agent_start", { prompt: text, systemPrompt: ["host"] })).toBeUndefined();
    }
  });

  test("leading aliases activate while references and contrast clauses remain task arguments", () => {
    for (const text of ["ulw-loop fix it", "ULTRAWORK: fix it", "ulw-plan.", "/ulw check doc/ulw/notes.md", "/ulw Do not use tmux, but fix it", "  /ulw-loop fix this", "\nULW fix this"]) {
      expect(new Host().prepare(text)?.systemPrompt.some(block => block.startsWith("<omp-ulw-policy>"))).toBe(true);
    }
    const mass = new Host();
    expect(new Host().prepare("ulw `ignored` loop")?.message).toBeUndefined();
    const prepared = mass.prepare("mass-ulw do the migration")!;
    expect(prepared.message?.content).toContain("<omp-mass-ulw-pointer>");
    expect(prepared.systemPrompt).toEqual(["host", "project rules"]);
    expect(mass.entries).toHaveLength(0);
  });

  test("arms once, preserves host blocks, deduplicates policy and survives compaction/resume without leaking to another session", () => {
    const host = new Host();
    const first = host.prepare("ULTRAWORK implement the task")!;
    const body = readFileSync(new URL("./skills/ultrawork/SKILL.md", import.meta.url), "utf8").split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0];
    expect(first.systemPrompt.slice(0, 2)).toEqual(["host", "project rules"]);
    expect(first.systemPrompt[2]).toBe(`<omp-ulw-policy>\n<ultrawork-mode>${body}</ultrawork-mode>\n</omp-ulw-policy>`);
    expect(host.prepare("continue", "rpc", first.systemPrompt)?.systemPrompt).toEqual(first.systemPrompt);
    expect(host.prepare("ulw keep going")?.systemPrompt).toEqual(first.systemPrompt);
    expect(host.entries).toHaveLength(1);
    host.emit("session_compact");
    expect(host.prepare("continue")?.message?.display).toBe(false);
    expect(host.prepare("continue")?.message).toBeUndefined();
    const resumed = new Host();
    resumed.entries = [...host.entries];
    resumed.emit("session_start");
    expect(resumed.prepare("continue")?.systemPrompt).toEqual(first.systemPrompt);
    resumed.entries = [];
    resumed.emit("session_switch");
    expect(resumed.prepare("continue")).toBeUndefined();
  });

  test("initial CLI prompts arm while child briefs never arm doctrine or specialised pointers", async () => {
    const cli = new Host();
    expect(cli.emit("before_agent_start", { prompt: "ulw task", systemPrompt: ["host"] })).toBeDefined();
    const child = new Host();
    child.context.agent.kind = "sub";
    for (const prompt of ["ULW: implement only your assigned unit", "ulw-plan", "mass ulw research", "ulw-loop", "ulw-execute"]) {
      expect(child.prepare(prompt)).toBeUndefined();
      expect(child.emit("before_agent_start", { prompt, systemPrompt: ["host"] })).toBeUndefined();
    }
    await child.commands.get("ulw-loop")!("the assigned unit", child.context);
    expect(child.prepare(child.submitted!, "extension")).toBeUndefined();
    expect(child.entries).toHaveLength(0);
    child.entries = [...cli.entries];
    child.emit("session_start");
    child.emit("session_compact");
    expect(child.prepare("continue")).toBeUndefined();
    expect(child.prepare("ULW: scoped unit", "rpc", ["host", "<omp-ulw-policy>inherited root rules</omp-ulw-policy>"])).toEqual({ systemPrompt: ["host"] });
    expect(child.emit("session_stop", { signal: new AbortController().signal })).toBeUndefined();
  });

  test("all specialised aliases resolve existing skills and overlapping pointers remain distinct", () => {
    const cases = [
      ["mass ulw", "mass-ulw"], ["ulw mass", "mass-ulw"], ["ulwmass", "mass-ulw"], ["mulw", "mass-ulw"], ["meth", "mass-ulw"],
      ["ulw plan", "ulw-plan"], ["ulwplan", "ulw-plan"], ["ulw-loop", "ulw-loop"], ["ulwloop", "ulw-loop"],
      ["ulw execute", "ulw-execute"], ["ulw research", "ulw-research"],
    ];
    for (const [text, name] of cases) {
      const message = new Host().prepare(text)?.message;
      expect(message?.content).toContain(`<omp-${name}-pointer>`);
      expect(existsSync(new URL(`./skills/${name}/SKILL.md`, import.meta.url))).toBe(true);
    }
    const overlap = new Host().prepare("mass ulw research the sources");
    for (const name of ["mass-ulw", "ulw-research"]) expect(overlap?.message?.content).toContain(`<omp-${name}-pointer>`);
    expect(overlap?.message?.content).not.toContain("<omp-ulw-loop-pointer>");
    expect(new Host().prepare("ulw task")?.message).toBeUndefined();
    expect(new Host().prepare('<skill name="ulw-plan">ulw plan</skill>')?.message).toBeUndefined();
  });

  test("disable flags preserve ordinary host behavior", () => {
    const host = new Host();
    host.flags.set("omo-ultrawork-disabled", true);
    host.flags.set("omo-ulw-workflows-disabled", true);
    expect(host.prepare("ulw-loop task")).toBeUndefined();
    expect(host.entries).toHaveLength(0);
  });
});

describe("evidence-bound ULW continuations", () => {
  test("native plans continue from session-owned execution progress without a filesystem plan or checkbox rewrite", () => {
    const cwd = mkdtempSync(join(tmpdir(), "omo-ulw-test-"));
    try {
      const host = new Host(cwd);
      mkdirSync(join(cwd, "doc"));
      const path = join(cwd, "doc/boulder.json");
      const work = {
        status: "active", session_ids: ["omp:other-session"], active_plan: "local://approved-plan.md",
        execution_tasks: [{ plan_ref: "Approach step 1", status: "pending" }, { plan_ref: "Verification", status: "pending" }],
      };
      const save = () => writeFileSync(path, JSON.stringify({ works: { test: work } }));
      const signal = new AbortController().signal;
      save();
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      work.session_ids = ["omp:test-session"];
      for (const status of ["pending", "blocked", "complete"]) {
        work.execution_tasks = [{ plan_ref: "Approach step 1", status }, { plan_ref: "Verification", status: status === "complete" ? "complete" : "pending" }];
        save();
        const before = readFileSync(path, "utf8");
        const result = host.emit("session_stop", { signal }) as Continued;
        expect(result.continue).toBe(true);
        expect(result.additionalContext).toContain("local://approved-plan.md");
        expect(host.emit("session_stop", { signal })).toBeUndefined();
        expect(readFileSync(path, "utf8")).toBe(before);
      }
      work.execution_tasks = [{ plan_ref: "Approach step 1", status: "blocked" }, { plan_ref: "Verification", status: "complete" }];
      save();
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      work.execution_tasks = [{ plan_ref: "Approach step 1", status: "pending" }];
      for (const status of ["paused", "blocked", "complete", "cancelled"]) {
        work.status = status;
        save();
        expect(host.emit("session_stop", { signal })).toBeUndefined();
      }
      expect(existsSync(join(cwd, "doc/plans"))).toBe(false);
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });

  test("native plan continuation requires a nonempty valid execution task set", () => {
    const cwd = mkdtempSync(join(tmpdir(), "omo-ulw-test-"));
    try {
      mkdirSync(join(cwd, "doc"));
      for (const execution_tasks of [undefined, [], [{ plan_ref: "", status: "pending" }], [{ plan_ref: "Approach step 1", status: "approved" }], [{ plan_ref: "Approach step 1", status: "pending" }, null]]) {
        writeFileSync(join(cwd, "doc/boulder.json"), JSON.stringify({ works: { test: {
          status: "active", session_ids: ["omp:test-session"], active_plan: "local://approved-plan.md", execution_tasks,
        } } }));
        expect(new Host(cwd).emit("session_stop", { signal: new AbortController().signal })).toBeUndefined();
      }
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });

  test("execute closes blocked rows while independent and final-verification tasks continue", () => {
    const cwd = mkdtempSync(join(tmpdir(), "omo-ulw-test-"));
    try {
      const host = new Host(cwd);
      mkdirSync(join(cwd, "doc/plans"), { recursive: true });
      const plan = join(cwd, "doc/plans/test.md");
      const boulder = join(cwd, "doc/boulder.json");
      const work = { status: "active", session_ids: ["omp:test-session"], active_plan: "doc/plans/test.md" };
      writeFileSync(boulder, JSON.stringify({ works: { test: work } }));
      const signal = new AbortController().signal;
      const blocked = "- [~] 1. Missing product behavior\n- [~] 2. blocked by 1\n";
      for (const remaining of ["- [ ] 3. Independent task\n\n## Final verification wave\n- [ ] F1. Verify delivered work\n", "- [x] 3. Independent task\n\n## Final verification wave\n- [ ] F1. Verify delivered work\n", "- [x] 3. Independent task\n\n## Final verification wave\n- [x] F1. Verify delivered work\n", ""]) {
        writeFileSync(plan, blocked + remaining);
        const result = host.emit("session_stop", { signal });
        if (remaining.includes("- [ ]")) expect((result as Continued).continue).toBe(true);
        else expect(result).toBeUndefined();
        expect(host.emit("session_stop", { signal })).toBeUndefined();
        expect(readFileSync(plan, "utf8")).toBe(blocked + remaining);
        expect(JSON.parse(readFileSync(boulder, "utf8")).works.test.status).toBe("active");
      }
      work.status = "blocked";
      writeFileSync(boulder, JSON.stringify({ works: { test: work } }));
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      host.emit("session_switch");
      expect(host.emit("session_stop", { signal })).toBeUndefined();
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });

  test("loop continuation is session-owned, progress-sensitive, cancellation-aware and stops for paused/blocked/completed work", () => {
    const cwd = mkdtempSync(join(tmpdir(), "omo-ulw-test-"));
    try {
      const host = new Host(cwd);
      const dir = join(cwd, "doc/ulw-loop/test-session");
      mkdirSync(dir, { recursive: true });
      const path = join(dir, "goals.json");
      const state = { status: "active", goals: [{ status: "pending" }], attempt: 1 };
      writeFileSync(path, JSON.stringify(state));
      const signal = new AbortController().signal;
      expect((host.emit("session_stop", { signal }) as Continued).continue).toBe(true);
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      state.attempt++;
      writeFileSync(path, JSON.stringify(state));
      expect((host.emit("session_stop", { signal }) as Continued).continue).toBe(true);
      for (const status of ["paused", "blocked", "failed", "complete", "cancelled"]) {
        writeFileSync(path, JSON.stringify({ ...state, status }));
        expect(host.emit("session_stop", { signal })).toBeUndefined();
      }
      writeFileSync(path, JSON.stringify({ ...state, attempt: 3 }));
      const cancelled = new AbortController();
      cancelled.abort();
      expect(host.emit("session_stop", { signal: cancelled.signal })).toBeUndefined();
      host.flags.set("omo-ulw-continuation-disabled", true);
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      host.flags.set("omo-ulw-continuation-disabled", false);
      writeFileSync(path, "{");
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      expect(host.warnings).toHaveLength(1);
      const bounded = new Host(cwd);
      for (let attempt = 0; attempt < 8; attempt++) {
        writeFileSync(path, JSON.stringify({ ...state, attempt }));
        expect((bounded.emit("session_stop", { signal }) as Continued).continue).toBe(true);
      }
      writeFileSync(path, JSON.stringify({ ...state, attempt: 8 }));
      expect(bounded.emit("session_stop", { signal })).toBeUndefined();
      bounded.prepare("continue");
      expect((bounded.emit("session_stop", { signal }) as Continued).continue).toBe(true);
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });

  test("execute continuation finishes final gates after checkboxes and stops only at terminal or stale state", () => {
    const cwd = mkdtempSync(join(tmpdir(), "omo-ulw-test-"));
    try {
      const host = new Host(cwd);
      mkdirSync(join(cwd, "doc/plans"), { recursive: true });
      const plan = join(cwd, "doc/plans/test.md");
      writeFileSync(plan, "- [ ] 1. Deliver the criterion\n");
      const boulder = join(cwd, "doc/boulder.json");
      const work = { status: "active", session_ids: ["omp:other-session"], active_plan: "doc/plans/test.md" };
      writeFileSync(boulder, JSON.stringify({ works: { test: work } }));
      const signal = new AbortController().signal;
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      work.session_ids = ["omp:test-session"];
      writeFileSync(boulder, JSON.stringify({ works: { test: work } }));
      expect((host.emit("session_stop", { signal }) as Continued).continue).toBe(true);
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      writeFileSync(plan, "- [x] 1. Deliver the criterion\n");
      expect((host.emit("session_stop", { signal }) as Continued).continue).toBe(true);
      expect(host.emit("session_stop", { signal })).toBeUndefined();
      for (const status of ["complete", "paused", "blocked", "failed", "cancelled"]) {
        work.status = status;
        writeFileSync(boulder, JSON.stringify({ works: { test: work } }));
        expect(host.emit("session_stop", { signal })).toBeUndefined();
      }
      work.status = "active";
      writeFileSync(boulder, JSON.stringify({ works: { test: work } }));
      for (const text of ["No countable tasks\n", "```markdown\n- [ ] Example only\n```\n"]) {
        writeFileSync(plan, text);
        expect(host.emit("session_stop", { signal })).toBeUndefined();
      }
      writeFileSync(plan, "- [X] 1. Deliver the criterion\n");
      expect((host.emit("session_stop", { signal }) as Continued).continue).toBe(true);
      expect(host.emit("session_stop", { signal })).toBeUndefined();
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });
});
