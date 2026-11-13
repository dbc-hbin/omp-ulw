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
    workflow = workflow?.replace(/(^|\n)# (?:2\. Verify|3\. Cleanup)\n[\s\S]*?(?=\n# \d\. |$)/g, "$1");
    // Recognize coverage in the active profile, never a model-name allowlist.
    workflow = workflow?.replace(/(^|\n)# 1\. Before Editing\n[\s\S]*?(?=\n# \d\. |$)/, before => {
      const runtime = source.slice(source.indexOf(`\n${marker} Runtime\n`), policyAt);
      if (runtime.includes("Matching skill → MUST read skill://<name> first.")) {
        before = before.replace("\n- Read relevant skills first.\n", "\n")
          .replace("\n- Read relevant skills and rules first.\n", "\n- Read relevant rules first.\n");
      }
      if (/\b(?:build|built) on the code that already does the job(?: instead of (?:adding )?|, not )a parallel copy/.test(profile)
        && /(?:fit new behavior|fitted) into the structure that is there/.test(profile)) {
        before = before.replace("\n- Reuse existing patterns; NEVER add a second convention.\n", "\n");
      }
      if (/Todo discipline:[^\n]*(?:update the list when scope shifts|drive every transition the moment it happens)[^\n]*Trivial single-step asks need (?:no todo list|none)\./.test(profile)
        || (profile.includes("move each the instant its state changes") && profile.includes("A one-step ask or a question gets no list."))) {
        before = before.replace("\n- Update todos; skip trivial requests.\n", "\n");
      }
      return before;
    });
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
      ? originalCritical.replace("session limits, token budgets, or effort estimates", "session limits, effort estimates")
        .replace(/^- NEVER re-audit applied edit[^\n]*(?:\n|$)/m, "")
      : originalCritical;
    result = result.replace(criticalRegion, () => critical);
  }
  return result;
}

/** Native mechanics remain authoritative; only the active profile can own duplicate requirements. */
export function adaptToolGuidance(name: string, text: string, profile: string): string {
  if (name === "eval" && text.startsWith("One cell per call;")) {
    text = text.replace("For 2+ independent items, use a named `workpool()`; results auto-deliver.", "`workpool()` results auto-deliver.");
    if (text.startsWith("One cell per call; top-level state persists, including across compaction.")
      && profile.includes("Use `sh()` only when the live eval documentation exposes it, for short commands. It runs to completion without auto-backgrounding and uses persistent shell state separate from the bash tool; do not assume variables or functions transfer between them.")) {
      // Match each pinned native sh block, not similarly worded custom helpers or cell lifecycle prose.
      text = text.replace(/^(sh\(command, cwd\?, timeout\?\); JS: await sh\(…\) or await sh`cmd \$\{arg\}` — embedded bash engine), runs to completion \(never backgrounded\)(\n  returns stdout\+stderr; non-zero exit raises ShellError \(\.exit_code\/\.exitCode, \.output\)\n  JS interpolations are shell-quoted; starts in the session cwd unless cwd is given)$/m, "$1$2")
        .replace(/^(sh\(command, cwd\?, timeout\?\) — embedded bash engine), runs to completion \(never backgrounded\)(\n  returns stdout\+stderr; non-zero exit raises ShellError \(`\.exit_code`, `\.output`\); starts in the session cwd unless `cwd` is given)$/m, "$1$2")
        .replace(/^(await sh\(command, \{ cwd\?, timeout\? \}\)  await sh`cmd \$\{arg\}` — embedded bash engine), runs to completion \(never backgrounded\)(\n  resolves to stdout\+stderr; non-zero exit throws ShellError \(`\.exitCode`, `\.output`\)\n  interpolations are shell-quoted; starts in the session cwd unless `cwd` is given)$/m, "$1$2");
    }
    return text;
  }
  if (name === "todo" && text.startsWith("`todo` NEVER takes a turn of its own:")) {
    text = text.replace(" (parallel tool calls)", "");
    if (/Never make a todo-only turn: (?:send|emit) todo in the same response as the next real tool call\./.test(profile)) {
      text = text.replace(/^`todo` NEVER takes a turn of its own: emit it in the same response as your next real tool call, (`init` beside the first read or action, `done`\/`start` beside the next action or check\.) A response whose only call is `todo` wastes a full model round trip\.(?=\n|$)/, "$1");
    }
    return text;
  }
  return text;
}

/** Only native-owned mode records use this projection; user text is never scanned for notice-shaped prose. */
export function adaptOrchestrateNotice(text: string): string {
  return text
    .replace(" Re-read source documents; NEVER work from memory.", "")
    .replace("after last green phase, rerun full gates;", "after the last phase, use current verification evidence;");
}
