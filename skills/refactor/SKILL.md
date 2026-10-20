---
name: refactor
description: "Guides safe refactoring and cleanup with OMP-native symbol, AST and test verification."
---

# Safe refactoring

Use this skill when the user asks to refactor, simplify, extract or
restructure code. Preserve observable behavior, project boundaries and
unrelated user changes.

## Scope first

Identify the exact files or symbols, callers, tests and public contracts
before editing. Use `read` for the implementation and its owner tests. Use
`xd://lsp` for definitions, references, implementations and diagnostics when
the language server is available. Use `xd://ast_grep` for structural patterns
and codemods; use `grep` only for literal references.

Do not widen a cleanup into a new abstraction, dependency, compatibility
layer or unrelated bug fix. If the requested outcome is clear, proceed
without an unnecessary confirmation step. Ask only when two materially
different scopes or behaviors remain unresolved.

## Change ladder

Choose the smallest rung that solves the request:

1. Delete proven dead code or stale routing.
2. Reuse an existing helper or project pattern.
3. Simplify the logic in place.
4. Extract a unit only when it has a real boundary or a second meaningful
   caller.
5. Introduce a new abstraction only when the current contract requires
   multiple implementations.

Keep boundary validation, security checks, error handling, public signatures
and behavior that is load-bearing. Do not remove a guard merely because it
looks repetitive.

## Safe execution

1. Establish a baseline with the narrowest relevant test or executable
   scenario when behavior is changing.
2. Map callers and references before renaming or moving symbols.
3. Prefer LSP rename and code actions for symbol-aware changes.
4. Preview AST rewrites before applying them.
5. Make one coherent edit, then read the complete affected files.
6. Run the owner test and a real smoke path for user-visible behavior.

Tests must assert behavior or machine-consumed structure, not prompt prose,
comments or exact wording. Do not add a test solely to pin a cleanup phrase.
Do not weaken, skip or delete a failing test.

## Stop conditions

Stop when the requested behavior is complete, all affected callers and
references are migrated, the relevant checks pass, and no OMP-incompatible
routing remains in the changed path. Report pre-existing failures separately
instead of changing scope to hide them.
