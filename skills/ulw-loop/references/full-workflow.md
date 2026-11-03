# Loop checkpoints and steering

The [ledger specification](omp-ledger.md) defines files, statuses, fingerprints and verifier commands; [Define Goal](define-goal.md) defines initial criteria. Current native OMP instructions own execution, task decomposition, delegation, tools, waiting, permissions, testing and QA procedures. This reference adds only loop state transitions and validator-compatible evidence.

## Criterion and goal transitions

Read the current goal's scenario, expected evidence and prior ledger results before changing it. Record `pass`, `fail` or `blocked` from observed artifacts with snapshot fields, adversarial outcomes and cleanup receipts. Never mark pass from memory or a completion notification. If a captured input changes, its affected proof must be recaptured; updating the fingerprint alone does not repair stale evidence.

A research-shaped goal uses cited-source artifacts as its real surface. Keep findings and open hypotheses in this run's ledger, extending previous evidence rather than repeating answered questions. A hypothesis note may use `HYPOTHESIS[id]: <claim> | status: open`, then `confirmed` or `refuted` only with observed sources. If a separate research workflow already owns the journal, reference it instead of making another. Optimization attempts record baseline, measured result, behavior/regression proof and keep/revert/iterate decision.

For each goal, retain `attempt` and `cycles`. Three identical same-criterion failures or five cycles without required criteria passing produce a failed checkpoint with diagnosis. An actual unmet dependency or missing capability produces a blocked checkpoint, not a pass. Current user cancellation settles task-owned work, records cleanup and marks cancelled without automatic resume. Paused work requires current user direction.

A non-final goal completes after every essential criterion passes on fresh evidence and dependencies are complete. Validate with `--goal <id>`, append the checkpoint, update the goal and acquire the next eligible one. Nonessential criteria can remain pending here, but not at final completion. Preserve completed state and the original aggregate objective.

## Final Quality Gate

The final checkpoint requires every criterion across all goals to pass and `quality-gate.json` to validate. The verifier consumes `manualQa`, `iteration` and `criteriaCoverage`, plus snapshot binding. Include `gateReview` when OMP or the user requires an independent review. These are evidence fields, not additional OMP orchestration instructions.

Freeze the evidence-bearing content. Populate the gate from actual main-session surface evidence and the verification results required by live OMP. Reuse fresh results where they already establish the fields; no extra full rerun or review is required merely to fill this file. A fix invalidates affected proof and any affected review approval. When review is required, a missing or inconclusive assessment blocks completion; never remove an unsuccessful review record to pass the validator. OMP owns review and recovery procedure.

Record verification results and any required review in the ledger, binding them to the frozen snapshot.

```json
{
  "manualQa": {
    "by": "main-session",
    "status": "passed",
    "evidence": "<observed QA result>",
    "surfaceEvidence": [{
      "id": "surface-1",
      "criterionRef": "G1:C1",
      "surface": "cli",
      "invocation": "<actual scenario invocation>",
      "verdict": "passed",
      "artifactRefs": ["artifact-1"]
    }],
    "adversarialOutcomes": [],
    "artifactRefs": [{
      "id": "artifact-1",
      "kind": "cli-transcript",
      "path": "doc/ulw-loop/<session-id>/evidence/scenario.log"
    }]
  },
  "gateReview": {
    "by": "<actual independent assessor identity>",
    "recommendation": "APPROVE",
    "reportPath": "doc/ulw-loop/<session-id>/evidence/gate-review.md",
    "evidence": "<assessment of goal and evidence>",
    "blockers": []
  },
  "iteration": {
    "fullRerun": false,
    "status": "passed",
    "rerunCommands": ["<actual final verification command>"],
    "evidence": "<observed verification result>"
  },
  "criteriaCoverage": {
    "totalCriteria": 1,
    "passCount": 1,
    "originalIntent": "<original request>",
    "desiredOutcome": "<binding deliverable>",
    "userOutcomeReview": "<how evidence establishes the user outcome>",
    "adversarialClassesCovered": ["none-applicable: <reason>"]
  },
  "tree": "<snapshot.tree>",
  "worktree_diff": "<snapshot.worktree_diff>",
  "capture_cwd": "<snapshot.capture_cwd>"
}
```

