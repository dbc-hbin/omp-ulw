---
name: ulw-loop
description: "A goal-like loop that decomposes work into systematic, evidence-bound ultrawork steps. Use when the user wants a goal loop or durable, checkpointed execution."
argument-hint: "<goal>"
metadata:
  short-description: Goal-like ultrawork loop for systematic decomposition
---

## OMP runtime contract

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Host instructions, current user instructions and exposed tool schemas take precedence over this guidance, including its workflow, reporting and verification rules. This workflow requires explicit activation; bare ULW never selects it. Legacy difficulty labels are plan metadata, not callable categories.

Reuse references already read in this session; load operation-specific guidance when that operation needs it.


# ulw-loop

Use this skill only when the user explicitly requests ulw-loop or durable checkpointed goal execution. Bare ULW does not activate it.

This skill is compact by design: the run contract below is the whole bootstrap. `references/full-workflow.md` and `references/define-goal.md` carry the full doctrine; open a section only when the phase you are in needs it.

## Run contract

1. Read references/define-goal.md and references/omp-ledger.md in full. Register the binding aggregate objective and observable per-goal criteria before execution.
2. Mirror every atomic action into native todos, with immediate transitions and cleanup actions registered when resources spawn.
3. Treat goals as phases, derive each dependency-ordered wave from the prior verified evidence; dispatch with native task/wait, or documented workpool. Read ../mass-ulw/SKILL.md for ordering and recovery.
4. Verify every criterion on its real surface, capture artifacts and cleanup, validate the checkpoint, then acquire the next ready goal. Tests alone do not prove completion.
5. Stop the instant WHEN TO STOP holds with fresh evidence and the final gate passed.

The loop ledger is the ULW notepad; create no competing binding goal. No SDK or native goal API is assumed.

## Non-Negotiables

- Write loop state through native read/write/edit under the actual session run directory; the lead is the single writer and workers return evidence.
- Register goals up front, shaped by `references/define-goal.md` (write binding goal and criteria before execution, then the binding durable goal record from the returned handoff), and mirror every atomic step into the live `todo` checklist: one ultra-granular step per action, exactly one in_progress, transitions marked the instant they happen.
- After compaction read brief, goals and ledger FIRST, reconcile actual handles and resume; never re-plan completed work.
- Completed state is preserved; unrelated work gets a separate binding run rather than overwriting completed evidence.
- Every success criterion needs observable evidence from a real surface: a channel (terminal/TUI via an available real terminal renderer, HTTP, browser, computer-use) or, for CLI- or data-shaped criteria, an auxiliary surface (CLI stdout, DB diff, parsed config dump).
- Bind evidence to the full snapshot from scripts/verify-state.mjs: HEAD tree plus working diff and relevant untracked inputs. Changed captured content invalidates its proofs, even without a commit; recapture rather than relabel. Record cleanup receipts before passing a criterion.
- Delegate independent implementation units through native task when that saves time; retain main-session verification and cohesive work. Use documented workpool or dependency waves when ordering requires them.
- Use repository git conventions (only commit when explicitly authorised) for git-tracked edits: inspect recent and touched-path commit history, then, only if the user explicitly authorised commits, commit each verified work unit atomically in the repository's observed language, scope, and message style with only that unit's files staged. Never carry verified units into a later omnibus commit.

## Team mode: decide it, do not default to it

Solo execution with parallel background `task` workers is the default: fan independent units out in one batched spawn, each routed to the available native role under references/omp-contract.md that fits it, with scopes cut so no two workers write the same files. A team (a cooperating native task roster) adds per-member briefing, shared-state, and relay overhead, so it must be paid for by the work's shape. Decide ONCE, when the plan's work units are known, and record the verdict plus its reason in the notepad.

Stand up a team when BOTH hold:

1. **The units' scopes overlap in a way you cannot cleanly cut.** They touch the same module, contract, or migration, so one unit's discovery changes what another should do. Fire-and-forget workers cannot exchange that mid-flight; teammates can, because the lead relays it.
2. **Running them at the same time actually finishes sooner.** The units are each substantial and none is merely waiting on another's output. Two units where the second only consumes the first's result are a sequence, not a team.

When the units are genuinely independent — separate files, no shared contract — spawn parallel background `task` workers instead and avoid the team coordination overhead entirely. When the work is one cohesive unit, do it yourself. Overlap alone is not enough: near-identical units that would collide on the same lines are faster done in sequence by one worker.

Under team mode, isolate and land per unit:

- **One git worktree per member**, never a shared checkout — concurrent members editing one working tree corrupt each other's diffs and evidence. Give each member its own branch off the base and its own worktree path.
- **Merge per work unit, as each unit is verified.** When landing is explicitly authorised, a member’s unit lands when its own evidence is captured and its gates are green; it does not wait for the slowest sibling. Integrate each merged unit back into the base the others branch from, so overlapping members rebase onto real merged work rather than guessing at it.
- **Conflicts are the lead's job.** When two members' units touch the same lines, the lead decides the order they land and tells the later member what changed; members never resolve a sibling's conflict blind.

## Native OMP Task Contract

Use the exact task/wait/agent:// contract in references/omp-contract.md. Every worker starts TASK and names DELIVERABLE, SCOPE, VERIFY, STOP WHEN. Preserve independent batching, right-sized roles and conflict isolation.

## Binding goal lifecycle

The durable aggregate objective drives the loop. Criterion evidence, not a claimed driver status, gates checkpoints. Preserve the original objective verbatim; an unrelated new request gets separate state rather than overwriting completed evidence. Resume paused work only on the current user's direction.

