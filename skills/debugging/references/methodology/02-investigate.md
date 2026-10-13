# Phase 2 + 3 — Hypothesis Formation & Parallel Investigation

One hypothesis is a hunch. Three hypotheses is a decision. Investigation is how you turn the decision into runtime evidence.

---

## Phase 2 — Hypothesis Formation (Minimum Three)

### Why three, not one

A single hypothesis creates confirmation bias: you'll read runtime state looking for evidence that confirms it and unconsciously discount contradictions. Three hypotheses force you to design queries that *distinguish* between them, which is the only way runtime evidence becomes decisive.

### Generate across orthogonal axes

If your three hypotheses are all variations of "the handler has a bug", you don't actually have three hypotheses. Span the space:

| Axis | Example framing |
|---|---|
| **User-code logic** | "The handler early-returns because condition X is unexpectedly true" |
| **Library/SDK behavior** | "The third-party client swallows the error and returns a stub" |
| **Environment/config** | "The env var is read at module-load time before it gets populated, so it's empty" |
| **Async/timing** | "The promise rejects (or goroutine panics) after the response is already sent" |
| **Silent side-effect** | "An earlier turn mutated shared state that the current turn inherits" |
| **Observability gap** | "The error is raised but suppressed before logging; it only exists as an unawaited rejection / ignored signal" |
| **Binary-level** (when applicable) | "The function we think is running is actually jumped over by a patched thunk / a different version loaded" |
| **Build-vs-runtime** | "The code we're reading is not the code that's running — stale build, wrong symlink, cached wheel, or dist/ ahead of src/" |

### For each hypothesis, write in the journal

1. **Claim** — one sentence.
2. **Distinguishing evidence** — the exact value or state that confirms or refutes it, AND where to read it (file:line, log source, breakpoint location, memory address).
3. **If true, the fix is** — two words. Forces you to think through fix cost before committing to the hunt.

### Collapse rule

If two hypotheses have identical distinguishing evidence, they aren't actually different — collapse them and find a real alternative. If you can't come up with a third distinct hypothesis, you don't understand the system well enough yet. Go read a little more code before investigating.

---

## Phase 3 — Parallel Investigation

### State freshness invariant

**A debug session's state is a snapshot with a lifetime, not a fact you can carry forward indefinitely.**
- Before any action that mutates the debuggee, re-observe the session's current state.
- This includes continue, step, side-effecting evaluation, setting or removing breakpoints, and termination.
- Record the current thread state and stop reason; those are the concrete tells for whether the old plan still applies.
- An observation from an earlier turn may already be stale when the next action is issued.
- Turns can be minutes apart while the debuggee runs at full speed, so this failure mode is normal, not exceptional.
- If the thread state or stop reason has moved, re-observe the new state and do not replay the old plan.
- Treat every mutation as conditional on the state you just observed, not on a remembered stop.

### Failure-to-recovery taxonomy

| Failure signature | Most likely cause | Next move |
|---|---|---|
| Adapter or debugger process failed to start | Wrong binary or missing installation | Verify the tool exists, then re-launch; do not retry blindly. |
| Breakpoint accepted but never bound or verified | Source path mismatch, optimized-out code, or missing debug symbols | Check the binary was built with symbols and that the debugger-resolved path matches your file. |
| Attach refused | Permissions, ptrace scope, SIP, or wrong PID | Fix the environment or target identity; a retry will not change it. |
| No stop event within the expected window | Process is running, the breakpoint is unreachable, or the wait was too short | Pause and inspect threads rather than waiting longer. |
| Session terminated unexpectedly | The debuggee crashed or exited | Capture the exit and crash evidence before restarting. |

## OMP investigation workers

Use the native task schema and [OMP contract](../../../ulw-loop/references/omp-contract.md). Keep one hypothesis per independent evidence assignment. The historical debug-squad roles remain useful responsibilities, not team APIs: Runtime State Inspector captures stack/variables/heap/registers without source edits; Log Archaeologist correlates timestamps and silent errors; Reproduction Engineer minimizes exact input/expected/observed output; Trace Correlator synthesizes captured evidence and proposes the next decisive query. The lead alone controls shared debuggee mutations and journal writes. Serialize attach/step/evaluate writers; read-only log/source tracks can run alongside them.

Use scout for read-only discovery; senior-task for difficult investigation when listed, otherwise omit agent. No categories or models. Each task receives full bug context, its hypothesis, exact allowed paths, source references, no-edit constraints, and bounded acceptance. The default worker may create a repro only in its explicitly owned paths.

Concrete invocation shape after inspecting the actual repo and task schema:

```js
const investigationReceiptSchema = {type:"object", properties:{hypothesis:{type:"string"},status:{type:"string",enum:["confirmed","refuted","inconclusive"]},observations:{type:"array",items:{type:"object",properties:{source:{type:"string"},value:{type:"string"},interpretation:{type:"string"}},required:["source","value","interpretation"],additionalProperties:false}},gaps:{type:"array",items:{type:"string"}}},required:["hypothesis","status","observations","gaps"],additionalProperties:false};
await tool.task({
  context: "A submit request returns 200 with empty content. Inspect the current server instance and the journal supplied at local://debug-submit.md. Do not alter user processes or shared state.",
  tasks: [{
    name: "LogEvidence",
    agent: "scout",
    task: "TASK: Read the exact server log path recorded in local://debug-submit.md. Test H2: an SDK failure is packaged as success. DELIVERABLE: timestamped raw stopReason/errorMessage/usage values and source pointers, plus unresolved observations. SCOPE: read-only log and route paths listed in that journal, no source or debuggee mutations. VERIFY: distinguish H2 from a handler early-return. STOP WHEN: evidence confirms/refutes H2 or the precise missing observation is named." + "\nReturn JSON matching: " + JSON.stringify(investigationReceiptSchema),
    solutionSpace: "The failure mechanism is unknown; select only observations that distinguish the SDK-error hypothesis."

  }]
});
```

Record returned actual ids in a pending set. Continue independent evidence gathering. Native wait({}) wakes on first settled result/message; reconcile ids and remove only terminal children. Validate the actual terminal response from task/wait or agent://; use structured.data only when the runtime returns it. A still-running snapshot is not completion. Wait again only when pending work blocks the next action; do not end the investigation with pending children. Message actual roster ids via write, not fictional team recipients.

## Evidence capture discipline (both paths)

For every piece of runtime state captured, record in the journal:

```markdown
### <ISO timestamp> — <what you looked at>
- Source: <file:line | log source | curl command | breakpoint address>
- Value: `<verbatim>`
- Interpretation: <one line — why this matters>
- Refutes/Confirms: H<n>
```

**Verbatim values only. No paraphrasing.**

- `messages.length=0` is evidence.
- "messages seemed empty" is not evidence — it's a memory of an observation, and memory of observations is where debug sessions go to die.

If you find yourself about to paraphrase, stop, go back, and copy the raw value.

---

## Round completion

A "round" is complete when every hypothesis has either confirming or refuting evidence — or when you have exhausted the evidence sources available without a decisive result. If the round ends inconclusively, that counts as a failed round for the counter in the journal. See `04-oracle-triple.md` for what to do at 2 consecutive failed rounds.