---
name: remove-ai-slops
description: "Removes AI-generated code smells from an explicit file set or established change diff while preserving behavior, boundaries and user edits."
argument-hint: "[file ...]"
---

# Remove AI slops - Bounded behavior-preserving cleanup

Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Activate when explicitly requested. Follow the host intent gate for an open-ended cleanup assessment/proposal before implementation; an explicit instruction to perform this bounded pass authorizes ordinary owned edits. No commits or external writes are implied.

This conditional OMP-contract loading and same-session reuse policy applies throughout this workflow, including all referenced documents, and supersedes their unconditional OMP-contract read directives. Operation-specific reference requirements remain binding.

The safety invariant is observable behavior preservation, not a green test manufactured by changing expectations. Reuse existing regression coverage and repository patterns, document risk and preserve load-bearing guards. Current caller inputs, return/exception behavior, side effects, public signatures, types and security remain contracts.

## Categories (what counts as slop)

The agent looks for these nine categories. The first three are stylistic, the next three are structural, the next two are about hidden cost, and the last is about behavior coverage.

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

### Behavior coverage
9. **Missing tests** — behavior present in changed files that is not locked by any regression test. The fix is not to remove code; add or extend the narrowest owner test only where the repository keeps tests for this behavior and a regression would otherwise pass unnoticed. EXCEPTION: a PROSE file (prompt, `SKILL.md`, rule, markdown) has no behavioral seam — do NOT add a text/word-count/phrase pin for it; that guards a diff, not behavior. Cover only a machine-consumed value (parsed field, sentinel a runtime greps, a doc JSON sample through its real validator) or leave it to review.



## Size and scope policy

Module size can signal multiple responsibilities, but there is NO mandatory 250-LOC split, recursive fixed-size checker, exception marker or new module quota. Do not add helpers/interfaces/modules solely to shrink a file or replace a type annotation. A genuine multi-responsibility extraction is a separate proposal unless explicitly in this cleanup scope. No obsolete LOC scripts are shipped.

## Phase 0 + 1 - Bind ownership and scope

Use native todo if exposed; no TodoWrite alias is assumed. Inspect the user's explicit files first. Otherwise discover the actual branch/PR target and merge-base plus relevant staged/unstaged/untracked changes; never assume main/HEAD~1 or sweep the whole repository. Record pre-existing dirty hunks and exact owned edits. Filter generated/vendored/binary/deleted artifacts from source cleanup; lockfiles change only if an explicitly authorized dependency removal requires them. Discover files with find/glob/read; literals via grep, definitions/references/callers via LSP.

Name the final files and allowed adjacent owner-test paths before changes. Reading neighboring patterns/callers is context, not authorization to edit them. Out-of-scope slop goes in findings. If ambiguous scope matters, finish read-only assessment and ask one focused question.

## Phase 2 - Behavior lock under host check policy

For each scoped source unit, identify public behavior and the existing strongest owner test/reproduction. Read covering tests and record baseline evidence already available; capture a required reproduction before editing when needed. Do not mandate repeated midflight suite runs. If tests are absent/weak, add or extend one narrow owner test only where the repo keeps tests for this behavior and regression would otherwise go unnoticed. Otherwise retain an exact before/after executable scenario. Pure prompt/markdown/rule prose receives no phrase/word-count pins; validate only machine-consumed parsed fields/sentinels through their actual consumer.

Async behavior subscribes to the exact completion event before the trigger and awaits with bounded timeout or fake clocks. Never sleeps, polling delays, retries, skips or weakened assertions to reach green. If no trustworthy behavioral baseline can be established, leave that risky unit unchanged and report why; independent proven cleanup may proceed. Do not repair a pre-existing wrong test by editing its expected result.

Boundary guards need adversarial proof and a demonstrated remaining guard within the same boundary before removing a duplicate. Missing proof means KEEP. Do not narrow catches in a way that changes documented exception handling, or remove required nullable/I/O validation based only on static plausibility.

## Phase 3 - Existence ladder and cleanup plan

For each changed unit: delete entirely only if unused/unneeded is proven -> reuse an existing helper/pattern -> use stdlib/platform/native/already-installed dependency -> simplify in place. A user-visible existing behavior is not speculative just because you would not have written it. A native replacement must preserve the actual observable contract, accessibility and supported environment.

