---
name: review-work
description: "Post-implementation gate review: the root runs real-surface QA, then ONE fresh reviewer audits the goal, constraints, code, security, context and QA artifacts."
---

# Review work - Two-lane gate

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Activate for an explicit completed-work gate review, not automatically on bare ULW. A review-only request is read-only. An explicit “review and fix” request authorizes only minimal in-scope fixes for confirmed blockers, followed by fresh affected QA and review; it does not authorize unrelated refactoring, destructive actions, external writes, or commits. Exactly two lanes: root-owned hands-on QA and ONE fresh read-only reviewer. No panel, no sub-reviewers and no delegated manual QA. The result passes only when all applicable QA rows are verified PASS and the reviewer has a valid APPROVE receipt.

This conditional OMP-contract loading and same-session reuse policy applies throughout this workflow, including all referenced documents, and supersedes their unconditional OMP-contract read directives. Operation-specific reference requirements remain binding.

## Phase 0 - Gather context and bind the scope

Collect original GOAL, every CONSTRAINT, BACKGROUND and conversation decisions; CHANGED_FILES, exact DIFF and final input identity; relevant neighboring FILE_CONTENTS or paths a reviewer can read; actual RUN_COMMAND and prerequisites; and CONTEXT_MINING. Recover these from conversation and repository first; ask only a material missing question after independent work.

Inspect git status --short, branch/base and the user's named scope. For uncommitted work review staged and unstaged diffs plus explicitly relevant untracked files. For a branch/PR discover the correct target branch/merge-base or user-specified commits; then collect that comparison. Do not assume main or HEAD~1, omit untracked changes, or change the working tree to manufacture a clean diff. Bind captures to HEAD plus working-content diff/digest and untracked inputs. A passing result belongs to this content, not just its commit id.

Use find/glob/read to locate actual run/test commands from manifests/build configuration. LSP answers references/callers; grep finds TODO/FIXME/HACK and literal docs/config. Mine scoped git log and relevant reverts; use read-only github search_issues/search_prs when configured for related history. Record source -> finding -> why it matters. External messaging is never part of context mining. Do not browse unrelated code or expand the goal from tracker suggestions.

A separate worktree is OPTIONAL when isolation is necessary and safe, not required for dirty local work. Prefer the current tree without branch switching. If using an owned review worktree, preserve uncommitted inputs explicitly, record ownership and leave user work intact. Never force removal, reset, checkout user files or remove the worktree while a child is using it. Worktree creation/cleanup does not authorize commits or destructive commands.

## Phase 1 - Root manual QA

Reuse already-captured real-surface proof only when it covers the FINAL content. A content change invalidates the affected rows; do not relabel older evidence. The root runs the actual user scenario, not an imagined success from tests.

| Surface | Proof |
|---|---|
| HTTP | Live endpoint request/status/headers/body and persisted state readback |
| CLI | Actual command, arguments, stdout/stderr/exit code and side-effect state; native async bash, PTY for interaction |
| TUI | Actual rendered terminal and visual capture for color/layout/CJK claims; plain capture-pane is insufficient |
| Web | Use exposed browser tools or skill://cua-driver; actual browser actions, semantic postconditions and screenshots |
| Desktop | Installed cua-driver skill and actual running app, fresh AX/state, action log and screenshot |
| Library/SDK | Import and exercise the real public API; result transcript/state |
| Data/migration/config/generated artifact | Read/diff resulting actual artifact and validate through its real consumer |

Cover happy path, changed path, relevant boundary/error/adversarial cases and cleanup/teardown. Web visual changes need desktop/mobile captures; paginated output needs every rendered page. Never clone a signed-in profile or wipe user browser state. If a renderer, auth, hardware or remote operation is unavailable, the row is UNPROVEN with the exact blocker; a curl response is not UI proof.

Create a root-owned QA matrix with criterion, scenario/action, expected, raw observed, PASS/FAIL/UNPROVEN/N/A, artifact path, invocation, content identity and cleanup receipt. Artifact paths must exist and be nonempty; include screenshots plus semantic assertions, not success prose. N/A requires a goal-specific reason; required blocked rows cannot become N/A. Store requested evidence privately when it contains auth/customer data.

