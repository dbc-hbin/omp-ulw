/** Project the recognized host's behavioral defaults without changing its capability or permission contracts. */
export function projectHostGuidance(text: string, source: string, modelGuidance: boolean): string {
  const role = /\n([§⁂]) Role\n/.exec(source);
  if (!role || !text.startsWith(source.slice(0, role.index + role[0].length))) return text;
  if (!/^<(?:omp|omo)-model-preset>/.test(text.slice(role.index + role[0].length))) return text;
  const marker = role[1];
  const policyAt = source.indexOf(`\n${marker} Tool Policy\n`);
  const workflowAt = source.indexOf(`\n${marker} Workflow\n`, policyAt);
  const deliveryAt = source.indexOf(`\n${marker} Delivery\n`, workflowAt);
  if (policyAt < 0 || workflowAt <= policyAt) return text;
  let policy = source.slice(policyAt, workflowAt);
  let workflow = deliveryAt > workflowAt ? source.slice(workflowAt, deliveryAt) : undefined;
  if (modelGuidance) {
    policy = policy.replace(/(^|\n)# (?:General|Exploration|Delegation)\n[\s\S]*?(?=\n# |$)/g, "$1");
    const profile = /<(?:omp|omo)-model-preset>([\s\S]*?)<\/(?:omp|omo)-model-preset>/.exec(text)?.[1] ?? "";
    if (profile.includes("For text or filename search")) {
      policy = policy.replace(/^- File structure\/names:[^\n]*(?:\n|$)/m, "");
    }
    workflow = workflow?.replace(/(^|\n)# (?:1\. Scope|2\. Research Before Editing|3\. Decompose|5\. Verify|6\. Cleanup)\n[\s\S]*?(?=\n# \d\. |$)/g, "$1");
  }
  let result = text.replace(new RegExp(`\\n${marker} Tool Policy\\n[\\s\\S]*?(?=\\n${marker} Workflow\\n)`), () => policy);
  if (workflow !== undefined) {
    const workflowText = workflow;
    result = result.replace(new RegExp(`\\n${marker} Workflow\\n[\\s\\S]*?(?=\\n${marker} Delivery\\n)`), () => workflowText);
  }
  const criticalRegion = new RegExp(`\\n${marker} Critical\\n<critical>[\\s\\S]*?<\\/critical>`);
  const originalCritical = criticalRegion.exec(source)?.[0];
  if (originalCritical !== undefined) {
    const critical = modelGuidance
      ? originalCritical.replace("session limits, token/tool budgets, effort estimates", "session limits, effort estimates")
        .replace(/^- NEVER re-audit applied edit[^\n]*(?:\n|$)/m, "")
      : originalCritical;
    result = result.replace(criticalRegion, () => critical);
  }
  return result;
}

/** Native tool mechanics remain authoritative; duplicated batching and contradictory usage prose do not. */
export function adaptToolGuidance(name: string, text: string): string {
  if (name === "eval" && text.startsWith("One cell per call;")) {
    return text.replace("For 2+ independent items, use a named `workpool()`; results auto-deliver.", "`workpool()` results auto-deliver.");
  }
  if (name === "todo" && text.startsWith("`todo` NEVER takes a turn of its own:")) {
    return text.replace(" (parallel tool calls)", "");
  }
  if (name === "bash" && text.startsWith("Persistent shell:")) {
    return text.replace("No `head`/`tail`/redirection;", "No `head`/`tail`;");
  }
  return text;
}

/** Only native-owned mode records use this projection; user text is never scanned for notice-shaped prose. */
export function adaptOrchestrateNotice(text: string): string {
  return text
    .replace(" Re-read source documents; NEVER work from memory.", "")
    .replace("after last green phase, rerun full gates;", "after the last phase, use current verification evidence;");
}
