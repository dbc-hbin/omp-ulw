# Knowledge-base scoring and templates

Adapted from omo 5.1.19 init-deep and both native/shared upstream variants at revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe`. Read [the workflow](../SKILL.md). Measurements come from actual discovery, LSP and AST evidence, not guessed framework conventions.

## Scoring matrix

Award the listed weight once when the high threshold is met; otherwise award zero. Record the evidence for each factor. Unknown measurements remain explicitly unmeasured and are not silently asserted to be below threshold. Apply counts consistently to the directory's assigned source domain after exclusions.

| Factor | Weight | High threshold | Native evidence |
|---|---:|---|---|
| File count | 3 | >20 source files | Inventory/count |
| Subdirectory count | 2 | >5 | Glob/inventory |
| Code ratio | 2 | >70% files are source | Classified inventory |
| Unique patterns | 1 | Own config with meaningful different rules | Read config |
| Module boundary | 2 | Actual module entry such as index.ts or __init__.py | Discover and read entry |
| Symbol density | 2 | >30 symbols | LSP symbols / AST |
| Export count | 2 | >10 exports | LSP / AST |
| Reference centrality | 3 | >20 references | LSP references |

Root always gets AGENTS.md. Score >15 warrants a child file; score 8-15 warrants one only for a distinct domain; below 8 is normally covered by its parent. If unmeasured evidence could change the decision, investigate that factor or explicitly justify a domain-based choice. Do not claim exact centrality from file names or plain text search. A score is a placement aid, not permission to replace existing guidance.

For every chosen location record path, root/subtree type, score, one-line domain role and reason. Keep existing files even when the current score would not choose a new one; review obsolescence separately rather than deleting automatically.

## Writing rule

Discover existence and read existing bytes first. Existing file: surgical edit. New file: write. Preserve unrelated text, user-authored rules, and still-true facts. Correct verified stale facts minimally and cite the change rationale in the digest. A contradiction about user intent requires a lead decision, not an automated cleanup. `--create-new` changes the analysis approach, not this preservation rule.

No generic advice such as "write tests", "use meaningful names", or an obvious list of every directory. Prefer non-obvious routes, concrete commands, actual prohibitions, unusual conventions and gotchas. Child guidance contains only differences from inherited guidance. Suggested lengths are content budgets, never a reason to remove load-bearing text.

## Root template

Use relevant sections, omitting unsupported content rather than fabricating it. Target 50-150 lines for new guidance.

```markdown
# PROJECT KNOWLEDGE BASE

Generated: {absolute timestamp}
Commit: {actual short revision or non-git}
Branch: {actual branch or detached/non-git}

## OVERVIEW
{One or two sentences: purpose and actual stack.}

## STRUCTURE
{Compact directory tree with non-obvious responsibilities only.}

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
{Routes grounded in observed code.}

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|---|---|---|---|---|
{LSP/AST evidence; identify unmeasured references.}

## CONVENTIONS
{Only project-specific deviations from defaults.}

## ANTI-PATTERNS (THIS PROJECT)
{Explicit prohibitions with meaningful scope.}

## UNIQUE STYLES
{Actual project-specific patterns, if any.}

## COMMANDS
{Exact dev/test/build commands and working directories.}

## NOTES
{Non-obvious gotchas and unresolved measurement limits.}
```

CODE MAP can be omitted for a project smaller than 10 files or when neither LSP nor AST can supply useful data; state the capability gap instead of inventing symbols. Use both LSP and AST when available: symbols/references establish semantic centrality, AST imports/exports establish structural relationships.

## Child template

Target 30-80 lines for new guidance. Preserve necessary existing sections.

```markdown
# {Domain} KNOWLEDGE BASE

## OVERVIEW
{One-line distinct responsibility. Placement: score and domain reason.}

## STRUCTURE
{Only when more than five subdirectories need a non-obvious route.}

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
{Domain-specific routes.}

## CONVENTIONS
{Only differences from parent guidance.}

## ANTI-PATTERNS
{Only additional prohibitions specific to this subtree.}
```

Do not copy root commands or inherited anti-patterns into each child. A link to a relevant parent section is preferable to repeated content; verify its relative target. Preserve CLAUDE.md files as existing instructions, not another generated replacement surface unless the user explicitly asks.

## Independent review checklist

Check every declared path exists and belongs to the assigned ownership scope. Read changed docs and parent guidance; reject repeated inherited blocks, contradictory commands, generic filler, imaginary symbols, broken relative links, unsupported metrics, and lost user instructions. Read the command source (manifest/config/CI), recording commands not executed. Verify snapshot counts have measurement provenance. Record a preserved long existing file as an explained exception, not a failure that licenses deletion.