Follow repository and host test policy. Capture required reproduction first, then run relevant final lint/type/build/tests once when ready; broaden or repeat for a new change/failure only. Prose-only edits receive review without phrase/word-count tests; machine-consumed values may be validated through the real parser. Start long commands and event/log condition watches through native async bash; results auto-deliver, and call native wait() with no arguments only when blocked on a pending job you started. Subscribe to the exact event before triggering; no repeated polling or fixed sleeps.

## Phase 2 - ONE fresh reviewer

After QA capture, launch one native background task with `agent: "reviewer"` inside its `tasks[]` entry; do independent root teardown/report work while it reads. Use `security-reviewer` instead only for an explicitly security-only review. Do not omit the specialist merely to obtain custom JSON. The reviewer uses its native response format and cannot implement fixes, modify inputs, spawn agents, or substitute for the root QA. It receives self-contained context, exact scope/diff, goal/constraints/background, current input identity, history findings, code/neighbor paths, QA matrix and existing artifact paths. If the required specialist is not advertised, report the capability gap rather than silently treating a general worker as an equivalent review. Use this example only after discovering the actual paths and native task schema:

The receipt schema below belongs to the parent. Preserve the reviewer's raw terminal response and derive the receipt from its actual findings, assessment and coverage plus the parent's bound input identity and QA records. A native no-findings result is not automatically APPROVE: the parent must establish that the requested scope and applicable QA were covered. Do not invent a reviewer confidence, finding, checked criterion or approval that the response does not support. Missing substantive coverage leaves the gate INCONCLUSIVE; JSON formatting alone is not a failed review.

```js
const reviewReceiptSchema = {
      type:"object",
      properties:{
        verdict:{type:"string",enum:["APPROVE","REJECT","INCONCLUSIVE"]},
        confidence:{type:["string","null"],enum:["HIGH","MEDIUM","LOW",null]},
        summary:{type:"string"},
        contentIdentity:{type:"string"},
        goalBreakdown:{type:"array",items:{type:"object",properties:{criterion:{type:"string"},status:{type:"string",enum:["ACHIEVED","MISSED","PARTIAL"]},evidence:{type:"string"}},required:["criterion","status","evidence"],additionalProperties:false}},
        constraintCompliance:{type:"array",items:{type:"object",properties:{constraint:{type:"string"},status:{type:"string",enum:["ACHIEVED","MISSED","UNPROVEN"]},evidence:{type:"string"}},required:["constraint","status","evidence"],additionalProperties:false}},
        qaAudit:{type:"array",items:{type:"object",properties:{row:{type:"string"},status:{type:"string",enum:["VERIFIED","UNPROVEN","FAILED","NOT_APPLICABLE"]},evidence:{type:"string"}},required:["row","status","evidence"],additionalProperties:false}},
        blockers:{type:"array",items:{type:"object",properties:{criterion:{type:"string"},observation:{type:"string"},pointer:{type:"string"},fix:{type:"string"}},required:["criterion","observation","pointer","fix"],additionalProperties:false}},
        notes:{type:"array",items:{type:"string"}}
      },
      required:["verdict","confidence","summary","contentIdentity","goalBreakdown","constraintCompliance","qaAudit","blockers","notes"],
      additionalProperties:false
    };
await tool.task({
  context: "Review the final change and root QA recorded at local://submit-review-inputs.md. That artifact contains the original goal, all constraints, exact current diff/content identity, source paths, history findings and QA matrix with evidence paths. No writes or nested delegation.",
  tasks: [{
    name: "SubmitGate",
    agent: "reviewer",
    task: "TASK: Gate-review the completed submit change against the supplied goal/constraints and audit every QA artifact. Read skill://review-work and local://submit-review-inputs.md. DELIVERABLE: use your native review format for findings, assessment, evidence coverage and unverified criteria; the parent creates the workflow receipt. SCOPE: read-only paths and final diff recorded in the input artifact, no fixes or new product requirements. VERIFY: apply all eight checklist items in that skill; inspect every QA artifact, missing proof is unproven. STOP WHEN: the assigned scope and evidence are assessed and concrete blockers or remaining uncertainty are reported. Do not spawn agents.",
    solutionSpace: "Approval is uncertain; skeptically falsify the submitted claims using current code and artifacts, without judging hypothetical future designs."

  }]
});
```

Replace the example input artifact with the actual root-owned artifact, never a nonexistent prompt path. Pass context + tasks, with the specialist selector inside the task entry, never at the top level. Record requested role and actual resolved identity; do not invent category or model pins. The parent validates its normalized receipt against reviewReceiptSchema; confidence is null if the reviewer supplied none. Keep the raw response alongside the receipt and distinguish parent normalization from the reviewer's words. A valid schema alone does not approve a stale tree or nonexistent artifacts.

