---
name: remove-ai-slops
description: "Removes AI-generated code smells from an explicit file set or established change diff while preserving behavior, boundaries and user edits, including junk tests (prose pins, source greps, copied inventories, mock echoes), each proven by its class's rule before a cut."
argument-hint: "[file ...]"
---

# Remove AI slops - Bounded behavior-preserving cleanup

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Activate when explicitly requested. An explicit request naming this bounded cleanup and its file set or established diff authorizes ordinary owned edits. For an open-ended assessment, or when the requested scope is ambiguous or destructive, produce a proposal before editing and obtain the needed scope decision. No commits or external writes are implied.

This conditional OMP-contract loading and same-session reuse policy applies throughout this workflow, including all referenced documents, and supersedes their unconditional OMP-contract read directives. Operation-specific reference requirements remain binding.

The safety invariant is observable behavior preservation, not a green test manufactured by changing expectations. Reuse existing regression coverage and repository patterns, document risk and preserve load-bearing guards. Current caller inputs, return/exception behavior, side effects, public signatures, types and security remain contracts.

## Categories (what counts as slop)

The agent looks for these nine categories. The first three are stylistic, the next three are structural, the next two are about hidden cost, and the last is tests.

### Stylistic
1. **Obvious comments** — comments restating code, trivial docstrings, section dividers, commented-out code, vague TODOs/Notes.
   - KEEP: comments explaining WHY (business logic, edge cases, workarounds), ticket links, regex/algorithm explanations.
   - KEEP: BDD markers (`# given`, `# when`, `# then`, `# when/then`).

2. **Over-defensive code** — null checks for guaranteed values, try/except around code that cannot raise, isinstance checks for statically typed params, default values for required params, backward-compat shims, redundant validation duplicated at multiple layers, **broad exception catching** (`except Exception`/`except BaseException` in Python, empty `catch {}` or `catch (e) { console.error(e) }` without narrowing in TypeScript/JavaScript).
   - KEEP: validation at system boundaries (user input, external APIs), I/O error handling, nullable DB fields. Top-level boundary catch-all (CLI `main()`, HTTP handler) with explicit logging + re-raise is acceptable.
   - REFACTOR: `except Exception` → catch the specific exception you expect. Empty `catch {}` → add `instanceof` narrowing or re-throw. `catch (e) { log(e) }` → narrow with `instanceof`, handle known cases, re-throw unknown.
   - PROOF REQUIRED: before removing a proven duplicate validation or error-handling layer at a trust boundary, Phase 2 must include an adversarial regression (malformed or hostile input) that catches loss of the boundary protection. It must still pass with the duplicate layer removed because the demonstrated remaining guard runs inside the same boundary. Without that proof, the guard stays; a guard with no proof of redundancy is load-bearing.

3. **Excessive complexity** — deep nesting (>3 levels), nested ternaries, complex boolean expressions (combine 4+ predicates), long parameter lists (>5 args without a struct/dataclass/object), god functions (>50 lines doing many things), overly clever one-liners that sacrifice readability, variant-discrimination chains or excessively broad types that obscure an actual contract.
   - KEEP: established complexity patterns in this codebase, performance-critical hot paths that intentionally use a complex idiom. `if/else` for boolean conditions and range checks (not variant discrimination).
   - REFACTOR: nested if-chains → guard clauses / early returns. Complex ternaries → explicit if/else. Use existing language/project discrimination and concrete type patterns when they clarify a proven contract; do not create a Protocol/interface/type hierarchy just to replace object or satisfy a style threshold.

### Structural
4. **Needless abstraction** — pass-through wrappers, single-use helpers, speculative indirection ("we might need this later"), interfaces with one implementer where the interface adds no testability win, factory functions that just call a constructor.
   - KEEP: abstractions that provide a real seam (testability, multiple implementers, framework-required boundaries).

