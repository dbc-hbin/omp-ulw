# Durable loop ledger

## Files and ownership

Use the actual host-supplied session id as `run_id` and `doc/ulw-loop/<session-id>/`. If none is exposed, choose one explicit unique run id, record it in the brief and reuse it. Do not infer an environment path or claim hook ownership for an invented session.

The lead alone writes `brief.md` (request, constraints, assumptions, run id), `goals.json` and append-only `ledger.jsonl`. Preserve other and completed runs. `quality-gate.json` belongs to the final checkpoint.

## goals.json

```text
{
  schema_version: 1, run_id, objective, status, when_to_stop,
  current_goal_id,
  goals: [{
    id, title, objective, status, depends_on, attempt, cycles,
    criteria: [{
      id, scenario, pass_condition, expected_evidence, essential, status,
      evidence, artifacts, tree, worktree_diff, capture_cwd, capture_inputs?,
      adversarial_classes, cleanup
    }]
  }]
}
```

- Root status: `active`, `paused`, `blocked`, `failed`, `complete`, `cancelled`.
- Goal status: `pending`, `in_progress`, `complete`, `failed`, `blocked`, `cancelled`.
- Criterion status: `pending`, `in_progress`, `pass`, `fail`, `blocked`, `cancelled`.
- Goal ids are unique; dependencies exist and are acyclic. Criterion ids are unique within each goal.
- Every criterion has an observable scenario, binary pass condition and expected evidence path. `artifacts` contains nonempty files, relative to the workspace root or absolute. `expected_evidence` must itself resolve to a nonempty file.
- `cleanup` is a nonempty array of actual task-owned teardown receipts, or an explicit no-resources receipt.
- `adversarial_classes` is a nonempty array of `{name,status:"pass"|"not_applicable",evidence?,reason?}`. Applicable classes need captured evidence; non-applicable entries need a reason. If no class applies, record that explicitly with a reasoned non-applicable entry.

## Snapshot binding

Use the read-only [verifier](../scripts/verify-state.mjs) for fingerprints and checkpoint validation. Resolve the installed filesystem directory first; shells do not resolve skill URLs.

```text
node <ulw-loop-directory>/scripts/verify-state.mjs snapshot [cwd]
node <ulw-loop-directory>/scripts/verify-state.mjs snapshot-files <inputs.json>
node <ulw-loop-directory>/scripts/verify-state.mjs <goals.json> --goal <id>
node <ulw-loop-directory>/scripts/verify-state.mjs <goals.json> --final <quality-gate.json>
```

Git snapshot mode returns `tree` (HEAD tree), `worktree_diff` (SHA-256 of working changes and untracked product inputs), and `capture_cwd`. The verifier excludes workflow bookkeeping paths from the diff fingerprint; ordinary product documentation remains included.

For non-git research/data proof, `inputs.json` is the complete nonempty array of relevant source-file paths. `snapshot-files` returns `tree: "explicit-files"`, a byte fingerprint, `capture_cwd` and `capture_inputs`. Inputs must be nonempty files, not symlinks. This mode is explicit input binding, not a way to omit changed product inputs. Evidence/report artifacts are checked separately.

Preserve returned fields on each criterion and the final gate; record `capture_cwd` for worktree evidence and `capture_inputs` for explicit-file mode. Changed captured content invalidates proof. Re-run the affected scenario and record fresh evidence rather than attaching old output to a new fingerprint. Identical content remains valid despite a changed commit identity.

## Events and checkpoints

Append a JSON object after findings, evidence results, failures, steering and checkpoints. Evidence events include `event`, `goal_id`, applicable `criterion_id`, `invocation`, `verdict`, `evidence`, `artifacts`, `capture_cwd`, `tree`, `worktree_diff`, `adversarial_classes`, `cleanup` and `rationale`; preserve `capture_inputs` when used.

Resume the existing `in_progress` goal or acquire a dependency-ready pending goal. Record attempts and cycles before replacement work. On compaction read brief, goals and ledger first and reconcile actual retained work. Recovery is explicit; no host journal replay is assumed.

A non-final checkpoint requires fresh passing essential criteria and complete dependencies. Final validation includes every criterion, even `essential: false`, and the [final gate](full-workflow.md#final-quality-gate). Exit 0 supports a checkpoint but does not establish the user outcome or mutate state: append the checkpoint and update statuses explicitly.

The [workflow reference](full-workflow.md) owns steering, validation batches, failure bounds and final gate fields; do not maintain another copy of those transitions here.
