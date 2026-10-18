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
const directive = readFileSync(join(skillRoot, "ultrawork/SKILL.md"), "utf8").split("<ultrawork-mode>")[1].split("</ultrawork-mode>")[0];
const astraDirective = readFileSync(join(skillRoot, "ultrawork/references/astra-directive.md"), "utf8");

export function selectUlwDirective(modelId: string | undefined): string {
  if (modelId === undefined) return directive;
  const name = modelId.split("/").at(-1);
  if (name !== undefined && /^gpt-6-astra(?:-fast)?$/i.test(name)) return astraDirective;
  return directive;
}
const notAfterIdentifier = String.raw`(?<![A-Za-z0-9][-_.]|[/\\])`;
const segmentEnd = String.raw`(?![-_.]?[A-Za-z0-9])`;
const notIntoIdentifier = String.raw`(?![-_](?!(?:loop|plan|research|execute|mass)${segmentEnd})[A-Za-z0-9]|\.[A-Za-z0-9])(?![-_.]?[A-Za-z0-9]*[/\\])`;
const ulwKeyword = new RegExp(String.raw`${notAfterIdentifier}\b(?:ultrawork|ulw)\b${notIntoIdentifier}`, "i");
const nativeGoalKeyword = new RegExp(String.raw`${notAfterIdentifier}\b(?:ultrawork|ulw)\b${segmentEnd}`, "i");
const workflows = [
  { name: "mass-ulw", pattern: /\b(?:mass[\s-]*ulw|ulw[\s-]*mass|mulw|meth)\b/i },
  { name: "ulw-plan", pattern: /\bulw[\s-]*plan\b/i },
  { name: "ulw-loop", pattern: /\bulw[\s-]*loop\b/i },
  { name: "ulw-execute", pattern: /\bulw[\s-]*execute\b/i },
  { name: "ulw-research", pattern: /\b(?:ulw|mass[\s-]*ulw|ulw[\s-]*mass|mulw|meth)[\s-]*research\b/i },
  ...["debugging", "review-work", "visual-qa", "visualize", "frontend", "data-scientist", "remove-ai-slops", "hyperplan", "memory-advisor", "reflection", "init-deep"].map(name => ({
    name, pattern: new RegExp(String.raw`(?:^\s*/?|\s/)${name}(?=\s|$)`, "i"),
  })),
].map(workflow => ({ ...workflow, pattern: new RegExp(notAfterIdentifier + workflow.pattern.source + notIntoIdentifier, "i") }));

