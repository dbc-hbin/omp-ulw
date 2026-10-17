---
name: mass-ulw
description: "Drives dependency-ordered native OMP task waves or documented workpool runs, with each phase's predictable stages defined up front and file handoffs between nodes. Activate explicitly for mass-ulw or a requested task DAG."
argument-hint: "<task>"
metadata:
  short-description: Dependency-graph orchestration of child agents
---

## OMP runtime contract

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Host instructions, current user instructions and exposed tool schemas take precedence over this guidance, including its workflow, reporting and verification rules. This workflow requires explicit activation; bare ULW never selects it. Legacy difficulty labels are plan metadata, not callable categories.

Reuse references already read in this session; load operation-specific guidance when that operation needs it.


# mass-ulw

Use this skill when the user asks for `mass-ulw`, a task DAG, staged fan-out, or any multi-agent job where real dependencies exist: task C needs A and B finished first. For fully independent workers, plain parallel `task` spawns are simpler. Reach for native workpool if documented, otherwise dependency waves when the ordering itself is the point. A run covers ONE phase's dependency-ordered lanes and NEVER a whole multi-phase job; define the next phase as a NEW run (or invalidate changed nodes and their dependents when only the definition changed) in the cell from what the settled run proved. Under `ulw-loop` or `ulw-execute`, that contract owns the goal, criteria, evidence, and checkpoints; this skill owns only how each phase's run is defined, driven, and recovered.

## Planning - MANDATORY first step

Before defining ANY graph, read `references/planning.md` (relative to this skill's own directory) IN FULL. Do not dispatch native workpool nodes or task waves before reading it. It carries the working doctrine this file deliberately omits: decomposition, native role/model routing, disjoint parallel write scopes, the node prompt contract, the verification wave, and the failure playbook. A graph defined without it is unplanned work.

## The shape

A phase is the unit checkpointed by the owning loop or plan: a goal criterion, worktree, or evidence gate. A stage (harvest, expand, verify, reduce) is a step within that phase, not a new phase. Before dispatch, define every predictable stage in the same graph, with producer/consumer handoff paths and real dependencies. Start a new run for a new phase or when findings change which nodes must exist, not merely because downstream inputs are not known yet. Split a phase into cluster runs only for bounded reduction or documented runtime capacity; count every stage and reducer when sizing them.

A run is a declarative definition: a stable ledger `key` (lead-managed identity and resume, not an automatic runtime idempotency service), a human `name`, and `nodes`. Each node has an `id`, a self-contained task assignment, solutionSpace describing the solution's uncertainty, and a selected available specialist role or the default worker, and optional `dependsOn` listing node ids that must finish first. `dependsOn` is ordering ONLY: no upstream output is substituted into a downstream prompt, so write every prompt to stand alone. Put exact file scope, acceptance and required skill paths in task; shared goals/interfaces belong in context. Node ids and dependsOn are lead-owned graph metadata, not task input fields.

Map the difficulty/specialty metadata in references/planning.md to an actually listed OMP role and record that mapping; omit agent for default task work. OMP selects models and fallbacks for ordinary workers. Record resolvedModel only from actual results; never pass a per-task model or category. The exposed `model` and `sourceSession` fields are reserved for an explicitly selected `seance` historical consultation, not graph execution nodes. Dispatch dependency-ready task waves.

## Goal before start

Every run is goal-bound. In a standalone run, register the goal as written (the binding durable goal record, or a `# Goal` block where no goal tool exists). Under `ulw-loop` or `ulw-execute`, the loop's registered goal already covers the run, so register no second goal. The objective names the deliverable the graph produces, and the success criteria carry RESULT VERIFICATION - node and run completion claims are false until proven against captured evidence, a lead-enforced evidence rule, not an injected DAG completion directive. The verification wave (references/planning.md) produces the evidence those criteria name; the run ends when the criteria pass, never when the last node reports completion.

Ask any material decision only the user can make (scope, spend, an irreversible choice) from the main session through native OMP ask before starting the dependent wave, after finishing independent work - never from an eval cell or a node prompt. OMP ask blocks without a wait flag. Request permissions directly when host instructions require that channel. A missing, dismissed or unavailable answer grants no authorization; hold the dependent wave while unrelated authorized work proceeds.

## Running a DAG - native OMP orchestration

Read xd://eval/agents first when available; use a workpool only as documented there. If absent, explicit task dependency waves are the supported implementation. Do not import any DAG SDK or invent workflow methods. Persist doc/mass-ulw/<run-id>/graph.json and ledger.jsonl through read/write/edit: graph {key,name,phase,status,nodes:[{id,task,solutionSpace,agent?,requestedTier?,resolvedModel?,dependsOn,status,attempt,handle?,artifact?,verdict?}]}. Lead owns writes.

Before dispatch reject duplicate ids, missing dependencies, cycles, overlapping parallel write scopes and missing verification nodes. A node is ready only when every dependency is independently verified complete. Batch ready independent nodes through task; keep returned actual handles, mark in_progress, keep doing independent work, then wait for the handles needed by the next decision, not unrelated siblings. Save bounded outputs and actual artifacts before marking complete. Each producer assignment names its exact absolute handoff file; each consumer names the same file to read and treats a missing handoff as FAIL. Dependencies order work but do not transport context or prove the file exists. Add edges only for consumed outputs or real write ordering; no all-to-all stage barriers. Advance verified branches while unrelated branches are still running.

A run covers one phase. Synthesize its verified results before defining the next phase. Independent runs may overlap only with disjoint scopes and actual available capacity; use the current host capacity rather than fixed concurrency limits. For mass research preserve the 60+ opening-angle harvest on genuinely broad topics, bounded per-node reports and staged reduction.

## Recovery and resume

On resume read graph and ledger first; reconnect only actual retained handles. Never duplicate a live node. Reuse unchanged completed outputs after checking their evidence freshness; never claim automatic host journal replay. Retry a failed/cancelled node with failure context after its attempt settles, retaining successful siblings. A blocked ancestor leaves descendants waiting while unrelated branches proceed. A definition change invalidates that node plus transitive dependents, not the entire graph. Editing a running assignment requires native agent:// messaging and a recorded revision; do not dispatch two writers. If context cannot be continued, spawn a fresh bounded attempt from the durable artifacts. Record cancellation reasons and use the documented host stop route, never cancel for elapsed time alone.

The final verification wave is mandatory: completed children are claims, not proof. The graph is complete only when its binding goal criteria are observed and verified. Native todos plus graph/ledger state are the inspection surface; do not invent graph widgets, RPC events or idempotent SDK keys.

## Supervising a run

Observation is supervision, not spectating. Running children err, over-engineer, obsess over one sub-problem, and drift out of scope MID-RUN, not only at the end. On every mid-run wake (a node completion notification, a monitor event), check each active node against ITS OWN prompt's SCOPE: the assigned work, only the assigned work, at the assigned depth. On any sign of drift - writes outside its scope, gold-plating past the deliverable, circling one sub-problem - steer it back through write to the actual agent:// id, naming the exact boundary it crossed; a node that stays off course gets a tightened prompt through a fresh bounded attempt or recorded definition change (above) once the attempt settles. Drift corrected in wave 1 costs one message; drift discovered at synthesis costs the run.

Inspection surfaces:

- Read the lead-owned graph.json and ledger.jsonl for node state, attempts, dependencies, failures and verification verdicts.
- Read actual agent:// ids once when a midpoint decision needs their context; wait collects the pending handles.
- Use only host-provided native workpool views documented by the current runtime. Do not assume a graph command, status widget or RPC channel.
