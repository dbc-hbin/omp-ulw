---
name: ulw-research
description: "Explicit saturation research or deep investigation with research axes, independent evidence, counter-evidence, claim-graph gating, and a cited deliverable."
argument-hint: "<research-topic>"
metadata:
  short-description: Saturation research, claim verification, and cited synthesis
---

# ULW-RESEARCH

## Activation and authority

Activate only on an explicit `ulw-research`, `/ulw-research`, `$ulw-research`, `ulw research`, `ultradebate`/`hyperdebate` research request, or an explicit request for this exhaustive research/deep-investigation workflow, in any language. Preserve combined `mass ulw research`, `mulw research`, and `ulw mass research` entry points. Ordinary questions, debugging, and another workflow's context gathering do not activate it; bare ULW does not select it. On activation include `ULW-RESEARCH MODE ENABLED!`.

Use the [host authority boundary](../ulw-loop/references/omp-contract.md) for model guidance, native modes and permissions. Supported command-bridge invocations connect research to native `workflowz` unless the user supplied a native keyword; semantic skill selection alone does not prove that mode is active. This skill owns research evidence and deliverables.

Data comes first: every factual conclusion must trace to a page or file actually read, or a tool/command result actually observed, before it is asserted. This includes claim candidates, DEAD END decisions, convergence calls and judgments that a topic is settled. Memory supplies a LEAD to investigate, never independent evidence. Distinguish observed evidence from inference and state what the evidence establishes; code shape or plausibility alone does not prove runtime behavior.

## Research brief and durable evidence

Use `doc/ulw-research/YYYYMMDD-HHMMSS/` as `$SESSION_DIR`; its basename is the local start timestamp consumed by the report tools, so do not rename it. Set `$SKILL_DIR` to the absolute directory containing this installed `SKILL.md`, not the working directory. Maintain the following records as findings arrive, not as an end-of-run reconstruction. One synthesis owner reconciles the claim store; collection returns evidence candidates rather than competing journal edits.

| Artifact | Required content |
| --- | --- |
| `brief.md` | Core question; orthogonal research axes (3+ for a multi-faceted question); each axis's source territory, question, coverage criterion and owner; canonical entity/version/time window; expected truths; precision stakes; likely contested claims; deliverable fields from [deliverable-phase.md](references/deliverable-phase.md). |
| `sources-ledger.md` | One source per line beginning exactly `[S1]` or `[Source 1]`, followed by URL/path, title, reliability, access date and useful quote/anchor. The prefix and URL let `outcome finish` count sources and domains. |
| `wave-<N>-<kind>-<axis>.md` | Search/collection trace, findings, citations, observation and claim candidates, and the verbatim `## EXPAND` tail. |
| `expansion-log.md` | Every lead, including rejected leads; parent axis/claim, wave, ownership, duplicate/dead-end decision, open/closed status and convergence reason. Record scope changes here. |
| `intent-diff.md` | `intent_id`, expected truth, observed reality, diff, violated invariant, intent source, supporting observations, status (`true`, `violated`, `unknown`), linked claim ids. Use when an expected truth exists. |
| `observation-manifest.md` | `observation_id`, source URL/path, evidence layer, observer group, independence basis, observer, `observed_at`, `valid_at` or `claim_valid_at`, artifact path, quote/line anchor, contamination notes. |
| `claim-graph.md` | One node per asserted claim: `claim_id`, statement, type, risk tier, scope, intent ids, supporting and contradicting observations, independent source domains and observation groups, convergence status, counter-search result, primary source, dependencies, status (`supported`, `partial`, `refuted`, `unresolved`), final synthesis location. Keep the high-risk non-code allowlist in a `verified-claims` digest at the top. |
| `debate-log.md` | Claim, attack, defense with evidence, verdict, and resulting claim-graph change for each round. |
| `verification-economics.md` | Claim, risk, error cost, verification cost/time, chosen proof path, defer/verify decision, outcome, residual risk. |
| `cause-disappearance.md` | For causal findings: cause id, expected truth, prior observation, `last_seen`, disconfirming observation, replacement cause, current status, whether the violation is no longer observed. |
| `excursion-log.md` | For detours: id, parent axis/claim, ENTER trigger, depth, probe allowance, effort spent, EXIT rule, result and effect on the top-level answer (`none` with reason is valid). |

