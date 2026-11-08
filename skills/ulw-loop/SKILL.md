---
name: ulw-loop
description: "Runs an explicitly requested durable multi-goal loop with dependency criteria, evidence-bound checkpoints and resume state."
argument-hint: "<goal>"
metadata:
  short-description: Durable multi-goal criteria and checkpoints
---

# ulw-loop

Activate only for an explicit ulw-loop or durable checkpointed execution request. Bare ULW does not select it. Current native OMP instructions govern execution; the [host authority boundary](references/omp-contract.md) applies. This skill owns the richer multi-goal state, not another general orchestration policy.

## State contract

Before execution, use [Define Goal](references/define-goal.md) to record the binding objective and per-goal criteria in the [durable ledger format](references/omp-ledger.md). Keep one aggregate objective; do not open a competing native goal. Native todos, when used, mirror actions rather than replacing the goal record.

An active native goal belonging to another run blocks this run: report the conflict
instead of replacing or silently adopting it. Keep this session and the lead-owned
ledger when delegating implementation, tests, fixes or QA execution through native
`task`; delegation does not transfer loop state ownership.

The run lives under `doc/ulw-loop/<session-id>/` with `brief.md`, `goals.json` and `ledger.jsonl`. The lead alone writes state. Preserve completed records; unrelated work gets a separate identified run.

Acquire the existing `in_progress` goal, otherwise a pending goal whose dependencies are complete. Record criterion results with actual artifacts, capture fingerprints and cleanup receipts. Non-final checkpoints require essential criteria; final completion requires every criterion plus `quality-gate.json`. The [checkpoint and steering reference](references/full-workflow.md) specifies transitions and final verifier inputs.

After compaction or resume, read brief, goals and ledger first, reconcile actual pending work and continue without replaying completed work. Paused work resumes only on current user direction; cancellation records cleanup and never auto-resumes. An installed continuation hook is not completion evidence.

Use [mass-ulw](../mass-ulw/SKILL.md) only if a phase needs a durable dependency graph, file handoffs or node recovery. Its graph references this run's goal; no second goal or criterion ledger is created. Research phases may consume an existing research journal, but do not duplicate it here.
