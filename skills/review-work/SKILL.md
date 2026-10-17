---
name: review-work
description: "Post-implementation gate review: the root runs real-surface QA, then ONE fresh reviewer audits the goal, constraints, code, security, context and QA artifacts."
---

# Review work - Two-lane gate

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Activate for an explicit completed-work gate review, not automatically on bare ULW. A review request is read-only unless fixes were authorized. Exactly two lanes: root-owned hands-on QA and ONE fresh read-only reviewer. No panel, no sub-reviewers and no delegated manual QA. The result passes only when all applicable QA rows are verified PASS and the reviewer has a valid APPROVE receipt.

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

After QA capture, launch one native background task; do independent root teardown/report work while it reads. Omit agent and prescribe read-only reviewer behavior: this workflow requires its own JSON receipt, not a specialist's fixed response format. It cannot implement fixes, modify inputs, spawn agents, or substitute for the root QA. It receives self-contained context, exact scope/diff, goal/constraints/background, current input identity, history findings, code/neighbor paths, QA matrix and existing artifact paths. Use this example only after discovering the actual paths and native task schema:

```js
const reviewReceiptSchema = {
      type:"object",
      properties:{
        verdict:{type:"string",enum:["APPROVE","REJECT","INCONCLUSIVE"]},
        confidence:{type:"string",enum:["HIGH","MEDIUM","LOW"]},
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
    task: "TASK: Gate-review the completed submit change against the supplied goal/constraints and audit every QA artifact. Read skill://review-work and local://submit-review-inputs.md. DELIVERABLE: the strict verdict receipt, criterion evidence and exact blockers/notes. SCOPE: read-only paths and final diff recorded in the input artifact, no fixes or new product requirements. VERIFY: apply all eight checklist items in that skill; inspect every QA artifact, missing proof is unproven. STOP WHEN: every goal/constraint/QA row is assessed and APPROVE/REJECT/INCONCLUSIVE with confidence is recorded." + "\nReturn JSON matching: " + JSON.stringify(reviewReceiptSchema),
    solutionSpace: "Approval is uncertain; skeptically falsify the submitted claims using current code and artifacts, without judging hypothetical future designs."

  }]
});
```

Replace the example input artifact with the actual root-owned artifact, never a nonexistent prompt path. Pass context + tasks; no category, model, or agent:task for the ordinary reviewer. Record requested role and actual resolved identity. Use `model` or `sourceSession` only when the exposed `seance` agent is explicitly requested for historical consultation, never to pin the reviewer's ordinary model. A valid schema alone does not approve a stale tree or nonexistent artifacts.

### Reviewer checklist (complete, not a subset)

1. Goal completeness: every explicit and directly implied requirement ACHIEVED/MISSED/PARTIAL with code/artifact evidence; no invented future requirement.
2. Constraint compliance: every constraint verified, specific violation blocks.
3. Behavioral correctness: trace at least three representative scenarios and five relevant edge cases (empty, boundary, malformed, concurrent, failure) when that surface exists; justify N/A rather than manufacture cases for prose. Inspect races, leaks, off-by-one/null/error/rejection paths.
4. Code quality: neighboring patterns, names, error handling, type safety without suppressions, hot-path cost, abstraction level, meaningful tests, public API/change hygiene.
5. Security: trust-boundary validation, SQL/XSS/command/path traversal/SSRF, auth, secrets/log exposure, dependencies/lock consistency, unsafe file/network handling relevant to the diff.
6. Missed context: history, issues, PR decisions, importing callers, docs/config and surrounding contract.
7. QA evidence audit: every artifact exists, proves its row and matches final inputs; identify uncovered criteria. Implementer claims are unverified until artifacts support them.
8. Scope: unrequested abstractions/speculation are notes unless they violate a stated constraint or behavior. Do not reject because another approach seems optimal.

APPROVE only with complete evidence, no blockers and all applicable QA rows verified. REJECT cites a violated goal/constraint/QA row -> observed failure/missing required artifact -> file:line/artifact -> exact fix. An unresolved tool/output contract is INCONCLUSIVE, not inferred approval. Style preferences and hypothetical future scenarios are notes.

## Phase 3 - Collect receipts and cleanup

Record actual returned child id in a pending set. Native wait({}) wakes on first settled result/message/steering, not a wave barrier. Reconcile the actual id; remove only terminal children, keep running entries pending and continue independent root work. Confirm terminal status and validate the requested receipt fields in the actual task/wait response or agent:// payload; wrapper text, acknowledgements, silence, timeout and still-running snapshots are not verdicts. Missing/invalid required receipt is a contract failure. Never replace a live reviewer just because it is slow.

After terminal failure/missing payload, retain current QA and launch one fresh, smaller replacement with the exact failure; no concurrent review panel. A valid re-review after authorized fixes is a fresh reviewer with delta + updated current evidence, never re-tasking a stale reviewer. Report unresolved failure as INCONCLUSIVE if the capability cannot supply a receipt; do not claim review passed.

Root fixes only if separately authorized; otherwise deliver findings. Changed content stales dependent QA and approval. Run affected QA/checks and collect a fresh review after fixes. Stop only root-owned service/browser handles, preserve requested artifacts and cleanup receipts; optional owned worktree cleanup waits for terminal reviewer collection and must preserve user work. No force removal.

## Phase 4 - Verdict

- PASSED: every applicable QA row verified PASS, no required missing proof, valid fresh APPROVE, same content identity and empty pending set.
- FAILED: any QA FAIL or valid REJECT; failing rows first, then deduplicated blockers in fix order.
- INCONCLUSIVE: neither failed nor fully proven, including missing receipt/artifact, stale evidence or blocked required QA.

Report overall verdict; both lanes' verdict/confidence with row/artifact counts; content identity and artifact pointers; blockers with exact fixes; nonblocking findings grouped by quality/security/context; missing capabilities and cleanup status. A passing report stays short; never turn notes into unrequested work.

## Source

Ported from installed omo 5.1.19 plugin/skills/review-work/SKILL.md and current dev packages/shared-skills/skills/review-work/SKILL.md in code-yeongyu/oh-my-openagent, checked 2026-10-08. Preserves the two lanes, context mining, eight-point audit, fresh leaf reviewer and evidence gate; replaces Codex/Senpi/OpenCode tools, assumed HEAD~1 and mandatory worktree teardown with OMP ownership contracts.