### Continuation ownership

Before collection, register the research axes and final deliverable as goals using the [existing loop ledger format](../ulw-loop/references/omp-ledger.md). This is a state helper, not activation of the loop execution workflow. For standalone research, keep `brief.md`, `goals.json` and `ledger.jsonl` under `doc/ulw-loop/<actual-host-session-id>/`; link the research directory and cited-answer criteria rather than duplicating its journal. The installed continuation hook reads this session-owned `goals.json`, not `outcome.json`. Keep the aggregate active with pending/in-progress goals until the research and promised delivery are resolved; update checkpoints from actual evidence and mark blocked/paused state when appropriate.

When an enclosing loop or execution plan already owns continuation, link the research axes and delivery into that existing state instead of opening a competing goal. Resume the owner state and research journal together after compaction. Without an exposed host session id, use the ledger's explicit run id but do not claim automatic hook continuation. Do not create a second native goal or load generic loop execution instructions merely to register research state.

## Collection and evidence independence

Cover each meaningful axis and source territory; scale breadth to the question rather than a worker/query quota. Resolve ambiguous products, people, codenames and versions against a canonical first-party identity before using them as premises.

Record the observations behind conclusions in `observation-manifest.md` and link them from the existing claim graph, expansion log or wave record as appropriate. Label inferences and retain their supporting observations and limits. An existing observation remains usable within its recorded scope unless new evidence or changed inputs invalidate it; do not reopen every checked source or repeat passed checks merely to collect another return.

- Retrieve the material behind an important search hit; snippets are discovery, not evidence. Prefer primary standards, filings, datasets, papers, first-party docs and implementation evidence. Vary query terms, operators, dates and opposing framings. Use English and relevant local-language sources where they improve coverage; write the report in the user's requested language.
- Code findings carry paths and line anchors; repository findings carry commit-pinned permalinks. Behavior/performance findings identify the actual runtime, platform, versions and configuration, not just documentation intent.
- Distinguish live sources from snapshots. Cite an archive's snapshot timestamp; do not describe it as the current page. Mark proxy-derived content as untrusted and corroborate it through an independent route. Rendered-page or social evidence retains its provenance; inaccessible evidence remains a gap.
- Source-domain diversity and observation independence are different checks. Syndicated copies or sources repeating one dataset are not independent corroboration. Separate observers repeating the same contaminated premise are not independent observation groups. Record the original dependency, route/method and contamination basis rather than counting URLs or people.
- Every supported claim receives an adversarial evidence pass. Attack the weakest assumption, scope, date, source independence and missing counter-source; record the defense and verdict. `ultradebate`/`hyperdebate` requires at least two attacking perspectives and a full round for every contested claim. This specifies evidence perspectives, not a fixed roster or model.

Collection returns preserve these textual markers (inside the report when an existing transport wraps it):

```text
## CLAIMS
- CLAIM: <assertion> - RISK: high|normal - SOURCES: <domains> - COUNTER: <refutation search result> - PRIMARY: <source or none> - OBSERVED: <read URL | file:line | command and observed result>

## EXPAND
- LEAD: <unchecked discovery> - WHY: <answer impact> - ANGLE: <next search>
- DEAD END: <lead exhausted, with reason> - PROBED: <searches/reads/commands and observed results>
```

With no new leads, retain `## EXPAND` followed by `none - <reason> - PROBED: <searches/reads/commands and observed results>`. A remembered assertion without observation belongs under LEAD. A missing tail or missing observation evidence leaves the affected claim or lane incomplete. Obtain the missing evidence through the actual host's result retrieval and steering contracts, or collect it directly within scope; if unavailable, record the gap and leave it unresolved. Deduplicate against the whole expansion log. A lead already being investigated stays with its recorded owner. An explicitly combined mass workflow can supply bounded handoffs such as `waves/<run-key>/<node-id>.md`; its collection structure does not bypass the claim graph.

