---
name: mass-ulw
description: Mandatory planning reference for the mass-ulw skill - read in full BEFORE defining any graph. Covers decomposition doctrine, category routing, the capacity model and write-scope rules, dag-or-team selection, the node prompt contract, the verification wave, and the failure playbook.
metadata:
  short-description: How to plan a dag - decomposition, categories, node prompts, verification
---

## OMP runtime contract

Read [the native OMP contract](../../ulw-loop/references/omp-contract.md) when current schemas and host instructions do not resolve a runtime question; reuse it if already read. Host instructions, current user instructions and exposed tool schemas take precedence over this guidance, including its workflow, reporting and verification rules. This workflow requires explicit activation; bare ULW never selects it. Legacy difficulty labels are plan metadata, not callable categories.


# mass-ulw planning reference

Read this file IN FULL before you define any graph. A graph defined without it is unplanned work: real runs without this doctrine collapse to three `deep` nodes with no verification. Every section below exists because its absence was observed failing.

Reading this file is not planning. Before `start`, write the run plan in one breath and then execute THAT plan: the topology (every predictable stage chained up front, each producer/consumer handoff path, and the evidence gates where findings can change the graph), wave sizes against the capacity model below, a one-line reason for every non-`quick` category, and the verification wave. When reality forces a change, replan out loud instead of drifting node by node.

## Decomposition doctrine

**TOPOLOGY LOCK first.** Before writing any node, enumerate the 1-6 top-level components that can each succeed or fail independently. Every node you define traces to exactly one component. Do not collapse a multi-component request into one blob node because it "looks small" - and do not invent components the request does not have.

