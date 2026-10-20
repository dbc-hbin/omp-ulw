---
name: ast-grep
description: "Searches and rewrites code by syntax shape. Use for structural searches and codemods; use grep for text, comments, strings and filenames."
---

# AST-aware code search

Use this skill when the answer depends on syntax rather than bytes: calls,
declarations, imports, control flow, or a repeatable codemod. Use `grep` for
literal text, comments, strings and filenames.

## OMP route

Read `xd://ast_grep` before the first structural query. Execute one narrow
query by writing its JSON arguments to `xd://ast_grep`:

```json
{"pat":"console.log($VALUE)","lang":"typescript","path":"src"}
```

Use one language and one AST pattern per call. `$NAME` captures one node,
`$_` matches without binding, and `$$$NAME` captures zero or more nodes.
Patterns must parse as one AST node; wrap incomplete declarations before
searching. Narrow `path` first and treat parse errors as query failures, not
evidence that no match exists.

## Rewrite discipline

Structural rewrites are higher risk than searches:

1. Search the exact pattern and inspect the matched files.
2. Preview the rewrite with the AST tool's non-applying mode.
3. Apply only after the preview matches the requested scope.
4. Read the changed files and run the narrowest owner check.

Use LSP for symbol-aware renames, references, definitions and code actions.
AST matching cannot safely replace language-server resolution.

## Boundaries

- Do not scan the repository root when a source directory or file is known.
- Do not use AST matching for regular-expression or prose searches.
- Do not infer absence from a parse error or an empty query with an ambiguous
  language.
- Do not apply a broad codemod to generated, vendored or user-owned files
  without an explicit scope.