## Expansion, excursions and convergence

Journal each return, reconcile claims and observations, investigate new relevant leads, then record what the wave opened, closed or changed. Multi-faceted research needs at least two expansion waves before claiming convergence. Convergence means either all leads were investigated/closed and supported claims survived critique, or three consecutive waves produced no new actionable leads. Link convergence and settled judgments to the recorded observations and PROBED results that establish those conditions; missing evidence leaves the lane incomplete. At five expansion waves, record remaining leads and an explicit non-converged status; continuation beyond that requires the user's extension. Do not report a stopped or capability-limited search as full saturation.

An excursion needs one named ENTER trigger: contradiction of a locked claim, potential to change the answer/recommendation, an uncovered source territory, or quoted user steering. State its probe allowance first. Allow at most one nested sub-excursion; a deeper question becomes a recorded axis or an out-of-scope gap. EXIT when the trigger resolves, two probes leave the parent answer unchanged, claim status stops changing, or the allowance is spent. Fold the result back into the parent claim/axis and record its answer impact. Three consecutive excursions with no impact end excursions for this run.

## Claim verification gate

For disputed or undocumented executable behavior, compatibility or performance, retain a minimal executed proof in `verify-<slug>.md`: claim, opposing evidence, executable source, complete stdout/stderr, pinned OS/runtime/dependencies/configuration, and `CONFIRMED`, `REFUTED` or `PARTIAL` verdict grounded in output. Commands merely proposed are not proof. If execution is unavailable, record the exact blocker and leave the claim qualified or unresolved.

A high-risk non-code claim enters `verified-claims` only with:

1. At least two independent source domains (two pages on one domain count once).
2. At least two independent observation groups, or a documented reason that a primary-only single-source exception is appropriate.
3. An active counter-search with no stronger refutation left unanswered.
4. Primary backing from the relevant standard, filing, dataset or first-party document.
5. Explicit `observed_at` and `valid_at`/`claim_valid_at`, distinguishing historical, branch, release and current-runtime scope.

Record each gate result on the claim node. Claims that fail belong in the `Unresolved` or `Refuted` annex, not asserted conclusions. All asserted claims, including normal-risk claims, must exist in the graph with cited observations and supported or explicitly excepted convergence status. No free-form claim bypasses it.

## Cited synthesis and delivery

Write `SYNTHESIS.md` from the graph and evidence records, using these sections as applicable: executive answer; findings by theme; codebase findings; ranked sources; verified claims; intent/reality and independence findings; debate record; contradictions; gaps/unresolved/refuted claims; expansion trace and convergence reason. Its header records axes/collection effort, waves, excursions, sources and distinct domains, verifications, debate rounds and elapsed minutes.

Every factual claim carries inline `[S1]` or `[Source 1]` citations to the ledger or a verification artifact. High-risk non-code assertions draw only from `verified-claims`. Keep numeric lineage visible: `MEASURED` for sourced observations, `ASSUMED` with rationale, `DERIVED` with formula and inputs; include sensitivity when assumptions affect the answer. Preserve original-language quotations and attribution when translating.

Use [deliverable-phase.md](references/deliverable-phase.md) for resumable report state, formats, design-spec, report gates, bounded repair and the outcome manifest. Use [report-visualization.md](references/report-visualization.md) only for material visuals or requested reproductions, and [latex-report.md](references/latex-report.md) only for LaTeX. Text reports do not need decorative visuals or unrelated formats. The requested report remains due alongside any promised demo/reproduction.

Research completion requires covered axes; observation evidence behind every factual conclusion, including lead closure and convergence/settled judgments; explicit lead/convergence and exception status; reconciled claim/observation/debate records; a cited answer with unresolved claims disclosed; and every promised deliverable resolved in `outcome.json`. Record only gates actually performed. Run `outcome verify`, `outcome finish`, then `outcome briefing` as documented, and include the printed source/domain, elapsed-time, deliverable, gate and residual-defect briefing with the report. Do not infer claim validity or gate success from manifest verification alone.
