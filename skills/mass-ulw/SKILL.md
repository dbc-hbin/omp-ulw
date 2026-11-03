---
name: mass-ulw
description: "Persists a phase's dependency graph, file handoffs and recovery ledger. Activate explicitly for mass-ulw or a requested task DAG."
argument-hint: "<task>"
metadata:
  short-description: Dependency-graph state for child agents
---

# mass-ulw

Use for explicitly requested dependency-ordered work. Current native OMP instructions own execution, delegation, roles/models, tools, waiting and verification; see the [host authority boundary](../ulw-loop/references/omp-contract.md). This skill adds durable graph state, not a DAG SDK or orchestration API. Independent work without graph dependencies needs no mass-ulw state. Bare ULW does not activate it.

## Run identity and ownership

A run covers one checkpointed phase, including its predictable stages and reducers. New phases get new runs; changed definitions within a phase invalidate affected nodes and descendants. Before defining a graph, read the [graph and handoff contract](references/planning.md).

Persist these lead-owned files:

- `doc/mass-ulw/<run-id>/graph.json`: definition and current node state.
- `doc/mass-ulw/<run-id>/ledger.jsonl`: append-only transitions, evidence, failures and revisions.

Graph shape (optional fields marked `?`):

```text
{
  key, name, phase, status,
  nodes: [{
    id, task, solutionSpace, agent?, requestedTier?, resolvedModel?,
    dependsOn, status, attempt, handle?, artifact?, verdict?
  }]
}
```

`key` is a stable lead-managed resume identity, not runtime idempotence. `agent`, `requestedTier` and `resolvedModel` describe actual routing under live OMP; legacy difficulty labels are metadata, not callable categories. Record a resolved model only from an observed result. Node ids and `dependsOn` belong to this graph, not invented task fields.

A standalone run records its objective, observable success criteria and stop condition once in the binding durable goal record, or a `# Goal` block without such a record. When nested under ulw-loop or ulw-execute, reference the existing goal/phase and evidence paths instead: no duplicate goal or competing completion ledger. The graph/ledger track nodes, not a second aggregate objective.

## Dependencies and handoffs

Reject duplicate ids, missing dependencies, cycles, parallel write conflicts and missing evidence/verification coverage before dispatch. Every predictable stage belongs in the graph up front; unknown downstream data alone is not a reason to create another run.

`dependsOn` orders work only. Producer assignments name exact absolute output files; consumers name those same files and fail on missing handoffs. A completed dependency neither transports context nor proves its artifact exists. A node becomes ready only when all dependencies are verified complete. Edges represent consumed outputs or real write ordering; unrelated branches can advance independently.

Record actual handles and attempts when work starts. Store bounded returned reports and checked artifact paths before marking a node complete. A final verification stage gates graph completion against the binding criteria; child completion alone is not graph success. Current OMP decides how that work is performed.

## Recovery and resume

Read graph and ledger first. Reconcile actual retained handles; never duplicate a live node. Reuse unchanged complete outputs only while their evidence remains fresh.

- A failed/cancelled attempt must settle before replacement. Retain successful siblings; allow one replacement per logical node (two total attempts), with the failure context recorded.
- A blocked ancestor holds only its descendants; unrelated branches remain eligible.
- A definition revision invalidates that node and transitive dependents, not the whole graph. Record the revision and settle or steer existing work before replacing it; never create concurrent writers.
- Without resumable context, reconstruct the bounded replacement from durable handoffs and ledger evidence.
- On exhausted attempts or an unresolved capability/owner decision, record the exact gap and await explicit user-directed recovery. Record cancellation reasons and actual cleanup; do not infer permission from waiting.

Finish the phase by synthesizing verified results into its owning checkpoint. Define the next phase from that evidence. The inspection surface is the graph, ledger and actual host-provided state; no graph widget, journal replay or automatic recovery service is assumed.
