import { ASYNC_DEFAULT, MONITOR_CONDITIONS, TURN_END_IS_WAIT, buildPreset, resolvePresetName } from "./upstream/presets.js";

export interface PresetModel { id: string; name?: string; provider?: string }
export interface PresetOptions { surface: "terminal" | "app"; toolNames: string[]; subagent?: boolean }

export function renderPreset(model: PresetModel, options: PresetOptions): { name: string; prompt: string } | undefined {
  let name = resolvePresetName({ id: model.id, name: model.name, provider: model.provider }, { promptPreset: "auto" });
  // Temporary child-only alias until upstream supplies GPT-6.1 Terra routing.
  if (!name && options.subagent) {
    const terra = /(^|[/@:._-])gpt[._-]?6(?:[._-]1|1)[._-]terra(?=$|[/@:._-])/i;
    name = resolvePresetName({
      id: model.id.replace(terra, "$1gpt-6.1-sol"),
      name: model.name?.replace(/\s+/g, "-").replace(terra, "$1gpt-6.1-sol"),
      provider: model.provider,
    }, { promptPreset: "auto" });
  }
  if (!name) return undefined;
  // Upstream gates its question directive on its own tool name; transport is adapted below.
  const selectedTools = options.toolNames.map(tool => tool === "ask" ? "request_user_input" : tool);
  const preset = buildPreset(name, { surface: options.surface, selectedTools });
  if (!preset) return undefined;
  let prompt = preset.prompt;
  const hasAsk = options.toolNames.includes("ask");
  const hasTask = options.toolNames.includes("task");
  const hasTodo = options.toolNames.includes("todo");
  const hasBash = options.toolNames.includes("bash");
  const hasWait = options.toolNames.includes("wait");
  if (preset.name === "claude-fable-5-2") {
    prompt = prompt.replace(
      "Make routine judgment calls yourself; ask only when different readings would lead to materially different work, and ask after doing everything that does not depend on the answer, through ask_user_question when it is available (waitForAnswer true when the next step depends on the answer).",
      "Make routine judgment calls yourself. Ask when missing information materially changes the deliverable or required authorization is absent; resolve that blocker when it arises and finish independent authorized work where possible. Use ask_user_question when it is available (waitForAnswer true when the next step depends on the answer).",
    );
  }
  prompt = prompt.replaceAll("`parallel(thunks)`", "`Promise.all` over independent `tool.*` calls")
    .replaceAll("the runtime's parallel helper", "Promise.all over independent tool calls in a JavaScript eval cell");
  if (!hasTodo) {
    prompt = prompt.replace(/^Todo discipline:.*\n?/gm, "")
      .replace(/^On any multi-step task, write the todo list before the first edit.*\n?/gm, "");
  }
  if (hasTodo && !prompt.includes("Never make a todo-only turn")) {
    prompt = prompt
      .replace("Todo discipline: for any non-trivial task", "Todo discipline: Never make a todo-only turn: send todo in the same response as the next real tool call. For any non-trivial task");
  }
  if (hasTodo && !prompt.includes("Never make a todo-only turn")) {
    prompt += "\n\n## OMP todo updates\n\nNever make a todo-only turn: emit todo in the same response as the next real tool call.";
  }
  // Handoffs should carry evidence, not repeat the request and a progress ledger.
  prompt = prompt
    .replaceAll(
      "Ask: [the user's original request] - wanted: [the outcome they asked for]. For you: [what they need to know now - ledger N/M done, findings, blockers]. Now: [the todo task in progress]. Next: [the next open task].",
      "[Outcome or material finding]. [Relevant evidence or blocker]. Include the next action only while work remains, and execute it in this response.",
    )
    .replace(
      /\[Outcome so far\]\s+toward\s+\[the user's original ask and the result they wanted\]\.\s+You need:\s+\[ledger N\/M done, findings, blockers\]\.\s+Now:\s+\[(?:the )?todo task in progress\]\.\s+Next:\s+\[(?:the )?next open task\]\./g,
      "[Outcome or material finding]. [Relevant evidence or blocker]. Include the next action only while work remains, and execute it in this response.",
    )
    .replaceAll("Now and Next are todo labels verbatim; the Next stated is executed in this same response with tool calls.", "Do not repeat todo labels or counters in replies; take any stated next action in the same response with tool calls.")
    .replaceAll("Between handoffs, after each tool wave that changes what you know, write one line of reply text: what you found, then `Now: [task]. Next: [task].`", "Between handoffs, report only material findings or blockers; do not narrate each tool wave.")
    .replaceAll("Between handoffs: after each tool wave that changes what you know, one line of reply text - what you found, then `Now: [task]. Next: [task].`", "Between handoffs, report only material findings or blockers; do not narrate each tool wave.")
    .replace(/The (?:named Next|Next you name) is executed in this same response with tool calls(?:; a Next with nothing after it is a defect)?\./g, "Execute any stated next action in the same response with tool calls.")
    .replace(/Open every turn with one (?:short )?(?:visible )?(?:routing )?line(?: - required even on confirmation turns|, confirmation turns included| before anything else)?:/g, match => preset.name.startsWith("kimi-k2-") ? match : "For a new substantial request, use at most one short routing line when it clarifies scope; on continuation or confirmation turns, execute without repeating it:")
    .replaceAll("The final message of a change is the handoff block and stands alone: the outcome first, then in its You need slot what a reader needs to trust it", "The final message of a change stands alone: the outcome first, then the evidence a reader needs to trust it")
    .replace(
      /Keep the labels Ask, wanted, For you, Now, and Next exactly as written; write everything else - (?:the routing line, )?slot contents, todo labels, and the reply itself - in the user's language \(the one their instructions name, else the one they write in\), with Now and Next repeating the todo labels verbatim\./g,
      "Write replies in the user's language (the one their instructions name, else the one they write in); do not impose fixed English labels or repeat todo labels.",
    )
    .replace(
      /Labels Ask, wanted, For you, Now, Next: exactly as written\. Everything else \((?:routing line, )?slot contents, todo labels, reply\) in user's language \(named in their instructions, else the one they write in\); Now\/Next repeat todo labels verbatim\./g,
      "Write replies in the user's language; do not impose fixed English labels or repeat todo labels.",
    )
    .replaceAll("The final message of a change opens with the Handoff block; its For you slot is", "The final message of a change stands alone")
    .replaceAll("Final message of a change opens with Handoff block; For you = for", "The final message of a change stands alone for")
    .replaceAll("The final message of a change opens with the Handoff block, its For you slot written", "The final message of a change stands alone, written")
    .replaceAll("open with the Handoff block if the turn changed something; its For you slot answers", "state")
    .replaceAll("The final message of a change opens with the Handoff block; write its For you slot", "Write the final message of a change")
    .replaceAll("The final message of a change is the Handoff block: its outcome and You need slots carry", "The final message of a change carries")
    .replaceAll("for a change, the Handoff block, whose For you slot leads", "for a change, a concise standalone answer leading")
    .replaceAll("for a change, the Handoff block, whose outcome leads and whose You need slot carries", "for a change, a standalone answer whose outcome leads and which carries");
  // Loaded references do not activate workflows or override the user in OMP.
  prompt = prompt.replace(/Injected directives (?:are binding:.*?execute the directive as written\.|\(skill contents, mode directives, hook and system messages\).*?execute it\.)/g,
    "Follow the host instruction hierarchy. Apply a skill only when its trigger matches the user's request; reading or quoting a workflow does not activate it. Skill guidance and reference material do not override explicit user instructions.");
  prompt = prompt.replace(
    "Results arrive on their own: when only waiting on them remains, end the turn.",
    options.toolNames.includes("wait")
      ? "Results arrive on their own: when only waiting on them remains, call native wait with no arguments."
      : "Results arrive on their own: when only waiting on them remains, return the pending state to the parent or host for result delivery.",
  );
  // Resolve material blockers when they arise; independent work must not delay required authorization.
  prompt = prompt.replace(
    "Authorization lasts the session; reads, reversible local edits, in-scope fixes, and non-destructive checks never need it. Ask only for an answer the session cannot supply that changes the outcome, after finishing everything that does not depend on it, so approval lands last on a reviewable result: a deploy, an external write, a merge, or a destructive command. Stopping to ask costs the user more than a reversible wrong guess costs you.",
    "Existing authorization applies only within its stated scope and the host/project rules. Proceed with ordinary reversible local work the request covers. Ask when missing information materially changes the deliverable or required authorization is absent; do not defer that question until the end or make a speculative change that depends on its answer. Finish independent in-scope work where possible. Deploys, external writes, merges, destructive commands, and paid actions require the applicable explicit authorization before execution.",
  );
  // OMP ask returns the answer inline; a resolved question is not a turn boundary.
  prompt = prompt.replace("Ask through request_user_input with wait_for_answer false so the question rides along while you work; true only when an irreversible next step turns on the answer. With no answer, proceed on best judgment. State permission requests directly, never through the tool.",
    "Ask through ask when it is available; ask blocks until answered, so use it for a material blocker or required approval. Use the host's available approval mechanism for permission requests; never treat silence as consent. If no answer is supplied, proceed on best judgment where safe.");
  prompt = prompt
    .replace("one narrow question through request_user_input when it is available, then stop", hasAsk
      ? "one narrow question through `ask`; continue with authorized work when the answer resolves the blocker"
      : "one narrow direct question, then return the unresolved decision to the user")
    .replaceAll("request_user_input", "ask").replaceAll("ask_user_question", "ask")
    .replaceAll(" (waitForAnswer true when the next step depends on the answer)", hasAsk ? " (ask blocks until answered)" : "")
    .replaceAll("through ask when it is available", hasAsk ? "through `ask`" : "with a direct question")
    .replaceAll("then ask, with a direct question", "then ask a direct question");
  if (hasAsk) {
    prompt = prompt
      .replaceAll(", and end the turn rather than ending on a promise", "; continue with authorized work when the answer resolves the blocker")
      .replaceAll("then ask and end the turn", "ask through `ask`; continue with authorized work when the answer resolves the blocker")
      .replaceAll("-> ask, end turn", "-> ask through `ask`, then continue with authorized work when the answer resolves the blocker")
      .replaceAll("ask the one specific question that unblocks the work, and end the turn", "ask the one specific question through `ask`; continue when the answer resolves the blocker")
      .replaceAll("ask one focused question and stop", "ask one focused question through `ask` and continue when the answer resolves the blocker")
      .replaceAll("for destructive actions, state the recommended action and stop", "for destructive actions, state the recommended action and obtain explicit approval before proceeding")
      .replaceAll("for a destructive action, state the recommended action and stop", "for a destructive action, state the recommended action and obtain explicit approval before proceeding");
  }
  // OMP's ask is blocking and an empty/dismissed answer is not authorization.
  prompt = prompt.replace(
    "If no answer is supplied, proceed on best judgment where safe.",
    "If the answer is empty, dismissed, or unavailable, treat it as no authorization: continue only with reversible, ordinary, in-scope local work and non-destructive validation; never perform destructive, external, irreversible, paid, or spend actions.",
  );
  // Keep implementation-intended diagnosis from being routed into an answer-only turn.
  prompt = prompt
    .replace(
      'Unless the user is explicitly asking a question, brainstorming, or requesting a plan, they want working code: "how does X work" means understand X to fix or improve it; "why is A broken" means diagnose and fix A. Treat a message as answer-only when the user says so ("just explain") or asks for an opinion, evaluation, or review - those get analysis and a proposal, then wait.',
      'Explanation questions ("how does X work?"), explicit investigation-only requests, opinions, evaluations, reviews, brainstorming, and plan requests get the requested answer without edits. An implementation-intended "why is A broken" request means diagnose and fix A. Otherwise, carry the requested implementation through to working code.',
    )
    .replace(
      "Information asks (explain, look into, investigate) get reading and a report, no edits.",
      "Explicit answer or investigation requests (for example, \"just explain\", \"investigate only\", or \"report findings without edits\") get reading and a report with no edits. When \"look into\" or \"why is this broken\" appears in an implementation-intended request, diagnose the issue and make the smallest complete fix; do not stop at findings.",
    )
    .replace(
      "Information asks (explain, look into, investigate): read the code and report; no edits.",
      "Explicit answer or investigation requests (\"just explain\", \"investigate only\", or \"report findings without edits\"): read the code and report; no edits. An implementation-intended \"look into\" or \"why is this broken\" request includes the smallest complete fix.",
    )
    .replaceAll(
      "Information asks (explain, look into, investigate): read the code, report the answer or findings - no edits, no fixes yet.",
      "Explicit answer or investigation-only requests get reading and a report without edits. An implementation-intended diagnosis includes the smallest complete fix.",
    )
    .replaceAll(
      "Information ask (explain, look into, investigate): read code, report answer/findings; no edits, no fixes yet.",
      "Explicit answer or investigation-only requests get reading and a report without edits. An implementation-intended diagnosis includes the smallest complete fix.",
    )
    .replaceAll(
      "Judgment asks (what do you think, review) and open-ended asks (refactor, improve, clean up) get an assessment and a proposal, then the user's confirmation.",
      "Judgment-only asks (what do you think, review) get an assessment without edits. Requests to refactor, improve, or clean up authorize the smallest complete in-scope change; assess and execute without another confirmation unless material ambiguity or an applicable authorization rule blocks it.",
    )
    .replaceAll(
      "Judgment asks (what do you think, review) and open-ended changes (refactor, improve, clean up): assess and propose, then wait for confirmation.",
      "Judgment-only asks (what do you think, review): assess without edits. Requested refactoring, improvements, or cleanup: assess and make the smallest complete in-scope change; ask only for material ambiguity or required authorization.",
    )
    .replaceAll(
      "Judgment ask (what do you think, review) / open-ended change (refactor, improve, clean up): assess, propose, wait for confirmation.",
      "Judgment-only asks: assess without edits. Requested refactoring, improvements, or cleanup: assess and execute the smallest complete in-scope change; ask only for material ambiguity or required authorization.",
    )
    .replaceAll(
      "Judgment (review, what do you think) or open-ended change (refactor, clean up): assess, propose, wait for confirmation.",
      "Judgment-only requests: assess without edits. Requested refactoring or cleanup: assess and execute the smallest complete authorized change; ask only for material ambiguity or required authorization.",
    )
    .replaceAll(
      '"refactor" / "improve" / "clean up": assess first, propose an approach.',
      '"refactor" / "improve" / "clean up": assess, then execute the smallest complete authorized change; ask only for material ambiguity or required authorization.',
    )
    .replace(
      "one bash call per command, never chained with `;` or `&&`",
      "one bash call per independent command; use `&&` for genuine dependencies as the bash contract requires",
    );
  // Preserve diagnosed recovery without bypassing OMP permissions or retry bounds.
  prompt = prompt
    .replace(
      "Errors, timeouts, locked files, empty results, and failing tools are ordinary obstacles, not blockers: diagnose them, then work through them with the access you have (wait and retry a call that is safe to repeat, fix the request, use another tool or source) without asking first. A file marked not to be touched, withheld access, or a safety guardrail is a deliberate blocker: leave it alone and look for another safe way to finish.",
      "Errors, timeouts, locked files, empty results, and failing tools call for diagnosis and recovery with the access you have. Fix the request, use another permitted source or tool, or retry a diagnosed transient failure when safe. Ask when required authorization or a material user decision is missing. Use at most three materially different recovery approaches for the same blocker; if all fail, stop that blocked track, finish independent work, and report the evidence and missing prerequisite. Respect do-not-touch files, withheld access and safety boundaries; never reach a denied result through another route.",
    )
    .replace(
      "There is no attempt limit: keep going until the objective holds",
      "Use at most three materially different recovery approaches for the same blocker; if all fail, stop that blocked track, finish independent work, and report the evidence and missing prerequisite",
    )
    .replace(
      "never repeat the same failed call",
      "never repeat the same failed call or retry indefinitely",
    )
    .replace(
      'Retry a transient failure (timeout, rate limit, "try again") as is;',
      'Retry a transient failure (timeout, rate limit, "try again") at most twice, respecting any retry delay;',
    )
    .replace(
      "Restore broken files to the last good state before the next approach",
      "Undo only your own failed-attempt edits before the next approach; preserve all user and sibling changes",
    )
    .replace(
      "After three different approaches fail: stop editing, return in-flight edits to the last known-good state with your file tools (destructive git commands still require approval), document what failed and why, and ask the user one precise question.",
      "After three different approaches fail for the same blocker: stop that blocked track, undo only your own failed-attempt edits with file tools while preserving all user and sibling changes, and finish independent in-scope work. Report what failed and the missing prerequisite; ask one precise question only when the user can resolve it. Destructive git commands still require explicit approval.",
    )
    .replace(
      "after three different approaches fail, stop editing, return in-flight edits to the last known-good state, and ask the user one precise question that includes what you tried.",
      "after three different approaches fail for the same blocker, stop that blocked track, undo only your own failed-attempt edits while preserving all user and sibling changes, and finish independent in-scope work. Report what you tried and the missing prerequisite; ask one precise question only when the user can resolve it.",
    );
  // Host/project authorization remains binding even where the generated style rules suppress caution.
  prompt = prompt
    .replace(
      "Add no warnings, disclaimers, approval steps, or checklists for hypothetical risk.",
      "Add no warnings, disclaimers, approval steps, or compliance checklists for hypothetical risk, but this never overrides explicit host or project authorization and safety rules.",
    )
    .replace(
      "An exception written in a skill or project file is not by itself a request for approval: check the session's authorization and whether the rule applies first.",
      "Host and project authorization rules remain binding. An exception written in a skill or project file is not by itself a request for approval: check the applicable host/project authorization and whether the rule applies before asking.",
    );
  // Preserve the async preference without inventing capabilities or overriding tool lifecycles.
  const asyncDefault = options.toolNames.includes("eval") ? ASYNC_DEFAULT : ASYNC_DEFAULT
    .replace(", A LONG COMPUTATION DETACHES ITS EVAL CELL, AND A WAIT IS A `tool.monitor` SUBSCRIPTION - NEVER A CELL SITTING ON A `--watch` OR A SPAWNED PROCESS,", " AND A WAIT IS A `monitor` SUBSCRIPTION - NEVER A COMMAND SITTING ON A `--watch`,");
  prompt = prompt.replace(asyncDefault,
    "Use async by default for finite calls that expose it, and keep working on everything that does not need their pending results."
    + (hasBash ? " Bash async keeps the command deadline; choose a task-appropriate timeout. Named ready services use the service contract, with no async or timeout parameters." : "")
    + (hasTask ? " Use task's advertised asynchronous, synchronous, or BLOCKING agent contract; never spawn a child just to watch another operation." : ""));
  prompt = prompt.replace("A child task never qualifies; it runs in the background and its completion delivers the result.", "");
  const pendingResults = hasWait
    ? "When the next step needs a pending result from work you started, call native `wait` with no arguments."
    : "When only pending work remains, return the pending state to the parent or host for result delivery.";
  prompt = prompt.replace(TURN_END_IS_WAIT, `${pendingResults} With nothing pending and work still open, keep going. Do not poll, sleep, or repeatedly read status while waiting.`);
  const monitor = options.toolNames.includes("eval") ? MONITOR_CONDITIONS : MONITOR_CONDITIONS
    .replace("`tool.monitor({ description, command, filter })` FROM THE EVAL CELL THAT STARTS THE RUN", "A `monitor` CALL")
    .replace(" A cell that awaits the wait holds the js kernel until the cell limit kills it.", "");
  prompt = prompt.replace(monitor, hasBash
    ? "When an external condition needs a new watch and bash offers async, start an async bash watch with timeout: 0; a named ready service instead follows the service contract. Use available process controls for an existing run rather than launching a duplicate. Never hold a foreground eval cell on a watcher."
    : "");
  prompt = prompt.replace(
    " A subagent is for a track that runs beside yours and lands the task sooner - a wide investigation across many files, or an implementation unit beyond one coherent edit in files you are not touching; spawn such tracks together in the background, each brief naming its output, allowed edit paths, stop condition, and returned evidence.",
    hasTask ? " A subagent is for a track that runs beside yours and lands the task sooner - a wide investigation across many files, or an implementation unit beyond one coherent edit in files you are not touching; dispatch such tracks together using task's advertised async or blocking contract, each brief naming its output, allowed edit paths, stop condition, and returned evidence." : "",
  );
  if (options.toolNames.includes("bash") || options.toolNames.includes("eval")) {
    prompt += "\n\n## OMP shell execution";
    if (options.toolNames.includes("bash")) {
      prompt += "\n\nSequence bash calls that depend on shell state; overlapping calls do not provide state handoffs. When the host reports a call running in a copy of the busy session shell, it sees variables, functions, options and working directory from the last completed command boundary; changes in that copy do not persist in the original shell.";
    }
    if (options.toolNames.includes("eval")) {
      prompt += "\n\nUse `sh()` only when the live eval documentation exposes it, for short commands. It runs to completion without auto-backgrounding and uses persistent shell state separate from the bash tool; do not assume variables or functions transfer between them.";
      prompt += options.toolNames.includes("bash")
        ? " Use bash's advertised background or named-service contract for long jobs and watches."
        : " Keep long jobs and watches out of `sh()`.";
    }
  }
  // Apply generic wording only after matching the intact upstream async directives.
  prompt = prompt
    .replaceAll("session tools", "available process controls")
    .replaceAll("You need:", "For you:")
    .replaceAll("You need slots", "For you section")
    .replaceAll("You need slot", "For you section");
  // Grok 4.5 remains an orchestrator, but uses omp workers rather than recursive CLI invocations.
  prompt = prompt.replace(
    "You are NOT the implementer: route work, audit evidence, report outcomes.",
    hasTask
      ? "When the host permits delegation, route implementation to workers, audit evidence, and report outcomes. Otherwise, perform the authorized work directly."
      : "Perform the authorized work directly, audit evidence, and report outcomes.",
  ).replace("ambiguous scope is delegated.", "resolve material scope ambiguity through the question contract before implementation.");
  prompt = prompt.replace(/- \*\*Delegate implementation via `bash`\.\*\* Spawn workers:[^\n]+/g,
    hasTask
      ? "- **Delegate implementation via `task` when the host permits it.** Select the appropriate supported worker/model through the runtime contract; do not assume a model glob selects a prompting guide. Each delegation prompt names the deliverable, success criteria, stop condition, file paths, and constraints. Decompose into independent, delegatable chunks named by deliverable."
        + (hasTodo ? " For 2+ chunks, call `todo`: one `in_progress`, marked `completed` the moment its worker returns audited." : "")
        + " Consume blocking results inline; for pending workers, keep working independently. " + pendingResults
      : "");
  prompt = prompt.replace(/- \*\*Consult Oracle before deploying non-trivial work\.\*\*[^\n]+/g,
    hasTask
      ? "- **Review non-trivial work before deploying it.** When the host permits delegation, use a separate task review worker with the diff and success criteria; request findings ordered by severity. Otherwise review locally. Resolve blocking findings before deployment and note non-blocking findings in the final message."
      : "- **Review non-trivial work before deploying it.** Review the diff against the success criteria locally, resolve blocking findings before deployment, and note non-blocking findings in the final message.");
  // An apply_patch alias must not displace write's native creation/overwrite role.
  if (options.toolNames.includes("apply_patch") && options.toolNames.includes("write")) {
    prompt = prompt.replace("Use `apply_patch` for ALL file edits and creations. ", "");
  }
  if (options.toolNames.some(tool => tool === "find" || tool === "lsp" || tool.startsWith("lsp_"))) {
    prompt = prompt
      .replaceAll("Prefer them for locating symbols, files, and patterns", "Use them for literal text and known filename patterns, following each tool's contract")
      .replaceAll("Use it for symbols, files, and patterns", "Use it for literal text and known filename patterns, following each tool's contract");
  }
  // OMO refusal rule: generic "try another approach" guidance never applies to a denial.
  prompt += `\n\n## Refusals are final\n\nA permission or approval denial, or a refusal by the user, is not a blocker to work around: it is final for what that call was meant to do. Never reach that result with another tool, command, path or host. Continue independent work, then ${options.subagent ? "report the refused step to the parent as a blocker" : "report the refused step as final or blocked; ask only if a new material scope decision is required"}.`;
  return { name: preset.name, prompt };
}
