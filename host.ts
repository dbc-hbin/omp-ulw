export interface HostPrompt {
  blocks: string[];
  originalBehavior: string;
}

/** Adapt known upstream routing rules, not task permissions or model assignments. */
export function adaptResearchRouting(text: string): string {
  // Role selection supplements native task inputs and advertised agent contracts.
  const routing = "Keep focused or tightly coupled work inline; delegate independent tracks when benefits exceed briefing, coordination and verification costs. Choose roles by deliverable and permissions, reasoning depth by unresolved decisions, not work volume. Never bypass advertised role, output, tool or model contracts."
    + "\n- `scout`: bounded read-only code/source discovery with cited evidence, not causal diagnosis or design conclusions. For external research, specify the library/version, prefer official sources, and require source links. Known-file lookups stay inline; fixed extraction belongs to sonic."
    + "\n- `sonic`: mechanical edits or fixed collection only after targets/selection rule, procedure and acceptance checks are settled. Return ambiguous or out-of-rule cases with evidence, not guesses. No autonomous diagnosis/design or assumed helper spawning."
    + "\n- Default worker: coherent investigation plus dependent edits; explicit no-edit scope for advisory reasoning or plan analysis when no specialist fits."
    + "\n- `reviewer`: independent, evidence-backed bugs introduced by a diff; preserve native findings/verdict. Not design consultation, implementation or runtime QA."
    + "\n- `security-reviewer`: repository vulnerabilities tracing attacker input through controls to a dangerous sink; require evidence and coverage gaps, not generic skepticism. No edits, attack execution or network calls."
    + "\n- `seance`: historical-session consultation with `sourceSession` only, not live research or a reasoning upgrade; preserve read-only and saved-model contracts."
    + "\n\n`solutionSpace` names actual open decisions, not breadth or a desired tier. Unresolved mechanisms, contracts, trade-offs or invariants need reasoning, not a different specialist label. Stop affected edits and return evidence, alternatives and distinguishing checks; the parent resolves or routes that brief to a reasoning-capable worker under approved model/effort controls. Reasoning-only assignments need a goal, constraints, evidence, counterexamples, rejected alternatives and one actionable recommendation, not a prescribed conclusion. Missing authorization goes to the user."
    + "\n\nChild findings are unverified: check evidence and acceptance criteria, separate findings from open questions, and reroute blockers rather than declaring completion. Do not duplicate delegated searches or implement decisions awaiting consultation.";
  return text
    .replaceAll("Read-only research MUST use `scout` only when files unknown.", routing)
    .replaceAll("Map unknown code via `task`, not reading file after file yourself.", routing)
    .replaceAll("Delegation preferred. Once design settles, SHOULD fan substantial work to `task`; multi-file changes, refactors, features, tests, investigations strong candidates. Judge small single-file/interactive work.", "Delegate substantial independent tracks when parallel execution helps the task finish sooner; keep focused work and reasoning that depends on the parent's accumulated context with the parent.");
}

/** Replace only the known default template; custom prompts and agent blocks remain owned by their authors. */
export function replaceHostBehavior(blocks: string[], behavior: string): HostPrompt | undefined {
  const base = blocks[0];
  if (!base || /<om[op]-model-preset>/.test(base)) return undefined;
  const heading = /\n([§⁂]) Role\n/.exec(base);
  if (!heading) return undefined;
  const role = heading.index;
  const marker = heading[1];
  const runtime = base.indexOf(`\n${marker} Runtime\n`, role);
  const policy = base.indexOf(`\n${marker} Tool Policy\n`, runtime);
  const workflow = base.indexOf(`\n${marker} Workflow\n`, policy);
  if (runtime <= role || policy <= runtime || workflow <= policy) return undefined;
  // Preserve native defaults here so unsupported-model fallback can restore them.
  // Model-specific behavioral projection happens after this replacement.
  const roleBodyStart = role + heading[0].length;
  const originalBehavior = base.slice(roleBodyStart, runtime);
  const host = base.slice(0, roleBodyStart) + behavior + "\n" + base.slice(runtime, policy)
    + adaptResearchRouting(base.slice(policy, workflow))
    + base.slice(workflow);
  return { blocks: [host, ...blocks.slice(1)], originalBehavior };
}
