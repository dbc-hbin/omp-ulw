---
name: mass-ulw
description: Graph definition, handoff and evidence contract for mass-ulw; read before defining a run.
metadata:
  short-description: Phase graphs, file handoffs and recovery boundaries
---

# Graph and handoff contract

[The skill](../SKILL.md) owns run paths, node fields and recovery transitions. This reference defines what must be present in that state. Use current native OMP instructions for decomposition, role/model selection, capacity, dispatch and checks.

## Phase graph

Before starting, record the phase deliverable, all predictable stages, producer/consumer paths and evidence gates. A phase is the unit checkpointed by the owning plan or goal; harvest, expand, verify and reduce can be stages within it. Start another run when the phase changes or findings require a different graph, not merely because inputs arrive later.

Each node has a stable id, a self-contained assignment, `solutionSpace`, explicit read/write scope, acceptance evidence and `dependsOn`. Preserve optional routing metadata without treating it as an execution API. Concurrent write scopes must not overlap; an ordering edge or a single owner resolves shared-file work.

Audit ids, dependency existence and acyclicity. Every edge must represent an actual consumed output or write ordering. Where a later stage consumes a verified whole-wave digest, a review/reduction node can supply that digest rather than unnecessary all-to-all edges. Branch-specific consumers need only their actual upstream proofs.

## File transport

For every handoff record:

| Producer | Consumer |
| --- | --- |
| Exact absolute file path owned by this node | The same literal input path |
| Required report sections and size bound | The facts/sections it consumes |
| Evidence and source references | The check that rejects absent or invalid input |

`dependsOn` provides no data substitution. A downstream assignment must be usable without parent conversation or implied upstream context. Preserve the handoff file and its verdict before releasing its consumers. Missing files or unsupported claims block those consumers, not unrelated branches.

For large graphs, use bounded reports and staged reduction so downstream nodes consume verified digests rather than an unbounded set of raw outputs. Size clusters to observed runtime capacity and reducer input limits; record any split and its join point. There is no node-count quota or assumed capacity setting.

## Node records

Keep TASK, DELIVERABLE, SCOPE, VERIFY and STOP WHEN in the assignment when that is the host's brief format. For this graph, their load-bearing content is the node's output path/shape, exact owned files, dependency inputs and binary acceptance observable. The recorded artifact and verdict must establish the declared deliverable, not merely a successful worker return.

Define verification coverage in the graph before execution, including a final verification stage for code-changing graphs. Its evidence links back to the owning goal criteria. OMP owns test/QA procedures and independent review requirements; this reference adds no parallel testing policy.

## Research graph composition

When the actual requested work uses [ulw-research](../../ulw-research/SKILL.md), that skill owns the journal, claim graph, EXPAND leads, convergence and report delivery gates. Mass-ulw owns only the phase graph and handoffs; do not duplicate the research journal or add a second goal.

Enumerate the topic's meaningful source territories and competing explanations without an angle quota. A predictable per-angle collection chain is:

```text
harvest-<a> -> expand-<a> -> verify-<a>
```

Each node writes its own file under `<session-dir>/waves/<run-key>/`: `harvest-<a>.md`, `expand-<a>.md`, `verify-<a>.md`. Assignments carry resolved absolute paths. Harvest and expand return candidate claims plus EXPAND tails; verify returns counter-search verdicts, sources and remaining leads. The research owner alone reconciles these into the journal and claim graph.

Converge per bounded cluster. Deduplicate new leads against the owning journal and add `expand-<a>-<n>` -> `verify-<a>-<n>` pairs with distinct handoffs when findings require them. Apply the research workflow's convergence contract; the predefined expand stage is one expansion wave, not proof of convergence. Failed or missing handoffs hold only their consumers within the run's attempt bounds.

A converged cluster's reducer writes a bounded digest (normally at most 5k tokens) citing its verified handoffs. The final reducer consumes those digests after all clusters converge, with citations back to evidence. Findings that change the graph are recorded revisions; a new checkpointed research phase gets a new run.

## Recovery evidence

For failures retain the node id, attempt, diagnosis, last artifact/verdict and blocked descendants. For definition changes retain the changed definition, rationale and invalidated descendants. Apply the [run recovery bounds](../SKILL.md#recovery-and-resume); state files do not imply automatic retries, idempotent starts or host journal replay.