### Reviewer checklist (complete, not a subset)

1. Goal completeness: every explicit and directly implied requirement ACHIEVED/MISSED/PARTIAL with code/artifact evidence; no invented future requirement.
2. Constraint compliance: every constraint verified, specific violation blocks.
3. Behavioral correctness: trace the relevant changed scenarios and edge cases supported by concrete risks in the diff and its callers/contracts. Cover applicable empty, boundary, malformed, concurrent and failure paths; inspect races, leaks, off-by-one/null/error/rejection paths where they can occur. Tie coverage to the changed behavior and acceptance criteria, not a fixed scenario count; justify N/A rather than manufacture cases for prose.
4. Code quality: neighboring patterns, names, error handling, type safety without suppressions, hot-path cost, abstraction level, meaningful tests, public API/change hygiene.
5. Security: trust-boundary validation, SQL/XSS/command/path traversal/SSRF, auth, secrets/log exposure, dependencies/lock consistency, unsafe file/network handling relevant to the diff.
6. Missed context: history, issues, PR decisions, importing callers, docs/config and surrounding contract.
7. QA evidence audit: every artifact exists, proves its row and matches final inputs; identify uncovered criteria. Implementer claims are unverified until artifacts support them.
8. Scope: unrequested abstractions/speculation are notes unless they violate a stated constraint or behavior. Do not reject because another approach seems optimal.

The parent normalizes APPROVE only with complete evidence, no blockers and all applicable QA rows verified, supported by the native reviewer assessment. REJECT cites a violated goal/constraint/QA row -> observed failure/missing required artifact -> file:line/artifact -> exact fix. An unresolved tool/output contract is INCONCLUSIVE, not inferred approval. Style preferences and hypothetical future scenarios are notes.

## Phase 3 - Collect receipts and cleanup

Record actual returned child id in a pending set. Native wait({}) wakes on first settled result/message/steering, not a wave barrier. Reconcile the actual id; remove only terminal children, keep running entries pending and continue independent root work. Confirm terminal status, retain the actual task/wait response or agent:// payload and normalize its substantive assessment into the parent-owned receipt. Wrapper text, acknowledgements, silence, timeout and still-running snapshots are not verdicts. Validate the normalized fields without requiring the specialist to emit the workflow's JSON; unsupported coverage remains unresolved. Never replace a live reviewer just because it is slow.

After terminal failure or missing substantive assessment, retain current QA and launch one fresh, smaller reviewer replacement with the exact failure; no concurrent review panel. One replacement is the retry bound for a review. Do not respawn merely because native output is not the workflow's JSON. A valid re-review after authorized fixes is a fresh reviewer with delta + updated current evidence, never re-tasking a stale reviewer. Report unresolved evidence or reviewer capability gaps as INCONCLUSIVE; do not claim review passed. Recover a blocked review only after explicit user direction supplies the missing capability or accepts the unresolved gate.

For review-only requests, root fixes require separate authorization; for an explicit review-and-fix request, apply only the minimal confirmed blocker fixes described above. Changed content stales dependent QA and approval. Run affected QA/checks and collect a fresh review after fixes. Stop only root-owned service/browser handles, preserve requested artifacts and cleanup receipts; optional owned worktree cleanup waits for terminal reviewer collection and must preserve user work. No force removal.

## Phase 4 - Verdict

- PASSED: every applicable QA row verified PASS, no required missing proof, valid fresh APPROVE, same content identity and empty pending set.
- FAILED: any QA FAIL or valid REJECT; failing rows first, then deduplicated blockers in fix order.
- INCONCLUSIVE: neither failed nor fully proven, including missing receipt/artifact, stale evidence or blocked required QA.

Report overall verdict; root QA outcome and reviewer assessment, confidence only when supplied, and the parent's normalized gate decision; content identity and evidence pointers; blockers with exact fixes; nonblocking findings grouped by quality/security/context; missing capabilities and cleanup status. A passing report stays short; never turn notes into unrequested work.

## Source

Ported from the upstream review-work workflow, checked 2026-10-08. Preserves the two lanes, context mining, eight-point audit, fresh leaf reviewer and evidence gate; replaces legacy dispatch tools, assumed HEAD~1 and mandatory worktree teardown with OMP ownership contracts.