Only surviving simplify-in-place units need all nine category checks. For a shared bugfix seam, use LSP to inspect callers and avoid repeated per-caller guards; a behavioral bugfix outside the authorized cleanup becomes a separate finding. No new abstraction/dependency or changed public signature/type erasure.

Record per file: ladder decision, candidate categories, proposed change/replacement, why safe, order, risk and skipped load-bearing code. Apply safest first: comments -> dead code -> proven redundant defense -> duplication -> complexity -> abstraction/boundary -> obvious performance equivalence -> required owner coverage. Size is a finding, not a mandatory final pass.

Intentional bounded shortcuts may use the repository's existing debt/ponytail marker naming the ceiling and upgrade trigger, only when this pass introduces or deliberately retains a known constraint. Do not inject @allow suppressions or decorate every unchanged file. Record meaningful deferred risks in the report.

## Phase 4 - Owned cleanup; optional bounded parallelism

Do one coherent small pass inline. For independent substantial units, native background workers may run in batches of at most five, with disjoint edit/test ownership. This cap is not a requirement to delegate every file. Shared helpers/callers, imports or owner tests that overlap are one lane or serialize. Children read this skill and common contract; they do not delegate further or rerun final checks midflight.

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

Omit agent for the default worker; senior-task only when listed and difficult reasoning merits it. No category/model. Replace example artifacts with observed paths. Track actual ids in a pending set; native wait({}) wakes on first settled result/message, not an entire batch. Validate the actual terminal response from task/wait or agent://; remove only terminal entries. Retain verified siblings, collect a failed terminal child before any replacement, never duplicate a live writer. Integrate owned results before opening the next batch; final report requires empty pending set.

## Phase 5 - Final gates and critical review

Once cleanup is ready, root inspects actual owned diffs and runs relevant repository-required checks once. Regression/unit/integration checks can share one covering invocation; do not duplicate the same suite for checklist headings. Lint, native lsp diagnostics plus project typecheck, build/parse and configured security scanner run at the relevant scope. Gates genuinely absent are N/A with reason, never invented commands. Report pre-existing failures and do not suppress warnings/errors.

Safety: functional logic and I/O/error/boundary guards preserved; types/imports valid; no API break. Behavior: outputs, side effects, exceptions, edge handling unchanged with actual proof. Quality: removals truly slop rather than deliberate patterns, no dead references or forced sharing, equivalent performance, no new abstraction/dependency. User-edited hunks intact. For user-visible behavior surfaces exercise the real surface under the common contract, not merely compile.

## Phase 6 - Owned surgical correction

If a gate fails, locate the responsible OWNED change against the pre-edit snapshot, explain the mechanism, then use edit to correct or reverse only that hunk on CURRENT contents. Never git checkout/restore/reset whole files, delete user changes, hide failures or change tests to bless altered behavior. Re-run only the failed/affected checks after a new correction. Preserve valid sibling changes. When equivalence cannot be proven, keep the original code and report the issue; no arbitrary retry count overrides persistence or authorizes a destructive rollback.

## Report and anti-patterns

Return scope/base/content identity and file list; behavior lock (existing coverage, narrow added owner tests or exact reproduction); plan and per-file changes by category (what was removed -> replacement, why-slop/why-safe); preserved/skipped guards and WHY comments; quality gate results with real counts/invocations or explicit N/A/blockers; critical safety/behavior/quality review; owned failures corrected; net lines/dependencies/files impact when measured; remaining risks/ceiling markers; CLEAN / ISSUES FIXED / REQUIRES ATTENTION.

Do not manufacture missing tests for prose, force abstractions/splits, optimize subtle algorithms, micro-benchmark unrelated hot paths, expand the repo scope, silently skip failed tools, bundle adjacent refactors, remove WHY/BDD comments, or assume PASS from a checklist. Tool failures need a materially adjusted lookup/parameters; uncertain behavior stays unchanged. Finish the bounded authorized work; deferred unrelated issues remain findings.

## Source

Ported nine categorized passes, deletion ladder, adversarial guard proof, behavior lock, critical review and report from installed omo 5.1.19 plugin/skills/remove-ai-slops/SKILL.md and current dev packages/shared-skills/skills/remove-ai-slops/SKILL.md, code-yeongyu/oh-my-openagent, checked 2026-10-08. The fixed LOC enforcement and its scripts, unconditional five-wide fanout, obsolete harness tools and unsafe whole-file rollback were intentionally replaced by the OMP host contract.