5. **Boundary violations** — wrong-layer imports (UI importing DB driver), leaky responsibilities (handler doing business logic that belongs in a service), hidden coupling (module A reads module B's private state), side effects in pure-named functions.
   - KEEP: pragmatic short-circuits already established as a pattern in this codebase. Flag for human judgment if unsure.

6. **Dead code** — unused imports, unused private functions/methods, unreachable branches, stale feature flags, debug leftovers (`console.log`, `print(...)`, `dbg!`), removed-but-still-referenced code.
   - KEEP: code referenced via reflection, dynamic dispatch, or string lookup. Code intentionally kept as a feature flag rollback path (verify with the user).

### Hidden cost
7. **Duplication** — copy-pasted branches with trivial differences, redundant helpers that do the same thing in two places, repeated literal/magic-number sequences.
   - KEEP: incidental duplication (two pieces of code that look similar but serve different intents that could diverge). Prefer leaving them separate over forcing a premature shared abstraction.

8. **Performance equivalences (behavior-preserving optimizations)** — changes that are provably equivalent in semantics but cheaper in time/space:
   - O(n²) → O(n) when correctness preserved (e.g., set lookup vs list scan)
   - Repeated computation inside a loop → hoist outside
   - Unnecessary intermediate collections (eager `list(...)` when only iterated once → generator)
   - String concatenation in loop → `join`
   - Redundant DB/API calls in a loop → batch
   - Redundant deep copies / clones
   - `.length` / `len()` recomputed inside loop → cache

   **Hard rule**: only apply when behavior equivalence is obvious. Do NOT change algorithms with subtle correctness implications. Do NOT micro-optimize hot paths without a benchmark. If in doubt, SKIP.

### Tests
9. **Tests: missing or junk** — tests are code in scope like any other file, judged by the one table in the `programming` skill, [`references/testing/junk-classes.md`](../programming/references/testing/junk-classes.md) (junk classes, retention bar, R/F/C/D marks, proof rule). Two directions:
   - **Missing**: a behavior in the changed files that no test guards, where the repository keeps tests for that kind of behavior and a regression would otherwise pass unnoticed. Add or extend the narrowest owner test that passes the four-question authoring gate ([`references/testing/README.md`](../programming/references/testing/README.md)); name its owner contract. A PROSE file (prompt, `SKILL.md`, rule, markdown) has no behavioral seam: do NOT add a text/word-count/phrase pin for it. Cover only a machine-consumed value (parsed field, sentinel a runtime greps, a doc JSON sample through its real validator) or leave it to review.
   - **Junk**: mark every in-scope test declaration `R` / `F` / `C` / `D`. A `D` or `C` needs the proof the table names for its class BEFORE the cut: for a behavior class (cannot fail, mock echo, source grep, duplicate contract, layer replay, implementation mirror, fabricated postcondition, input transcript) a mutation of the production owner run against the candidate and its named keeper on the unmodified test tree; for a prose pin the assertion line plus the repo's prose rule; for a change certificate the revert that turns it red; for a seam keeper the grep or LSP references showing no production caller; for a copied inventory the generator or consumer that owns it; for a capability restatement the delivery test that owns the promise (none: `F`, not `D`); for near-duplicate cases the one table that keeps every old assertion (typecheck after). A misnamed test is re-marked by what its assertions check, never cut for its name. A mutation proves `D` only when the keeper goes red and the candidate stays green (cannot fail) or both go red (redundant); a candidate that is the ONLY red is `R`, or `C` into the keeper and re-run. Mutations run in Phase 4b, serially, by the root, never by a batch worker. A test-only production seam (export, flag, getter, reset hook) whose last test was deleted goes with it.
   - KEEP: everything under the retention bar (public API, protocol, config, migration, storage, security, platform, shipped-copy equality, compatibility suites, issue regressions, machine-consumed text). A test that is red on the unchanged base is a product bug to report, never a deletion. Static or slow is never a reason to delete.



## Size and scope policy

Module size can signal multiple responsibilities, but there is NO mandatory 250-LOC split, recursive fixed-size checker, exception marker or new module quota. Do not add helpers/interfaces/modules solely to shrink a file or replace a type annotation. A genuine multi-responsibility extraction is a separate proposal unless explicitly in this cleanup scope. No obsolete LOC scripts are shipped.

## Phase 0 + 1 - Bind ownership and scope

Use the host's documented task tracking if exposed. Inspect the user's explicit files first. Otherwise discover the actual branch/PR target and merge-base plus relevant staged/unstaged/untracked changes; never assume main/HEAD~1 or sweep the whole repository. Record pre-existing dirty hunks and exact owned edits. Filter generated/vendored/binary/deleted artifacts from source cleanup; lockfiles change only if an explicitly authorized dependency removal requires them. Discover files with find/glob/read; literals via grep, definitions/references/callers via LSP.

Name the final files and allowed adjacent owner-test paths before changes. Reading neighboring patterns/callers is context, not authorization to edit them. Out-of-scope slop goes in findings. If ambiguous scope matters, finish read-only assessment and ask one focused question.

## Phase 2 - Behavior lock under host check policy

For each scoped source unit, identify public behavior and the existing strongest owner test/reproduction. Read covering tests and record baseline evidence already available; capture a required reproduction before editing when needed. Do not mandate repeated midflight suite runs. If tests are absent/weak, add or extend one narrow owner test only where the repo keeps tests for this behavior and regression would otherwise go unnoticed. Otherwise retain an exact before/after executable scenario. Pure prompt/markdown/rule prose receives no phrase/word-count pins; validate only machine-consumed parsed fields/sentinels through their actual consumer.

A test that is red on the unchanged base is recorded on a baseline-red list as a bug, excluded from every proof, and neither fixed in this pass nor deleted. When test files are in scope, run the `programming` skill's static detector from the project directory over every in-scope test file, including any written in this pass: `bun run "$PROGRAMMING_DIR/scripts/typescript/check-test-junk.ts" <test files>`, where `PROGRAMMING_DIR` is the observed absolute directory of `skill://programming`. Exit 1 lists `file:line` per junk class a regex can see (source grep, prose pin, fixed sleep, `.only`/`.skip`, self-comparison, lower-bound cardinality). Its findings are category-9 candidates for the Tests Ledger, never automatic cuts; a test written in this pass that it flags is rewritten before the pass continues.

Async behavior subscribes to the exact completion event before the trigger and awaits with bounded timeout or fake clocks. Never sleeps, polling delays, retries, skips or weakened assertions to reach green. If no trustworthy behavioral baseline can be established, leave that risky unit unchanged and report why; independent proven cleanup may proceed. Do not repair a pre-existing wrong test by editing its expected result.

Boundary guards need adversarial proof and a demonstrated remaining guard within the same boundary before removing a duplicate. Missing proof means KEEP. Do not narrow catches in a way that changes documented exception handling, or remove required nullable/I/O validation based only on static plausibility.

## Phase 3 - Existence ladder and cleanup plan

For each changed unit: delete entirely only if unused/unneeded is proven (for a test: its contract is already owned by a keeper or it has none, with the category-9 proof) -> reuse an existing helper/pattern -> use stdlib/platform/native/already-installed dependency -> simplify in place. A user-visible existing behavior is not speculative just because you would not have written it. A native replacement must preserve the actual observable contract, accessibility and supported environment.

Only surviving simplify-in-place units need all nine category checks. For a shared bugfix seam, use LSP to inspect callers and avoid repeated per-caller guards; a behavioral bugfix outside the authorized cleanup becomes a separate finding. No new abstraction/dependency or changed public signature/type erasure.

Record per file: ladder decision, candidate categories, proposed change/replacement, why safe, order, risk and skipped load-bearing code. Apply safest first: comments -> dead code -> proven redundant defense -> duplication -> complexity -> abstraction/boundary -> obvious performance equivalence -> tests (`F` rows and required owner coverage; `D`/`C` wait for Phase 4b). Size is a finding, not a mandatory final pass.

Intentional bounded shortcuts may use the repository's existing debt/ponytail marker naming the ceiling and upgrade trigger, only when this pass introduces or deliberately retains a known constraint. Do not inject @allow suppressions or decorate every unchanged file. Record meaningful deferred risks in the report.

## Phase 4 - Owned cleanup; optional bounded parallelism

Do one coherent small pass inline. For independent substantial units, native background workers may run in batches of at most five, with disjoint edit/test ownership. This cap is not a requirement to delegate every file. Shared helpers/callers, imports or owner tests that overlap are one lane or serialize. Children read this skill and common contract; they do not delegate further or rerun final checks midflight. For a test file, a child does NOT cut yet: it marks every declaration R/F/C/D against the junk-classes table and returns one ledger row per D/C/F (`| test | mark | keeper or reason | proposed proof |`), where the proposed proof names the class's proof kind and, for a mutation, the owner file, the exact find/replace, and the keeper to run. It applies `F` rows in the test file it owns and reports them as applied; `D`/`C` rows return uncut; it never mutates any file to prove a test.

Concrete OMP shape after inspecting actual task schema and file scope:

```js
const cleanupReceiptSchema = {type:"object",properties:{files:{type:"array",items:{type:"string"}},changes:{type:"array",items:{type:"object",properties:{category:{type:"string"},replacement:{type:"string"},whySafe:{type:"string"},pointer:{type:"string"}},required:["category","replacement","whySafe","pointer"],additionalProperties:false}},skipped:{type:"array",items:{type:"string"}},risks:{type:"array",items:{type:"string"}},checks:{type:"array",items:{type:"string"}}},required:["files","changes","skipped","risks","checks"],additionalProperties:false};
await tool.task({
  context: "Perform the authorized bounded cleanup recorded at local://cleanup-scope.md. Preserve its pre-existing user hunks, public behavior and security guards; no new dependencies or abstractions. Root owns final verification.",
  tasks: [{
    name: "CleanParser",
    task: "TASK: Read skill://remove-ai-slops and local://cleanup-scope.md, then apply the approved behavior-preserving cleanup to its owned parser path only. DELIVERABLE: owned diff summary grouped by category with replacement, why-safe and skipped issues. SCOPE: exact path/hunks from the scope artifact; no caller/test edits, no builds/tests/formatters midflight. VERIFY: inspect all nine categories and KEEP rules, existing owner tests and boundary guards; return risks and required final checks to root. STOP WHEN: all approved safe edits are present and no user hunk was touched." + "\nReturn JSON matching: " + JSON.stringify(cleanupReceiptSchema),
    solutionSpace: "Cleanup options are partially open; preserve behavior and skip any candidate whose equivalence cannot be established from the supplied contracts."

  }]
});
```

Omit agent for the default worker; senior-task only when listed and difficult reasoning merits it. No category; pass `model` only as an exact ID the live task schema advertises as approved. Replace example artifacts with observed paths. Track actual ids in a pending set; native wait({}) wakes on first settled result/message, not an entire batch. Validate the actual terminal response from task/wait or agent://; remove only terminal entries. Retain verified siblings, collect a failed terminal child before any replacement, never duplicate a live writer. Integrate owned results before opening the next batch; final report requires empty pending set.

## Phase 4b - Prove the test cuts serially, then cut

After every worker is terminal and no test run is live, root takes the collected ledger rows. For each row whose proof is a mutation, run from the project directory `bun run "$PROGRAMMING_DIR/scripts/typescript/mutation-proof.ts" --file <owner> --find <text> --replace <text> --test 'candidate=<argv>' --test 'keeper=<argv>'` (add `--json` for the ledger; each `--test` value is split on spaces with no quoting, so a filter containing a space needs a wrapper script or a file-path target). It applies the find/replace to the production owner, runs the candidate and the keeper on the unmodified test tree, records both verdicts, and restores the owner byte for byte (sha256-checked) before the next row. One mutation at a time, never two on the same file; a mutation touches a file outside the diff only transiently and is never kept. Rows proven per the table become the cuts; a D or C whose proof failed or was not run is an R. Non-mutation proofs (prose pin, change certificate, seam keeper, copied inventory, capability restatement, near-duplicate cases) are checked here too, from the row's evidence.

## Phase 5 - Final gates and critical review

Once cleanup is ready, root inspects actual owned diffs and runs relevant repository-required checks once. Regression/unit/integration checks can share one covering invocation; do not duplicate the same suite for checklist headings. Lint, native lsp diagnostics plus project typecheck, build/parse and configured security scanner run at the relevant scope. Gates genuinely absent are N/A with reason, never invented commands. Report pre-existing failures and do not suppress warnings/errors.

Safety: functional logic and I/O/error/boundary guards preserved; types/imports valid; no API break. Behavior: outputs, side effects, exceptions, edge handling unchanged with actual proof. Quality: removals truly slop rather than deliberate patterns, no dead references or forced sharing, equivalent performance, no new abstraction/dependency. User-edited hunks intact. For user-visible behavior surfaces exercise the real surface under the common contract, not merely compile.

## Phase 6 - Owned surgical correction

If a gate fails, locate the responsible OWNED change against the pre-edit snapshot, explain the mechanism, then use edit to correct or reverse only that hunk on CURRENT contents. Never git checkout/restore/reset whole files, delete user changes, hide failures or change tests to bless altered behavior. Re-run only the failed/affected checks after a new correction. Preserve valid sibling changes. When equivalence cannot be proven, keep the original code and report the issue; no arbitrary retry count overrides persistence or authorizes a destructive rollback.

## Report and anti-patterns

Return scope/base/content identity and file list; behavior lock (existing coverage, narrow added owner tests each naming its contract, or exact reproduction; the baseline-red list or none); plan and per-file changes by category (what was removed -> replacement, why-slop/why-safe); a Tests Ledger when tests were in scope (`| Test | Mark | Keeper / reason | Proof |`, one row per D/C/F with its Phase 4b receipt); preserved/skipped guards and WHY comments; quality gate results with real counts/invocations or explicit N/A/blockers; critical safety/behavior/quality review; owned failures corrected; net lines/dependencies/files impact when measured; remaining risks/ceiling markers; CLEAN / ISSUES FIXED / REQUIRES ATTENTION.

Do not manufacture missing tests for prose, force abstractions/splits, optimize subtle algorithms, micro-benchmark unrelated hot paths, expand the repo scope, silently skip failed tools, bundle adjacent refactors, remove WHY/BDD comments, or assume PASS from a checklist. Tool failures need a materially adjusted lookup/parameters; uncertain behavior stays unchanged. Finish the bounded authorized work; deferred unrelated issues remain findings.

## Source

Ported nine categorized passes, deletion ladder, adversarial guard proof, behavior lock, critical review and report from the upstream cleanup workflow, checked 2026-10-08; the test-junk category, baseline-red list, static detector and serial mutation proofs follow upstream OMO `8bda141b` (2026-11-01) and call the bundled `programming` skill scripts. Fixed LOC enforcement, unconditional fanout, obsolete harness tools and unsafe whole-file rollback were intentionally replaced by the OMP host contract.