/** Native ULW ignores quoted code and already-expanded directive/pointer blocks. */
export function visibleUlwText(text: string): string {
  if (/^\s*(?:\[(?:[A-Z][A-Z0-9_-]{2,}|[\w.-]+ -> [\w.-]+)\]|[A-Z][\w.-]{0,30} \([^()\s]{1,40}\)(?:, | to )[\w.-]{1,40}:)/.test(text)) return text.replace(/[^\r\n]/g, "\0");
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

export function registerUlw(pi: UlwApi): void {
  pi.registerFlag("omo-ultrawork-disabled", { description: "Disable automatic Native ULW arming", type: "boolean", default: false });
  pi.registerFlag("omo-ulw-workflows-disabled", { description: "Disable OMP workflow skill pointers", type: "boolean", default: false });
  pi.registerFlag("omo-ulw-continuation-disabled", { description: "Disable ULW loop/execute continuation", type: "boolean", default: false });
  let armed = false;
  let rearmed = false;
  let inputSource: InputEvent["source"] | undefined;
  let commandPending = false;
  let nativeGoalActive = false;
  let continuationFingerprint: string | undefined;
  let consecutiveContinuations = 0;

  const restore = (_event: unknown, ctx: UlwContext) => {
    armed = false;
    rearmed = false;
    inputSource = undefined;
    commandPending = false;
    nativeGoalActive = false;
    continuationFingerprint = undefined;
    consecutiveContinuations = 0;
    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type === "custom" && entry.customType === stateType && typeof entry.data === "boolean") armed = entry.data;
    }
  };
  for (const event of ["session_start", "session_switch", "session_branch", "session_tree"] as const) pi.on(event, restore);
  pi.on("goal_updated", event => {
    nativeGoalActive = event.state?.enabled !== false && event.goal?.status === "active";
  });
  pi.on("session_compact", () => { rearmed = armed; });
  pi.on("input", (event, ctx) => {
    inputSource = event.source;
    if (event.source !== "extension") { continuationFingerprint = undefined; consecutiveContinuations = 0; }
    if (ctx.agent.kind !== "main" || event.source === "extension" || nativeGoalActive) return;
    const visible = visibleUlwText(event.text);
    if (nativeGoalKeyword.test(visible) && !/^\s*\/goal(?:\s|$)/i.test(event.text)) {
      return { text: `/goal ${event.text}` };
    }
  });
  for (const name of ["ulw", ...workflows.map(workflow => workflow.name)]) {
    pi.registerCommand(name, {
      description: `Run the OMP-adapted ${name} workflow`,
      handler: async args => {
        commandPending = true;
        continuationFingerprint = undefined;
        consecutiveContinuations = 0;
        pi.sendUserMessage(name === "ulw" ? `/goal ulw\n\n${args}` : `${name}\n\n${args}`);
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
    let text = event.prompt;
    // Native skill messages contain reference prose; only their trailing user arguments can activate workflows.
    if (text.startsWith('[IMPORTANT: User invoked the "')) {
      text = text.trimEnd().match(/\r?\n\[Skill directory: [^\r\n]+\]\r?\nResolve relative paths in this skill[^\r\n]*(?:\r?\nUser: ([\s\S]*))?$/)?.[1] ?? "";
    }
    if (text.startsWith("/skill:")) {
      const argumentsAt = text.search(/\s/);
      text = argumentsAt < 0 ? "" : text.slice(argumentsAt + 1);
    }
    text = visibleUlwText(text);
    // Initial CLI prompts may bypass the input event; child briefs never arm workflows.
    const eligible = commandPending || inputSource !== "extension";
    inputSource = undefined;
    commandPending = false;
    const selected = eligible && !pi.getFlag("omo-ulw-workflows-disabled")
      ? workflows.filter(workflow => workflow.pattern.test(text) && !event.prompt.includes(`<skill name="${workflow.name}"`)) : [];
    if (!pi.getFlag("omo-ultrawork-disabled") && eligible && ulwKeyword.test(text)) {
      if (!armed) { armed = true; pi.appendEntry(stateType, true); }
    }
    if ((!armed || pi.getFlag("omo-ultrawork-disabled")) && selected.length === 0) return;
    const blocks = event.systemPrompt.filter(block => !/^<om[op]-ulw-policy>/.test(block));
    if (armed && !pi.getFlag("omo-ultrawork-disabled")) {
      // A current system block survives compaction and provider fallback without replaying a 31KB user message.
      blocks.push(`<omp-ulw-policy>\n<ultrawork-mode>${selectUlwDirective(ctx.model?.id)}</ultrawork-mode>\n</omp-ulw-policy>`);
    }
    const pointers = selected.map(workflow => `<omp-${workflow.name}-pointer>This message mentions ${workflow.name}. If the user is asking to run it, read ${join(skillRoot, workflow.name, "SKILL.md")} and follow its complete workflow. If it is only discussed, quoted or relayed, ignore this pointer. This session's run id is ${ctx.sessionManager.getSessionId()}.</omp-${workflow.name}-pointer>`);
    if (rearmed) {
      pointers.unshift("<omp-ultrawork-reminder>ultrawork mode is already armed for this session - the complete directive in the current system prompt remains binding; re-read the durable notepad and resume without repeating completed bootstrap or checks.</omp-ultrawork-reminder>");
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
            const planPath = join(ctx.cwd, work.active_plan);
            if (!existsSync(planPath)) continue;
            const plan = readFileSync(planPath, "utf8");
            const tasks = [...visibleUlwText(plan).matchAll(/^- \[([ xX~])\] /gm)];
            if (tasks.length === 0) continue;
            const pending = tasks.some(task => task[1] === " ");
            const blocked = tasks.some(task => task[1] === "~");
            if (!pending && blocked) continue;
            fingerprint = raw + plan;
            reason = `Resume ulw-execute from ${boulderPath} and ${planPath}; ${pending
              ? "integrate pending child results and execute the next dependency-ready pending task, including pending Final Verification Wave rows; capture evidence and update Boulder/ledger"
              : "all top-level tasks are checked; verify the Final Verification Wave and its evidence, then mark the Boulder work complete and finalize its ledger"}.${blocked ? " Treat [~] rows and transitive dependents as terminal non-success; never reopen or re-queue them. Final verification checks delivered work and reports known gaps without treating those gaps alone as new failures. When pending work ends, report every unmet gap, mark Boulder blocked and stop without claiming success." : ""} Respect cancellation, approvals and blocked/paused state.`;
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
          reason = `Resume ulw-loop from ${loopPath} and its brief/ledger; execute the next eligible goal, capture real-surface criterion evidence, and checkpoint only after all gates pass. Do not re-plan completed work. Respect cancellation, approvals and blocked/paused state.`;
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
