export interface HostPrompt {
  blocks: string[];
  originalBehavior: string;
}

/** Adapt known upstream routing rules, not task permissions or model assignments. */
export function adaptResearchRouting(text: string): string {
  const routing = "Use `scout` for bounded location discovery and fact collection, not for all read-only work. Read-only limits actions, not reasoning depth. Keep causal analysis, competing hypotheses, contract trade-offs and invariant reasoning with the parent, or delegate an independent reasoning task to the default worker (omit `agent`) or an advertised reasoning specialist. State no-edit restrictions explicitly; a general worker is not a read-only sandbox. Describe the unresolved decision in `solutionSpace`; use model/effort controls only when the active schema and host policy allow them, and never assume an agent name guarantees a stronger model. If discovery exposes a reasoning problem, return evidence, competing explanations and the unresolved decision instead of guessing; the parent resolves it or routes that brief with the findings to a suitable worker.";
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
