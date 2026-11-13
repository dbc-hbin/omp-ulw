import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export interface UlwContext {
  cwd: string;
  model?: { id: string };
  agent: { kind: "main" | "sub" };
  sessionManager: { getSessionId(): string; getBranch(): Array<{ type: string; customType?: string; data?: unknown; content?: unknown }> };
  ui: { notify(message: string, level: "warning"): void };
}
interface InputEvent { text: string; source: "interactive" | "rpc" | "extension" }
interface InputEventResult { text?: string }
interface UlwMessage { customType: string; content: string; display: false }
export interface UlwApi {
  registerCommand(name: string, options: { description: string; handler: (args: string, ctx: UlwContext) => Promise<void> }): void;
  sendUserMessage(content: string): void;
  registerFlag(name: string, options: { description: string; type: "boolean"; default: boolean }): void;
  getFlag(name: string): boolean | string | undefined;
  appendEntry(customType: string, data: unknown): void;
  on(event: "input", handler: (event: InputEvent, ctx: UlwContext) => InputEventResult | void): void;
  on(event: "goal_updated", handler: (event: { goal?: { status?: string } | null; state?: { enabled?: boolean } }, ctx: UlwContext) => void): void;
  on(event: "session_start" | "session_switch" | "session_branch" | "session_tree" | "session_compact", handler: (event: unknown, ctx: UlwContext) => void): void;
  on(event: "before_agent_start", handler: (event: { prompt: string; systemPrompt: string[] }, ctx: UlwContext) => { systemPrompt: string[]; message?: UlwMessage } | undefined): void;
  on(event: "session_stop", handler: (event: { signal: AbortSignal }, ctx: UlwContext) => { continue: true; additionalContext: string } | undefined): void;
}

