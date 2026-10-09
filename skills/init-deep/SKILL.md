---
name: init-deep
description: "Optional explicit initialization or refresh of a hierarchical AGENTS.md knowledge base, using evidence-grounded map/reduce and preserving existing instructions. Use only when the user asks to initialize or document repository guidance."
argument-hint: "[--create-new] [--max-depth=N]"
---

# init-deep

Generate useful root guidance and complexity-scored subdirectory guidance, not a file in every directory. Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Read [scoring and templates](references/knowledge-base.md) and [native node contracts](references/nodes.md) for the corresponding work.

This conditional OMP-contract loading and same-session reuse policy applies throughout this workflow, including all referenced documents, and supersedes their unconditional OMP-contract read directives. Operation-specific reference requirements remain binding.

## Exact native translation

Source: omo 5.1.19 `plugin/skills/init-deep/SKILL.md`, compared with upstream revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe`, both `packages/omo-senpi/skills/init-deep/SKILL.md` (hierarchical map/reduce) and `packages/shared-skills/skills/init-deep/SKILL.md` (discovery, scoring, templates).

The native DAG SDK, runtime configuration knobs, category-selected workers, fixed worker context-window assumptions, and delete-all regeneration are removed. OMP uses explicit dependency waves through background `task` and first-wake `wait({})`, unless a real documented native workpool is exposed. No DAG SDK is required. `scout` is suitable for discovery when listed; use default workers or a listed suitable specialist for writing/review. Do not send category/model/subagent_type/load_skills/prompt/run_in_background fields. Use top-level `context`, `tasks`, uncertainty-based `solutionSpace`, and workflow-specific `outputSchema` with strict mode.

Context protection is structural: scanners return bounded reports, subtree reducers consume their own reports, root consumes digests, verifier returns a verdict. The lead normally reads node status/path receipts and final verification, not the raw repository or every report. A small repository can use inline reduction; the native map/reduce path is for independently meaningful batches, not one child per file. Split further when a discovered boundary or report volume requires it, not from a fictional fixed model capacity.

## Modes and preservation

- Default: update existing guidance surgically and create new files where warranted.
- `--create-new`: re-derive a proposed fresh organization from current evidence **while preserving all existing documents**. Read relevant existing guidance first. This flag never authorizes deleting every AGENTS.md/CLAUDE.md or overwriting user instructions. Integrate still-true facts and preserve user-authored constraints; offer obsolete file removal as a separate explicitly authorized action.
- `--max-depth=N`: maximum creation depth relative to root; default 3. Existing deeper guidance is not deleted because of a depth limit.

Explicit init authorization permits discovering and reading existing AGENTS.md/CLAUDE.md within the requested repository, excluding external/generated/vendor trees. Read covering instructions for each owned subtree. Do not broaden this exception to ordinary coding tasks: they read relevant covering guidance, not unrelated agent files. Never treat discovered child guidance as permission to modify unrelated user work.

## 1. Inventory, scope, and route

Register native todo phases where available. Discover the requested root, its source/workspace boundaries, relevant existing guidance, and current dirty changes. Use glob/find for discovery, read for file inspection, grep for literal conventions, LSP for symbols/references, and ast_grep for structural imports/exports. Use bash only for actual binary probes, git status/revision, and short numerical counts. All file creation/editing goes through write/edit.

Inventory tracked source plus relevant untracked source, excluding .git, dependencies, vendored/generated outputs, lockfiles, minified files and binary assets. Measure file counts, source bytes/LOC, directory depth, language/workspace distribution, entrypoints and hotspots. Read commands from manifests/configuration; never guess them from framework defaults. Record inaccessible boundaries and unmeasured metrics instead of inventing zeros.

Choose whole directories or workspace domains as chunks. Split oversized/heterogeneous directories at real child/module boundaries. Set an explicit report-size budget appropriate to the actual task contract; do not equate bytes to a promised token window. Assign disjoint subtree owners and exact report/digest paths under a task-owned run directory. Preserve any pre-existing scaffolding and use distinct run paths. If reports exceed a reducer's manageable evidence set, add intermediate reduction waves with bounded fan-in.

For a small repository, run independent discovery lanes alongside lead LSP/AST inspection, collect every lane, and apply the same matrix/templates inline. Do not add orchestration whose overhead exceeds its value.

## 2. Map: evidence extraction

Dispatch scanner batches in parallel with shared context and independent tasks. Each assignment names exact read scope, covering existing guidance, report path, numbered extraction steps, output schema, and stop condition. Scanners extract, never decide locations or edit AGENTS.md. Their one report contains:

1. INVENTORY: file counts, LOC/bytes, languages, actual entry files.
2. EXPORTS: observed public symbols, import edges, references and measurement gaps.
3. CONVENTIONS: deviations from stack defaults, with config evidence.
4. ANTI-PATTERNS: explicit project prohibitions and their provenance.
5. HOTSPOTS: large files, central symbols and complexity concentrations.
6. COMMANDS: exact manifest/CI/build/test/dev commands affecting the scope.
7. EXISTING GUIDANCE: still-true facts and user constraints, with contradictions flagged.

An empty section says `none`; an unavailable measurement says `unmeasured`, not none. Cite file:line. Relevant existing docs are evidence to preserve, not stale material to discard on refresh. Read [node contracts](references/nodes.md) for strict report receipts.

## Every dependency wave: collect first wakes correctly

Record actual child ids in a pending set and logical node ledger immediately. Work on independent tasks. Native `wait({})` wakes on the first settled job, message, or steering interrupt; it neither accepts child handles nor promises a complete wave. Reconcile every returned/auto-delivered result by actual id. Remove only terminal children. Keep unfinished siblings pending; messages and still-running snapshots are not completion.

Consume validated structured payloads (`structured.status` and `structured.data`, or the parsed payload at the actual agent URI), not `resultText` previews. Validate path receipts and evidence before marking the node successful. Wait again only when dependent work is blocked. A reducer starts only after all its input nodes have terminal success. A root writer starts only after all required digest reductions succeed.

For a failed terminal node, preserve verified unrelated outputs, record the failure/attempt, and dispatch only that node with exact failure context and a new actual id. Changed input invalidates its descendants; unchanged completed branches remain valid. Send clarification to `agent://<actual-id>`, never to invented DAG/node recipients. No shell polling, sleeps, fake retry/send APIs, or duplicate live writers.

