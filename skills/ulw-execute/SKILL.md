---
name: ulw-execute
description: "Executes a written doc/plans plan with Boulder ownership, checkbox progress, bounded attempts and a durable evidence ledger. Activate explicitly for ulw-execute or a request to run a plan."
argument-hint: "[plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]"
---

# ulw-execute

This explicitly selected workflow owns plan execution state, not a second execution policy. Current native OMP instructions govern how work is performed; see the [host authority boundary](../ulw-loop/references/omp-contract.md). Bare ULW does not select this workflow.

## Selection and options

```text
$ulw-execute [plan-name] [--worktree <absolute-path>] [--make-pr] [--ship]
```

- `plan-name`: full or partial file stem under `doc/plans/`.
- `--worktree`: reuse the specified existing task-owned absolute path for the first phase; record it in Boulder. Worktree creation and delivery follow current OMP authorization and repository rules.
- `--make-pr`: PR delivery, with a URL at handoff; merging remains a separate authorized action.
- `--ship`: implies `--make-pr`; requested delivery extends through CI/review resolution and merge, then task-owned worktree cleanup and `doc/` state synchronization. Current OMP authorization still governs each action.

Read `doc/boulder.json` and list `doc/plans/`. Select the supplied match; otherwise resume the single active or paused work owned by this session. With no active work, select the sole plan. Ask a focused selection question when multiple candidates remain.

If explicit execution has no selectable, decision-complete plan, use [ulw-plan](../ulw-plan/SKILL.md) to create `doc/plans/<slug>.md`, then continue here. A brief without waves, executable checkboxes and acceptance criteria is not a plan. This bootstrap authorizes planning toward the requested objective, not unrelated delivery actions.

## Durable ownership

Before implementation, create or update `doc/boulder.json`, preserving other works:

```json
{
  "schema_version": 2,
  "active_work_id": "<work-id>",
  "works": {
    "<work-id>": {
      "work_id": "<work-id>",
      "active_plan": "doc/plans/<plan-name>.md",
      "plan_name": "<plan-name>",
      "session_ids": ["omp:<actual-host-session-id>"],
      "status": "active",
      "worktree_path": null
    }
  }
}
```

Use the actual host session id with `omp:` prefix. Without an exposed id, leave `session_ids` empty and execute locally without claiming hook ownership. `worktree_path`, when used, is absolute.

The plan, Boulder and `doc/ulw-execute/ledger.jsonl` are authoritative. Record the binding objective once in the ledger: plan path, end state, phase/task counts, delivery mode, acceptance criteria, constraints and WHEN TO STOP. Each plan wave has a phase entry derived from prior verified results, not a competing aggregate goal. Do not open a duplicate native goal or loop ledger. Native todos may mirror plan progress under current OMP rules.

## Checkbox transitions

Read the selected plan and ledger on entry or resume. Count only column-zero task rows in `## Todos` and `## Final verification wave`; ignore nested acceptance/evidence checkboxes and fenced examples.

- `- [ ]`: pending; eligible only when dependencies are verified.
- `- [x]`: acceptance criteria verified against recorded evidence.
- `- [~]`: terminal non-success for this run; never a satisfied dependency.

Continue ready independent rows when another row blocks. Mark direct and transitive blocked dependents `[~]` with `blocked by <id>`. Final Verification Wave rows instead check delivered work and report known gaps: a known `[~]` gap alone does not fail them or reopen the blocked row.

In-scope discoveries become follow-up checkboxes after the open checkpoint; include them in that checkpoint only when its acceptance depends on them. Out-of-scope defects remain findings. Do not use discoveries or final-wave feedback to re-queue `[~]` rows, except the single harness-repair follow-up below.

Append one JSON object per evidence/transition event to `doc/ulw-execute/ledger.jsonl`, with at least `event`, `plan`, `task`, `session_id`, `commands`, `artifact`, `adversarial_classes`, `cleanup`; checkbox entries also carry `attempt` and `checkpoint_opened_at`. Evidence identifies actual results and paths; adversarial entries record observed outcomes or reasons for non-applicability. Keep one state writer.

## Completion receipts and bounded attempts

Retain these receipt names and fields when recording delegated completion. They are workflow records, not tool parameters or a replacement for a specialist's native response format. Normalize only supported evidence under current OMP verification rules.

```json
{
  "DoneClaim": {
    "task": "<task id/title>",
    "changed_files": ["path"],
    "tests": ["exact command + result"],
    "manual_qa": ["artifact path"],
    "cleanup": ["receipt"],
    "risks": ["known risk or none"]
  },
  "AdversarialVerify": {
    "verdict": "confirmed | false-positive | needs-fix | needs-human-review",
    "failure_class": "none | product | harness",
    "evidence": ["observed source or explicit not inspected"],
    "repro": "exact command or steps when available",
    "confidence": 0.0
  }
}
```

`FullyDone` means a claim has confirmed verification and its acceptance evidence is present; only `confirmed` permits `[x]`. Missing or inconclusive evidence is not a pass. Applicable adversarial evidence includes risks such as `stale_state`, `dirty_worktree` and `misleading_success_output` when triggered by the task.

For non-confirmed attempts, record the failing check and first error line, stripping volatile paths, timestamps, process/run ids and durations. Count attempts per checkbox across splits and resumes, from its first dispatch (`checkpoint_opened_at`). Bound the checkpoint at a consecutively repeated failure signature, the third failed attempt, or four hours open. A plan may adjust the numbers but cannot remove the bound; check elapsed time on resume and completion events.

At a bound, settle the attempt and mark `[~]` with the unmet gap and last evidence. Append an `unmet` entry describing what each attempt changed; propagate blocked dependencies and continue independent work. Below the bound retain `[ ]` with exact failure context.

A `harness` failure occurs before product behavior is exercised. Permit one repair attempt inside the checkpoint, excluded from failed-attempt count but not elapsed time. If it recurs, block the row and append one harness-repair follow-up checkbox. A blocked follow-up is reported, never appended again. Keep unverified changes out of delivery; inseparable shared changes remain a reported delivery blocker.

## Checkpoints, resume and close

After acceptance passes, change `[ ]` to `[x]` and append `task-completed`. A phase advances once its rows are verified or terminally blocked; record its evidence and gaps. Any delivery/worktree transition follows live OMP rules, with Boulder retaining the actual path.

For a dependency graph needing persistent node handoffs or recovery, use [mass-ulw](../mass-ulw/SKILL.md) for that phase only. Its graph references this plan's objective; it does not create another goal or completion ledger.

On resume, reconcile Boulder, plan, evidence, attempts, elapsed bounds and actual retained work before proceeding. The installed hook may continue only active session-owned work: pending tasks, including final verification, or final reporting for all-checked work. Notifications never complete state. Blocked-only plans are not automatically reopened, even if Boulder still says active; finalize in the closing turn. Paused work resumes on current user direction.

When no pending top-level row remains, finish the plan's final verification and requested authorized delivery. Mark Boulder `complete` only if every row is verified; otherwise mark `blocked` and retain the unmet evidence. The closing `ORCHESTRATION COMPLETE` block carries the plan path, verification commands, artifacts and cleanup receipts. For every `[~]`, name its gap and last evidence and state that the objective remains unmet. Ending orchestration is not success.