// Keep persisted session keys and shipped CLI flags stable; emitted prompts use OMP names.
const stateType = "omo-ultrawork:state";
const skillRoot = fileURLToPath(new URL("./skills/", import.meta.url));
export const ulwDirective = readFileSync(join(skillRoot, "ultrawork/SKILL.md"), "utf8").split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0];
const segmentEnd = String.raw`(?![-_.]?[A-Za-z0-9])`;
const notIntoIdentifier = String.raw`(?![-_](?!(?:loop|plan|research|execute|mass)${segmentEnd})[A-Za-z0-9]|\.[A-Za-z0-9])(?![-_.]?[A-Za-z0-9]*[/\\])`;
// A mode invocation leads the input; aliases inside the task remain ordinary text.
const invocationStart = String.raw`^\s*\/?`;
const ulwInvocation = new RegExp(String.raw`${invocationStart}(?:ultrawork|ulw)\b${notIntoIdentifier}`, "i");
const nativeGoalInvocation = new RegExp(String.raw`${invocationStart}(?:ultrawork|ulw)\b${segmentEnd}(?=[\s:.,!?]|$)`, "i");
const nativeKeyword = /(?<![\p{L}\p{N}_./\\-])(?<!::)(?:ultrathink|orchestrate|workflowz|jevify)(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()/u;
const workflows: Array<{ name: string; pattern: RegExp; nativeKeyword?: string }> = [
  { name: "mass-ulw", pattern: /\b(?:mass[\s-]*ulw|ulw[\s-]*mass|mulw|meth)\b/i, nativeKeyword: "workflowz" },
  { name: "ulw-plan", pattern: /\bulw[\s-]*plan\b/i, nativeKeyword: "ultrathink" },
  { name: "ulw-loop", pattern: /\bulw[\s-]*loop\b/i, nativeKeyword: "orchestrate" },
  { name: "ulw-execute", pattern: /\bulw[\s-]*execute\b/i, nativeKeyword: "orchestrate" },
  { name: "ulw-research", pattern: /\b(?:ulw|mass[\s-]*ulw|ulw[\s-]*mass|mulw|meth)[\s-]*research\b/i, nativeKeyword: "workflowz" },
  ...["browser", "computer-use", "ultimate-browsing", "coding-agent-sessions", "debugging", "review-work", "eval-integrity", "visual-qa", "visualize", "frontend", "data-scientist", "remove-ai-slops", "hyperplan", "memory-advisor", "reflection", "init-deep", "ast-grep", "lsp-setup", "refactor"].map(name => ({
    name, pattern: new RegExp(name + String.raw`(?=\s|$)`, "i"),
  })),
].map(workflow => ({ ...workflow, pattern: new RegExp(invocationStart + workflow.pattern.source + notIntoIdentifier + String.raw`(?=[\s:.,!?]|$)`, "i") }));

/** Native ULW ignores quoted code and already-expanded directive/pointer blocks. */
export function visibleUlwText(text: string): string {
  if (/\[IMPORTANT:\s*User invoked the "[^"\r\n]+" skill; follow its instructions\./i.test(text) ||
    /^\s*(?:\[(?:[A-Z][A-Z0-9_-]{2,}|[\w.-]+ -> [\w.-]+)\]|[A-Z][\w.-]{0,30} \([^()\s]{1,40}\)(?:, | to )[\w.-]{1,40}:)/.test(text)) {
    return text.replace(/[^\r\n]/g, "\0");
  }
  text = text.replace(/<(om[op]-[a-z0-9-]+-pointer|ultrawork-mode|om[op]-(?:ulw|ultrawork)-reminder)>[\s\S]*?<\/\1>/gi, value => value.replace(/[^\r\n]/g, "\0"));
  const fences = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n|$)/gm;
  for (;;) {
    const opening = fences.exec(text);
    if (!opening) break;
    const closing = new RegExp(`^ {0,3}${opening[1][0]}{${opening[1].length},}[ \\t]*\\r?$`, "gm");
    closing.lastIndex = fences.lastIndex;
    const limit = closing.exec(text)?.index;
    const end = limit === undefined ? text.length : closing.lastIndex;
    text = text.slice(0, opening.index) + text.slice(opening.index, end).replace(/[^\r\n]/g, "\0") + text.slice(end);
    fences.lastIndex = end;
  }
  return text.replace(/(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, value => value.replace(/[^\r\n]/g, "\0"))
    .replace(/^ {0,3}>[^\n]*/gm, value => value.replace(/[^\r\n]/g, "\0"))
    .replace(/"[^"\n]*"|\u201C[^\u201D\n]*\u201D/g, value => value.replace(/[^\r\n]/g, "\0"))
    .replace(/(?<![a-z0-9+.-])[a-z][a-z0-9+.-]*:\/\/[^\s<>"'`]+/gi, value => value.replace(/[^\r\n]/g, "\0"))
    .replace(/\b(?:do\s+not|don['\u2019]t|dont|never)\s+(?:load|use|run|invoke|start|trigger|arm|enable)\b[^.;:!?\n]*?(?=[.;:!?\n]|\s(?:but|then|instead|however)\b|\s[\u2014\u2013-]\s|$)/gi, value => value.replace(/[^\r\n]/g, "\0"));
}

/** Preserve workflow identity while excluding expanded skill reference prose. */
export function ulwRequest(prompt: string): { text: string; workflow?: string; invocationLength: number } {
  let text = prompt;
  let workflow: string | undefined;
  let invocationLength = 0;
  const skill = /^\s*\[IMPORTANT:\s*User invoked the "([^"\r\n]+)" skill;/.exec(prompt);
  if (skill) {
    text = prompt.trimEnd().match(/\r?\n\[Skill directory: [^\r\n]+\]\r?\nResolve relative paths in this skill[^\r\n]*(?:\r?\nUser: ([\s\S]*))?$/)?.[1] ?? "";
    workflow = skill[1];
  } else {
    const command = /^\s*\/skill:([\w-]+)(?:\s|$)/.exec(prompt);
    if (command) {
      text = prompt.slice(command[0].length);
      workflow = command[1];
    } else {
      const visible = visibleUlwText(prompt);
      const invocation = workflows.flatMap(candidate => {
        const match = candidate.pattern.exec(visible);
        return match ? [{ name: candidate.name, length: match[0].length }] : [];
      }).sort((a, b) => b.length - a.length)[0];
      workflow = invocation?.name;
      invocationLength = invocation?.length ?? ulwInvocation.exec(visible)?.[0].length ?? 0;
    }
  }
  const remaining = visibleUlwText(text.slice(invocationLength));
  const start = remaining.length - remaining.trimStart().length;
  const keyword = nativeKeyword.exec(remaining.slice(start));
  if (keyword?.index === 0) invocationLength += start + keyword[0].length;
  return { text, workflow, invocationLength };
}

export function registerUlw(pi: UlwApi): void {
  pi.registerFlag("omo-ultrawork-disabled", { description: "Disable automatic Native ULW arming", type: "boolean", default: false });
  pi.registerFlag("omo-ulw-workflows-disabled", { description: "Disable OMP workflow skill pointers", type: "boolean", default: false });
  pi.registerFlag("omo-ulw-continuation-disabled", { description: "Disable ULW loop/execute continuation", type: "boolean", default: false });
  let armed = false;
  let rearmed = false;
  let inputSource: InputEvent["source"] | undefined;
  let commandPending = false;
  let nativeGoalOwned = false;
  let continuationFingerprint: string | undefined;
  let consecutiveContinuations = 0;

  const withNativeKeyword = (text: string, ctx: UlwContext): InputEventResult | undefined => {
    if (ctx.agent.kind !== "main" || pi.getFlag("omo-ulw-workflows-disabled")) return;
    const start = text.match(/^\s*\/?/)?.[0].length ?? 0;
    const visible = visibleUlwText(text.slice(start));
    // Prefer the longest alias so "mass ulw research" stays one invocation.
    const invocation = workflows.flatMap(workflow => {
      const match = workflow.pattern.exec(visible);
      return workflow.nativeKeyword && match?.index === 0 && /^(?:\s|$)/.test(visible.slice(match[0].length))
        ? [{ keyword: workflow.nativeKeyword, length: match[0].length }] : [];
    }).sort((a, b) => b.length - a.length)[0];
    if (!invocation) return;
    const end = start + invocation.length;
    // A user-supplied native word, including a quoted or negated mention, owns
    // selection. Let OMP's matcher decide whether it actually activates.
    if (nativeKeyword.test(text.slice(end))) return { text };
    // Put the trigger before arguments so an unclosed code fence cannot hide it.
    // OMP owns notices, tool/settings gates, deduplication and thinking effort.
    return { text: `${text.slice(0, end)} ${invocation.keyword}${text.slice(end)}` };
  };

  const restore = (_event: unknown, ctx: UlwContext) => {
    armed = false;
    rearmed = false;
    inputSource = undefined;
    commandPending = false;
    nativeGoalOwned = false;
    continuationFingerprint = undefined;
    consecutiveContinuations = 0;
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "custom" && entry.customType === stateType && typeof entry.data === "boolean") armed = entry.data;
    }
  };
  for (const event of ["session_start", "session_switch", "session_branch", "session_tree"] as const) pi.on(event, restore);
  pi.on("goal_updated", event => {
    // Native creation rejects every existing nonterminal goal, including paused work.
    nativeGoalOwned = event.goal?.status !== undefined && event.goal.status !== "complete" && event.goal.status !== "dropped";
  });
  pi.on("session_compact", () => { rearmed = armed; });
  pi.on("input", (event, ctx) => {
    inputSource = event.source;
    if (event.source !== "extension") { continuationFingerprint = undefined; consecutiveContinuations = 0; }
    const connected = event.source === "extension" ? undefined : withNativeKeyword(event.text, ctx);
    if (connected) return connected;
    // Native /goal is a TUI command; RPC text would only persist a fake command.
    if (ctx.agent.kind !== "main" || event.source !== "interactive" || nativeGoalOwned) return;
    // Route the slash alias before its handler calls sendUserMessage(), which
    // bypasses command expansion and cannot create a native goal.
    const text = event.text.replace(/^(\s*)\/(ulw)(?=\s|$)/i, "$1$2");
    const visible = visibleUlwText(text);
    if (nativeGoalInvocation.test(visible) && !workflows.some(workflow => workflow.pattern.test(visible)) && !/^\s*\/goal(?:\s|$)/i.test(event.text)) {
      return { text: `/goal ${text}` };
    }
  });
  for (const name of ["ulw", ...workflows.map(workflow => workflow.name)]) {
    // OMP owns /browser for headless/visible mode; keep that builtin intact.
    pi.registerCommand(name === "browser" ? "web-browser" : name, {
      description: `Run the OMP-adapted ${name} workflow`,
      handler: async (args, ctx) => {
        commandPending = true;
        continuationFingerprint = undefined;
        consecutiveContinuations = 0;
        // OMP's sendUserMessage() disables slash-command expansion. A
        // `/goal ...` payload would therefore be persisted as ordinary user
        // text instead of creating a native goal.
        const text = name === "ulw" ? `ulw${args ? ` ${args}` : ""}` : `${name}\n\n${args}`;
        pi.sendUserMessage(withNativeKeyword(text, ctx)?.text ?? text);
      },
    });
  }

  pi.on("before_agent_start", (event, ctx) => {
    if (ctx.agent.kind !== "main") {
      inputSource = undefined;
      commandPending = false;
      const blocks = event.systemPrompt.filter(block => !/^<om[op]-ulw-policy>/.test(block));
      return blocks.length === event.systemPrompt.length ? undefined : { systemPrompt: blocks };
    }
    let { text } = ulwRequest(event.prompt);
    text = text.replace(/^\s*\/goal\s+/i, "");
    text = visibleUlwText(text);
    // Initial CLI prompts may bypass the input event; child briefs never arm workflows.
    const eligible = commandPending || inputSource !== "extension";
    inputSource = undefined;
    commandPending = false;
    const selected = eligible && !pi.getFlag("omo-ulw-workflows-disabled")
      ? workflows.filter(workflow => workflow.pattern.test(text) && !event.prompt.includes(`<skill name="${workflow.name}"`)) : [];
    if (!pi.getFlag("omo-ultrawork-disabled") && eligible && ulwInvocation.test(text)) {
      if (!armed) { armed = true; pi.appendEntry(stateType, true); }
    }
    if ((!armed || pi.getFlag("omo-ultrawork-disabled")) && selected.length === 0) return;
    const blocks = event.systemPrompt.filter(block => !/^<om[op]-ulw-policy>/.test(block));
    if (armed && !pi.getFlag("omo-ultrawork-disabled")) {
      // Keep one current policy across compaction and provider fallback.
      blocks.push(`<omp-ulw-policy>\n<ultrawork-mode>${ulwDirective}</ultrawork-mode>\n</omp-ulw-policy>`);
    }
    const pointers = selected.map(workflow => `<omp-${workflow.name}-pointer>The user explicitly invoked ${workflow.name}. Read ${join(skillRoot, workflow.name, "SKILL.md")} and follow its workflow contract. This session's run id is ${ctx.sessionManager.getSessionId()}.</omp-${workflow.name}-pointer>`);
    if (rearmed) {
      pointers.unshift("<omp-ultrawork-reminder>ULW is already active. Resume the existing OMP goal or selected workflow state; do not create a duplicate goal or repeat completed work.</omp-ultrawork-reminder>");
      rearmed = false;
    }
    return { systemPrompt: blocks, ...(pointers.length ? { message: { customType: "omo-ultrawork:directive", content: pointers.join("\n"), display: false as const } } : {}) };
  });

  pi.on("session_stop", (event, ctx) => {
    if (event.signal.aborted || ctx.agent.kind !== "main" || pi.getFlag("omo-ulw-continuation-disabled") || consecutiveContinuations >= 8) return;
    const id = ctx.sessionManager.getSessionId();
    const loopPath = join(ctx.cwd, "doc/ulw-loop", id, "goals.json");
    const boulderPath = join(ctx.cwd, "doc/boulder.json");
    let fingerprint: string | undefined;
    let reason: string | undefined;
    try {
      if (existsSync(boulderPath)) {
        const raw = readFileSync(boulderPath, "utf8");
        const boulder: unknown = JSON.parse(raw);
        if (typeof boulder === "object" && boulder !== null && "works" in boulder && typeof boulder.works === "object" && boulder.works !== null) {
          for (const work of Object.values(boulder.works)) {
            if (typeof work !== "object" || work === null || !("status" in work) || work.status !== "active" || !("session_ids" in work) || !Array.isArray(work.session_ids) || !work.session_ids.includes("omp:" + id) || !("active_plan" in work) || typeof work.active_plan !== "string") continue;
            const nativePlan = work.active_plan.startsWith("local://");
            const planPath = nativePlan ? work.active_plan : join(ctx.cwd, work.active_plan);
            let plan = "";
            let statuses: string[];
            if (nativePlan) {
              if (!("execution_tasks" in work) || !Array.isArray(work.execution_tasks)) continue;
              const tasks: unknown[] = work.execution_tasks;
              if (!tasks.every((task): task is { plan_ref: string; status: "pending" | "complete" | "blocked" } =>
                typeof task === "object" && task !== null && "plan_ref" in task && typeof task.plan_ref === "string" && task.plan_ref.trim() !== "" &&
                "status" in task && (task.status === "pending" || task.status === "complete" || task.status === "blocked"))) continue;
              statuses = tasks.map(task => task.status);
            } else {
              if (!existsSync(planPath)) continue;
              plan = readFileSync(planPath, "utf8");
              statuses = [...visibleUlwText(plan).matchAll(/^- \[([ xX~])\] /gm)].map(task => task[1] === " " ? "pending" : task[1] === "~" ? "blocked" : "complete");
            }
            if (statuses.length === 0) continue;
            const pending = statuses.includes("pending");
            const blocked = statuses.includes("blocked");
            if (!pending && blocked) continue;
            fingerprint = raw + plan;
            reason = `Resume ulw-execute from ${boulderPath} and ${planPath}; ${nativePlan ? "preserve the approved local plan and use this work's execution_tasks for progress; reuse its authoritative inline copy or read the URI through OMP, never as a filesystem path. " : ""}${pending
              ? "integrate pending child results and execute the next dependency-ready pending task, including pending Final Verification Wave rows; capture evidence and update Boulder/ledger"
              : "all execution tasks are verified; finish the approved verification and authorized delivery, then mark the Boulder work complete and finalize its ledger"}.${blocked ? " Treat blocked tasks ([~] rows or execution_tasks status blocked) and transitive dependents as terminal non-success; never reopen or re-queue them. Final verification checks delivered work and reports known gaps without treating those gaps alone as new failures. When pending work ends, report every unmet gap, mark Boulder blocked and stop without claiming success." : ""} Respect cancellation, approvals and blocked/paused state.`;
            break;
          }
        }
      }
      if (fingerprint === undefined && existsSync(loopPath)) {
        const raw = readFileSync(loopPath, "utf8");
        const loop: unknown = JSON.parse(raw);
        const goals: unknown[] = typeof loop === "object" && loop !== null && "goals" in loop && Array.isArray(loop.goals) ? loop.goals : [];
        if (typeof loop === "object" && loop !== null && "status" in loop && loop.status === "active" && goals.some(goal => typeof goal === "object" && goal !== null && "status" in goal && (goal.status === "pending" || goal.status === "in_progress"))) {
          fingerprint = raw;
          reason = `Resume the owning workflow from ${loopPath} and its linked brief/ledger; continue the next eligible goal under that workflow's criteria, capture criterion evidence, and checkpoint only after all gates pass. Shared loop-format state does not select ulw-loop: preserve standalone research ownership and its source/citation requirements. Do not re-plan completed work. Respect cancellation, approvals and blocked/paused state.`;
        }
      }
    } catch (error) {
      ctx.ui.notify(`ULW continuation: state could not be read: ${error instanceof Error ? error.message : String(error)}`, "warning");
      return;
    }
    // Native continuation stops on stale state, not an unbounded finish-claim loop.
    if (fingerprint === undefined || fingerprint === continuationFingerprint || reason === undefined) return;
    continuationFingerprint = fingerprint;
    consecutiveContinuations++;
    return { continue: true, additionalContext: reason };
  });
}