## 3. Reduce: score and write disjoint subtrees

Each reducer reads its own reports and existing guidance, spot-checking real code when evidence conflicts or is thin. Apply [the matrix](references/knowledge-base.md) to choose locations, not file names alone. Score measured factors; keep unknowns visible. Root always receives guidance; high-scoring subdirectories receive it only when it adds domain-specific value.

Use edit for existing files and write for new files after discovery. Preserve user-authored rules and unrelated sections. If a stale factual claim conflicts with verified current code, make the smallest correction and record why; a user-intent conflict belongs to the lead for a decision. No automatic deletions or blanket rewrite.

Each reducer owns only its named subtree's guidance and its own digest. Avoid parent/child races: a parent owner must either supply the intended inherited sections first, or a common reduction stage must establish the inherited contract before children write. Separate top-level subtree writers can run concurrently. Root-only facts go in digests, not duplicated into children.

Digest: chosen paths with scores/reasons, created/updated/unchanged status, relevant inherited rules, cross-subtree facts, exact commands, symbol-map evidence, unresolved contradictions and preservation notes. Use bounded digests, with extra intermediate reducers if root fan-in grows. The lead owns coordination, not concurrent report append operations.

## 4. Root and independent review

A dedicated root writer reads only final digests and existing root guidance; spot-check named source evidence only if essential to resolve a conflict. It does not ingest every scanner report. Produce the root template from [knowledge-base reference](references/knowledge-base.md), preserving user-authored sections and explaining deviations from the suggested size.

After root and subtrees are complete, an independent verifier reads every changed guidance file, relevant parents, digest-declared locations and cited sources. Check existence, hierarchy, no repeated inherited blocks, command contracts, link integrity, no generic filler, no lost user rules, and no edits outside ownership. New root guidance targets 50-150 lines; new children target 30-80. Existing useful/user-authored text is not deleted merely to hit a line limit; record the reason.

The lead receives the strict verifier verdict. Route each named defect to its owning writer; only terminal failed writers may be replaced. Recheck affected evidence after repair, retaining unchanged verified branches. Do not run project builds/tests repeatedly for a prose-only guidance pass; inspect the declared commands and report any commands not executed. Host-required final verification still applies.

## 5. Snapshot, delivery mode, and finish

Read any existing snapshot before updating. Through write/edit record `doc/init-deep.json` with `commitSha`, `fileCount`, `loc`, millisecond `timestamp`, and `mode` (`local` or `committed`), plus run artifact path and measurement gaps if necessary. For a non-git project use null commitSha and say why. Do not invent counts. The snapshot is discovery provenance, not proof that runtime checks passed.

Honor an explicit local/committed choice. If absent, use current tracked guidance status only as the descriptive default and leave everything as local edits; a blocking native ask can resolve a genuinely necessary delivery decision after independent work. `committed` is not authorization to create a commit, PR, merge, or push. Those require explicit user authorization and the actual native workflow. Do not invoke an unavailable work-with-pr skill or automatically modify git excludes. If local exclusion is requested, preserve existing exclude lines through a surgical edit; excludes cannot hide tracked-file changes.

Report inventory scope, chosen batches, paths created/updated/preserved, scores/reasons, hierarchy, snapshot path, mode, verification verdict, unknown measurements and unrun commands. Keep run reports/digests available for review and resume; only remove specifically identified task-created scaffolding when cleanup is authorized, never an old/shared directory wholesale. Mark what remains rather than claiming it was removed.

Finish with every requested guidance artifact present, existing instructions preserved, declared links/contracts inspected, all relevant verifier findings resolved or clearly blocked, and an empty pending set. No automatic commit or background service.