Required details:

- `manualQa.by` is exactly `main-session`, status `passed`, with nonempty evidence and `surfaceEvidence`. Every criterion needs a passing proof in `surfaceEvidence` or `adversarialOutcomes`. `criterionRef` is `<goal-id>:<criterion-id>`, or the bare criterion id when unique across goals.
- Each proof has `verdict: "passed"`, a nonempty `invocation` or `scenario`, and nonempty `artifactRefs` resolving to `{id,kind,path}` records. Adversarial outcomes may also describe `expectedBehavior`; non-applicability belongs in criterion `adversarial_classes`, not a fabricated passing outcome.
- Artifact files are nonempty. Surface/kind compatibility: `cli`/`tmux` -> `cli-transcript`/`log`; `http` -> `http-dump`; `browser`/`gui` -> `screenshot`/`image`; `data` -> `data-diff`. Review reports use `gateReview.reportPath`, not surface artifact records.
- `gateReview`, when present, needs actual `by`, nonempty `evidence`, a nonempty report file, `recommendation: "APPROVE"` and an empty `blockers` array. Omit this section only when no independent review is required.
- `iteration` needs `status: "passed"`, nonempty command strings in `rerunCommands` and evidence of those checks. The field name is retained for existing records; the checks may be the original OMP verification on the same inputs. `fullRerun` records whether a full rerun actually happened and does not gate completion.
- Coverage counts equal the total number of criteria checked, including nonessential criteria. Intent, desired outcome and user-outcome assessment are nonempty. Preserve actual adversarial coverage or the explicit reason that none applies.
- Preserve `capture_inputs` from explicit-file mode; the final verifier recomputes the gate fingerprint in the workspace where it is invoked. Criterion proofs can retain their own `capture_cwd`.

Run the [read-only validator](../scripts/verify-state.mjs) with `--final <quality-gate.json>`. After exit 0 and observed fulfillment of the binding outcome, append the final checkpoint and mark the aggregate complete. The validator neither updates statuses nor proves the outcome by itself.

## Dynamic Steering

Translate steering into a local evidence-backed transition, not a runtime API. Validate ids, dependency acyclicity, original scope, evidence and rationale; append the accepted/rejected proposal once, then apply accepted changes as the single writer. Process dependent proposals in order. Changes cannot retroactively convert failing evidence or rewrite passed criteria to manufacture success.

| Kind | State change and required fields |
| --- | --- |
| `add_subgoal` | In-scope finding or real blocker: `title`, `objective`, `evidence`, `rationale`, fully observable criteria. Outside-scope defects remain findings. |
| `split_subgoal` | `targetGoalId`, `childGoals` with `{title,objective}` and concrete criteria, `evidence`, `rationale`. |
| `reorder_pending` | `pendingOrder` ids, `evidence`, `rationale`; preserve real dependencies. |
| `revise_pending_wording` | `targetGoalId`, `revisedTitle?`, `revisedObjective?`, `evidence`, `rationale`. |
| `revise_criterion` | `goalId`, `criterionId`, at least one of `scenario`, `expected_evidence`, `userModel`, plus `evidence`, `rationale`. |
| ledger audit note | Evidence and rationale without changing the goal contract. |
| `mark_blocked_superseded` | `targetGoalId`, optional replacement `childGoals`, `evidence`, `rationale`; preserve old evidence. |

`goalId` is accepted wherever `targetGoalId` is used. Added goals start with real scenarios, never placeholders requiring an automatic revision pass. No directive parser, steer method or transaction service is implied.

Optional validation batches are explicit goal-group boundaries: the batch-final member waits for all members to resolve, every criterion to pass and a group-spanning quality gate. Splitting or superseding preserves membership.

The ledger records complete, failed, blocked and cancelled checkpoints with their evidence. Completion of the aggregate means all goals, every criterion and the final gate meet the binding outcome; a state label never replaces that observable result.