**Split first, route second.** The default question is never "which category does this chunk need" but "how do I turn this chunk into more `quick` nodes". When work splits into independent pieces and those pieces can run in parallel SAFELY - disjoint write scopes, self-contained prompts, each piece verifiable on its own - many small `quick` nodes in parallel beat one big node on a smarter model, every time the split exists. Parallel quick lanes finish sooner, fail in isolation (one lane's failure never sinks the wave), and cost less per unit of work. Reach for a bigger model only for what SURVIVES splitting: the piece that cannot be decomposed without losing the whole-problem context it needs.

**Do not split when:** (1) the pieces would share a write scope you cannot untangle - serialize or merge instead of pretending independence; (2) the work is one coherent judgment that needs the whole problem in view (a design decision, a root-cause diagnosis) - splitting it produces confident partial answers, not a verdict; (3) the pieces get so small that spawn and coordination overhead costs more than the work itself - a node that takes longer to brief than to execute belongs folded into its neighbor.

**Wave sizing.** Size the wave to the work's natural grain: one node per genuinely independent chunk, whether that is five or sixty. Fewer than 3 means under-splitting. A wave of twelve `quick` nodes is healthier than a wave of three `deep` ones. Never merge independent chunks to make a wave look smaller - the slot limiter (capacity model below) serializes execution, and on `quick` map/research waves coverage beats cost: budget discipline lives in category routing, not node count. A wave wider than ~10 fans in through aggregator or verification nodes reading bounded per-node file reports - the lead never reads N raw outputs. Split along the axis that makes pieces independent:

- **By component** - each independently-shippable part is its own lane.
- **By file domain** - when one component spans disjoint file sets, one node per set.
- **By stage** - collect lanes (investigate, in parallel) -> verify lanes (falsify the collections) -> synthesize (turn verified facts into the deliverable).

**Default shape is fan-out, then fan-in.** N parallel lanes with no dependencies, then one synthesis node that depends on all of them. The synthesis node starts cheap too (`quick` or `unspecified-low`): merging verified pieces is mechanical unless the merge itself needs judgment. A 2-node graph with no dependency between the nodes is not a dag - use plain parallel `task` spawns instead. Reach for native workpool if documented, otherwise dependency waves when ordering itself is the point.

**Mass harvests: nodes are not units of work.** When a research or scan wave must cover thousands of sources or files (a 10,000-source harvest is legitimate when the work demands it), shard items INTO nodes instead of one node per item: each `quick` node owns a batch sized by its report contract - collect ~50-200 items and write ONE bounded file report (<= 5k tokens) to a ledger path - so `N_nodes = ceil(total_items / items_per_node)`. Do not infer a node or item cap from this coverage target: inspect the actual OMP capacity, queue or chain batches with the multi-run composition below and give every run its own aggregator node, so synthesis reads per-run digests, never raw node outputs.

**Split implementation from its test? No.** One node owns one deliverable end to end: the change AND its proof. A node that only writes code and a node that only tests it serialize on the same files and double the coordination cost.

## Category routing

`category` is a planning label, not an OMP task field or agent name. Map it through the role-selection contract in ../../ulw-loop/references/omp-contract.md: sonic only for prescribed mechanical work, scout for exploratory read-only discovery, default task with agent omitted for ordinary implementation, listed senior-task for difficult reasoning, and reviewer/security-reviewer for reviews. OMP owns model/fallback selection; record the actual resolved model after the result. **Start every node at `quick` and climb the ladder only as far as the work's difficulty demands. Specialty categories are never rungs - they are chosen only when the work itself is specialty.**

The difficulty ladder, bottom rung first:

1. **`quick`** - THE DEFAULT. Mechanical, single-file, or pattern-following work. Every node starts here in your head; you need a reason to leave it.
2. **`unspecified-low`** - the piece is small but not mechanical: a few files, or a judgment call a template cannot make.
3. **`unspecified-high`** - a standard multi-file feature or fix with real integration surface.

Escalate a node only with a one-line reason you could say out loud ("touches six files across three packages") - and only AFTER the split-first doctrine has been applied: a chunk that decomposes into safe parallel `quick` pieces was never a ladder candidate. If you cannot name the reason, the node stays at `quick`.

Specialty categories - chosen by the KIND of work, never by difficulty:

| Category | Route a node here when |
| --- | --- |
| `visual-engineering` | Frontend, UI, styling, animation. |
| `writing` | Docs, prose, technical writing. |
| `git` | Git operations only. |
| `deep-low` | Hairy debugging or cross-module reasoning a ladder rung could not hold, settled from what the worker reads. |
| `deep-high` | The same, when the central decision cannot be settled from evidence: a trade-off, a cross-package contract, a mechanism with no in-repo pattern, or correctness argued from invariants. |
| `ultrabrain` | At most ONE node per graph - the single genuinely hard reasoning problem everything else depends on. |

A graph whose every node is `deep-low` or `deep-high` is a routing failure: it pays the most expensive worker for mechanical lanes and starves the one lane that needed the horsepower.

## Concurrency and write-scope rules

- **`dependsOn` orders; files carry data.** The producer prompt names the exact absolute handoff path it writes; the consumer prompt names that same path to read and treats a missing file as FAIL. Paste resolved paths, never variables the worker cannot resolve. A completed dependency does not prove a handoff exists. Every prompt stands alone (see the node prompt contract).
- **Disjoint write scopes or serialize.** No two nodes that can run in parallel may edit the same file. If two lanes must touch the same files, chain them with `dependsOn` or merge them into one node. Declare each node's read/write scope inside its prompt.
- **Edges represent actual consumption or write ordering.** If B needs a fact A produces, add the edge and file handoff; if the lead already knows the fact, paste it into B's prompt with no edge. Do not make every expand node depend on every harvest node: a ready branch advances while unrelated branches are still harvesting.
- **Dependency matrix self-check before `start`:** every `dependsOn` id exists in the graph; no cycles; no node depends on something it does not actually consume; every wave has at least one runnable node.
- **Capacity model.** Use only the concurrency actually documented by the OMP runtime. Wide graphs queue or are dispatched in explicit bounded batches; never assume provider/session caps or configuration names from another harness. Preserve coverage and record real capacity limits.

## Eval orchestration patterns

Use the native OMP orchestration and recovery contract in ../SKILL.md. Construct task entries from observed targets; persist ids, scope, dependencies and verification before spawning. Predefine every predictable stage within the checkpointed phase; fan out ready nodes, wait for the handles the next decision needs, verify their handoffs, and release their consumers without waiting for unrelated siblings. Define a new phase from bounded verified digests; add nodes within the current phase only when findings change the graph's shape, not merely its input data. Independent graphs may overlap when scopes and actual runtime capacity allow. Completion notifications trigger the next decision; a single midpoint read is justified only by a decision. Retry only failed nodes; definition changes invalidate changed nodes and their descendants. Upstream output is not magically substituted into prompts. Never paste unbounded raw reports into a reducer.

## Dag or team

The dag is not the only fan-out surface, and picking the wrong one strands the run. Decide before you plan:

- **A dag** when the work is stage-shaped: every predictable stage belongs in one phase graph, with files carrying data between stages. Chain runs at phase boundaries or when findings determine which nodes exist. The lead-owned graph and ledger preserve resume identity and verified results; use actual documented workpool views only when available.
- **A cooperating native task roster** when workers must talk DURING the work: broadcasting leads, multi-round debate, or accumulating context across assignments. Each child starts with one complete assignment; steer the actual agent id through supported messaging and relay discoveries between lanes.
- **A plain ulw-research request goes to the team path.** Cross-critique and expand loops are team mechanics; use a dag for the independent harvest stages only.
- **A MASS research request goes to the dag path, at mass scale.** When the user combines the mass trigger with research ("mass ulw research", "mulw research", "ulw mass research"), they asked for over-collection no roster of 8 members can produce: run collection as cluster runs under the section below, and keep a team only for the debate rounds the claim graph needs. Either path inherits ulw-research's delivery gates - rendered-page visual QA, then the proofread pass - for any report or PDF deliverable.

## Mass research - over-collect through per-angle chains, then reduce

A mass research run is a HARVEST, and the graph is sized by how many angles exist, not by what feels tidy. Read `ulw-research`'s SKILL.md for the epistemic contract it owns - the journal, claim graph, EXPAND markers, convergence rules, delivery gates - and predefine the collection phase's predictable stages before dispatch:

**The harvest opens across the topic's actual angles, deliberately covering rather than guessing.** Enumerate the relevant source territory, sub-question, entity, time window, competing approach, and adjacent field, then give each materially distinct angle its own chain. There is no fixed angle floor or quota: coverage is the deliverable, and the lead must stop once the topic's meaningful territory is represented. Under-collecting is a failure; padding the harvest to hit a number is also a failure.

**Route the harvest across the whole ladder.** Broad source sweeps and per-item harvest batches are `quick`. Angles needing a judgment call a template cannot make are `unspecified-low`. Angles with real integration surface across several territories are `unspecified-high`. Reserve `deep-low` for the few genuinely hairy cross-source contradictions, and `deep-high` only when one of them turns on a decision evidence cannot settle. A single tier across materially different nodes is the routing failure named above - name the tier for every node as you define it, and honor a user's literal routing words ("quick", "deep", "all quick") exactly - a bare "deep" means `deep-low`.

**Each angle is a predefined chain: `harvest-<a>` -> `expand-<a>` -> `verify-<a>`.** Harvest writes `<session-dir>/waves/<run-key>/harvest-<a>.md` with claim candidates and an EXPAND tail. Expand reads that file, chases its leads and writes `expand-<a>.md` with its own tail. Verify reads both, counter-searches each claim and writes `verify-<a>.md` with verdicts, evidence and remaining leads. Resolve these paths to absolute paths in every assignment. Each node writes only its own handoff file through native read/edit/write; the root owns journals, graph/ledger state and the claim graph. Select a write-capable role for handoff-producing nodes, not a read-only scout.

**Converge by cluster, not by global stage barriers.** Group angle chains into bounded clusters sized for actual runtime capacity and reducer input budgets, counting all three stages and reducers. As a cluster settles, the root deduplicates outstanding EXPAND leads against its journal and records additional `expand-<a>-<n>` -> `verify-<a>-<n>` pairs with new owned handoff paths. Dispatch them without waiting for other clusters. Apply ulw-research's convergence rules per cluster, including two expansion waves, no unchecked leads and settled debates; the predefined expand stage counts as the first expansion wave, not convergence by itself. Preserve completed siblings; a failed or missing handoff blocks only its consumers until a verified replacement attempt settles.

**Synthesis reduces through several advisory lanes, then one reducer.** Never hand an unbounded set of raw node outputs to a single node. Each converged cluster's slice reducer reads only its verified handoffs and writes one bounded digest (<= 5k tokens) to its own handoff file. One final reducer starts only after every cluster has converged and reads only those slice digests, with citations back to evidence. The root reconciles candidates into its claim graph before synthesis treats them as supported. Architect, deep-low and ultrabrain name the intended reasoning tier inside the brief, not OMP categories or agent names. Choose available default or senior-task reasoning workers under the common contract; choose sonic for a purely mechanical merge. If the final merge genuinely needs the highest reasoning tier, reserve that planning tier for the one reducer and record the actual role/model selected by OMP.

## Node prompt contract

A node prompt is the ONLY thing the worker sees. It has no conversation history, no access to your reasoning, and no way to ask you questions. Write every prompt so a competent stranger executes it exactly. Every node prompt carries, in this order:

1. **TASK** - one imperative sentence naming the deliverable.
2. **DELIVERABLE** - the concrete artifact returned: files changed, the exact report shape, the evidence produced. For a handoff, name the producer-owned absolute output path, required sections and size bound; every consumer names the exact input paths and fails if any required handoff is missing.
3. **SCOPE** - what the node may read and what it may write, with exact paths, stated as a HARD boundary the prompt forbids crossing. Name what is OUT of scope when a neighboring node owns it or the node could plausibly wander there - an explicit bound is what makes drift detectable.
4. **VERIFY** - the check the node runs on its own work before reporting: the literal command and its expected result.
5. **STOP WHEN** - the single observable condition that ends the node's run.

Rules that make node prompts obeyed:

- **Self-contained, always.** Paste exact paths, facts, and constraints INTO the prompt. "As discussed above" and "the issue mentioned earlier" are dangling references - the node sees neither.
- **Minimum sufficient context.** Every pasted fact must change what the node does. Context the node cannot act on steals attention from the instructions it must follow.
- **Binary observables.** PASS/FAIL must be decidable from the prompt alone: "exit code 0 and `dist/index.js` exists", never "check it works" or "make sure it's fine".
- **Positive framing.** Tell the node what to do, not what to avoid. Negative instructions compete with the worker's priors and lose; reserve NEVER/ONLY for true invariants (do not commit, do not edit outside scope).
- **Emphasis lives in the words.** UPPERCASE, **bold**, and strong declarative verbs for load-bearing rules. No emojis, no banner dividers, no decoration - the worker reads decorated sections as flavor and skips them.
- **One role per node.** A node that investigates does not also fix; a node that writes does not also review its own work. Role-stacked prompts produce workers that grade their own homework.

**Audit the contract before dispatch.** The lead checks TASK/DELIVERABLE/SCOPE/VERIFY/STOP WHEN, disjoint writes, ids/dependencies/cycles and a final verification node. OMP does not supply the old workflow warnings; missing fields are definition defects to repair before dispatch.

## Verification wave

**Every graph that changes code ends with at least one verification node** depending on ALL producer nodes. Real runs without one ship unverified work: the synthesis node's own claim is not evidence.

- The verification node runs the REAL check - the test command, the build, the endpoint call - and reports the captured output.
- Its prompt names the exact invocation and the binary observable that decides PASS vs FAIL.
- **A paginated deliverable - PDF, DOCX, deck, print HTML - is verified by its rendered pages, not by binary probes.** File size, keyword grep, and page count are claims about a file, not about what a reader sees. The verification node renders EVERY page to an image and inspects each one for blank or near-empty pages, wrong page breaks, orphaned keep-together blocks, split tables, and clipped text, then fixes and re-renders until the pages are clean. Sampling a few pages is not verification: the defect sits on the page nobody opened.
- **Node outputs are claims until verified.** A downstream node that builds on an upstream result re-checks the specific facts it depends on (the file exists, the test passes, the symbol is exported) before trusting them.

## Failure playbook

- Failed nodes block descendants only. Read failure evidence, tighten the same node's assignment and start a fresh attempt; retain verified siblings.
- Wrong definitions invalidate the changed node and transitive dependents. Do not duplicate running writers; steer through actual agent:// messaging first.
- Resume from the graph and ledger, not a new run guessed from chat. Same key is a ledger identity, not automatic idempotence supplied by OMP.
- Provider-start storms require fixing the actual exposed route before retries; do not assume invented category routes or residency knobs.
- A returned response can report BLOCKED. Verify the deliverable before accepting completed status.
- Quiet children are not dead: one needed midpoint read or wait, no status polling. Cancel only for an actual abandonment or scope boundary, through the real host contract, with a durable reason.
- Paginated reports require every rendered page inspected; all output claims remain false until proven.

