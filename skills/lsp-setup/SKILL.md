---
name: lsp-setup
description: "Gets language-server-backed navigation and diagnostics working for a project without inventing configuration or installation paths."
---

# LSP setup and recovery

Use this skill when symbol navigation, diagnostics or refactoring reports that
no language server is configured, or when a project needs an explicit LSP
configuration.

## OMP route

Read `xd://lsp` before acting. Use the native LSP operations rather than
shelling out to an editor plugin:

- `status` or `capabilities` to discover what the host already exposes.
- `diagnostics` for a real file or a bounded project glob.
- `definition`, `references`, `hover`, `symbols` and `implementation` for
  symbol-aware investigation.
- `rename` or `rename_file` for cross-file changes; preview with `apply: false`
  when the change is not already clear.
- `code_actions` for server-provided import fixes and refactors.
- `reload` only after a configuration or server-state change.

## Workflow

1. Identify the language from the target file and read the project guidance
   that defines its package manager and compiler.
2. Query LSP status or capabilities before proposing installation.
3. Check whether the project already has a configuration file or an installed
   server. Reuse it instead of creating a competing configuration.
4. Make the smallest project-scoped configuration change needed when the
   native server cannot resolve the project.
5. Verify with `diagnostics` on a real source file, then use the symbol
   operation that originally failed.

If the native LSP route or the required server is unavailable, report the
exact missing capability and continue with read-only text or AST investigation
where that is safe. Do not fabricate server names, install commands or
configuration schemas.

## Boundaries

- Do not install packages or modify user-level configuration without explicit
  authorization.
- Do not replace a cross-file rename with text search when LSP is available.
- Do not treat an empty result as proof of absence when the server is still
  indexing or diagnostics report a startup failure.
- Keep generated, vendored and unrelated project files outside the change.
