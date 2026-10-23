export interface HostPrompt {
  blocks: string[];
  originalBehavior: string;
}

/** Adapt known upstream routing rules, not task permissions or model assignments. */
export function adaptResearchRouting(text: string): string {
  // OMO separates specialist roles from execution/reasoning categories. Port
  // those decisions to OMP's actual roles, not its unavailable category names.
  const routing = "Choose the deliverable and required permissions first, then the unresolved reasoning; role and reasoning depth are separate decisions. Keep focused lookups and tightly coupled work with the parent. Delegate when an independent track saves more work than briefing, coordination and verification cost. Use only advertised agents and their actual tool/role contracts; a role name is not a guarantee of a particular model."
    + "\n- `scout`: discovery whose output is a map of relevant code or sources, observed behavior and cited evidence. Use it for unfamiliar modules, several search angles, or external reference collection its tools support. For external research, specify the library/version, prefer official sources, and require source links; do not turn source collection into an architecture verdict. A known-file lookup stays direct; a prescribed batch extraction with no search judgment belongs to sonic. Read-only is a permission boundary, not a reason to route causal analysis or competing hypotheses to scout."
    + "\n- `sonic`: prefer it over the default worker when the work is strictly mechanical or fixed data collection: targets or their selection rule, the transformation/procedure, and acceptance checks are settled. Give numbered must-do steps, authoritative inputs, allowed write scope, forbidden deviations and concrete success criteria. Many files do not make a uniform transformation reasoning-heavy; a one-line fix is not mechanical if choosing it requires understanding a race or changing a contract. Return ambiguous matches and cases outside the rule with evidence rather than guessing. Do not assign autonomous diagnosis/design to sonic or assume it can spawn helpers. It is an editing-capable worker, not a read-only sandbox."
    + "\n- Default worker (omit `agent`): one coherent implementation or investigation whose decisions can be settled from code, tests and history. Let it trace the mechanism and callers, choose the smallest complete fix and return the required verification evidence. Prefer one owner for investigation plus dependent edits; split off a sonic batch only after its transformation and boundaries are decided. Use a default worker with explicit no-edit scope for advisory reasoning or plan analysis when no advertised specialist covers that deliverable."
    + "\n- `reviewer`: independent code-change review for actionable, evidence-backed bugs introduced by the diff. Supply the diff, affected contracts and QA evidence. It is not a general design consultant, plan-feasibility checker, implementation worker or runtime QA executor. Preserve its native findings/verdict; do not bypass it merely to obtain a different JSON format."
    + "\n- `security-reviewer`: repository vulnerability analysis tracing attacker-controlled input through controls to a dangerous sink. Supply scope and trust boundaries; require evidence and coverage gaps. Do not use it for generic skepticism or ask it to edit, execute attack payloads or make network calls."
    + "\n- `seance`: consultation of a specific historical session and its nested transcripts, with `sourceSession`; not live repository research or a generic reasoning upgrade. Respect its read-only tools and saved-model selection contract."
    + "\n\nDistinguish breadth from hard decisions. Ordinary implementation stays with the default worker even across many modules. Escalate when you can name a central unresolved trade-off, package/process contract, mechanism without an existing pattern, or correctness argument about invariants. If found mid-task, have the child stop before the affected edit and return what it inspected, the unresolved decision, alternatives and what would distinguish them. The parent resolves it or assigns the same brief plus findings to a suitable reasoning-capable worker under the available model/effort controls; never invent `deep-high`, `ultrabrain` or `oracle` agent selectors. Reasoning-only assignments need a goal, constraints, evidence, counterexamples, rejected alternatives and one actionable recommendation, not a prescribed conclusion. Missing user authorization still goes to the user."
    + "\n\nDescribe the actual remaining decisions in `solutionSpace`, not file count or a desired tier. Keep specialist findings and unresolved questions separate. For a child-returned blocker, validate the evidence and decide the next route; do not declare the parent task complete. Do not duplicate a delegated search while it runs, and do not implement a decision that is still awaiting the delegated consultation. Verify returned work against acceptance criteria without assuming the worker's completion claim proves success.";
  return text
    .replaceAll("Read-only research MUST use `scout` only when files unknown.", routing)
    .replaceAll("MUST be used for exploratory codebase research, rapid code analysis, and broad pattern searches.", "Use for bounded code-location searches and evidence collection; return unresolved causal or design questions to the parent.")
    .replaceAll("Map unknown code via `task`, not reading file after file yourself.", "Handle focused lookups directly. Delegate independent discovery only when it helps the work finish sooner. " + routing)
    .replaceAll("Delegation preferred. Once design settles, SHOULD fan substantial work to `task`; multi-file changes, refactors, features, tests, investigations strong candidates. Judge small single-file/interactive work.", "Delegate substantial independent tracks when parallel execution helps the task finish sooner; keep focused work and reasoning that depends on the parent's accumulated context with the parent.");
}

/** Replace only the known default template; custom prompts and agent blocks remain owned by their authors. */
export function replaceHostBehavior(blocks: string[], behavior: string): HostPrompt | undefined {
  const base = blocks[0];
  if (!base || /<om[op]-model-preset>/.test(base)) return undefined;
  const role = base.indexOf("\n§ Role\n");
  const runtime = base.indexOf("\n§ Runtime\n", role);
  const policy = base.indexOf("\n§ Tool Policy\n", runtime);
  const workflow = base.indexOf("\n§ Workflow\n", policy);
  if (role < 0 || runtime <= role || policy <= runtime || workflow <= policy) return undefined;
  // Preserve host/project context and capability contracts. Only the known
  // research-routing prose in Tool Policy is adapted outside the role body.
  const roleBodyStart = role + "\n§ Role\n".length;
  const originalBehavior = base.slice(roleBodyStart, runtime);
  const host = base.slice(0, roleBodyStart) + behavior + "\n" + base.slice(runtime, policy)
    + adaptResearchRouting(base.slice(policy, workflow)) + base.slice(workflow);
  return { blocks: [host, ...blocks.slice(1)], originalBehavior };
}
