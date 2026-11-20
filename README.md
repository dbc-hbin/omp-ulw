# omp-ulw

English | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

Model-specific prompts, code mode and native ULW workflows for [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi). OMP retains control of tools, permissions and execution; this extension adapts working methods and adds planning, research and specialist skills.

## Getting started

With Git, Bun and OMP installed:

```bash
git clone --recurse-submodules https://github.com/dbc-hbin/omp-ulw.git
bun ./omp-ulw/upstream/materialize-frontend-refs.mjs
omp -e ./omp-ulw
```

In the interactive TUI, enter `/ulw <task>` or `ulw <task>` to activate ULW and a native goal. Existing goals, including paused or budget-limited ones, are preserved. RPC clients must create native goals separately.

Commands must start the input; mentions such as `Explain /ulw` do not activate them. Plain ULW does not automatically enable specialized workflows. Restart OMP after changing the installed extension.

## Workflows and skills

| Command | Purpose | Default OMP keyword |
| --- | --- | --- |
| `/ulw` | Activate ULW for the session | — |
| `/ulw-plan` | Create a reviewed plan without implementation | `ultrathink` |
| `/ulw-execute` | Execute and track a plan | `orchestrate` |
| `/ulw-loop` | Track goals, dependencies and evidence | `orchestrate` |
| `/mass-ulw` | Execute a persistent dependency graph | `workflowz` |
| `/ulw-research` | Research with sources and counterarguments | `workflowz` |

Specialized commands add their default keyword unless one is already specified, respecting OMP's keyword settings and tool requirements. For RPC, use `prompt` with the appropriate `streamingBehavior`; separate `steer` and `follow_up` requests bypass keyword processing. Direct `/skill:` calls and initial CLI text that bypass the input hook need an explicit keyword.

Other entry points:

- **Code and review:** `/debugging`, `/programming`, `/review-work`, `/ast-grep`, `/lsp-setup`, `/refactor`
- **UI and evaluation:** `/frontend`, `/visual-qa`, `/visualize`, `/data-scientist`, `/eval-integrity`
- **Browser and desktop:** `/web-browser`, `/ultimate-browsing`, `/computer-use` use OMP's native Eval APIs and permissions; OMP's `/browser` and `/computer` controls remain intact.
- **Sessions and memory:** `/coding-agent-sessions`, `/init-deep`, `/reflection`, `/memory-advisor`

See [skills/](skills/) for individual instructions. Cross-product session discovery requires Python 3.11+; OMP session history and recaps use native Eval `archive`.

## Prompts and code mode

Supported model profiles are adapted to OMP and applied independently to main and supported child sessions. Specialist roles, project instructions, permissions and completion protocols remain intact. Custom templates and unsupported models retain native behavior. Explicit investigation and planning-only requests temporarily suppress prewalk; implementation requests restore only overrides owned by this extension.

All Gemini models use the AGY (Antigravity CLI) prompt adapted for OMP and keep their native tool calls. For other models, code mode depends on request capabilities:

- Ordinary work tools are documented in native JavaScript eval for `tool.<name>(args)` calls instead of exposed as direct schemas.
- Session controls, `write`, `apply_patch`, reserved bridge names (`defined`, `undefine`), unmapped tools and forced tool choices stay direct.
- Independent reads, searches and lookups run in parallel. Code mode uses `Promise.allSettled`; mutations, approvals, waits and dependent calls remain sequential.
- An active JavaScript-capable eval and a supported provider request hook are required. Restricted agents gain no tools or permissions; unsupported requests remain unchanged with a notice.

Kiro, Cursor Agent, GitLab Duo Agent and Apple Foundation Models have request-hook limitations; code mode is not guaranteed on those paths. Catalog caches are session-local and follow live tool metadata. **Code mode is a model-facing routing policy, not an execution security boundary.**

Implementation: [model adaptation](presets.ts), [code mode](code-mode.ts), [session integration](index.ts), [native guidance](host-guidance.ts).

## Updates and tests

After pulling an update, regenerate frontend references from the pinned submodules:

```bash
git submodule update --init --recursive
bun upstream/materialize-frontend-refs.mjs
```

A GitHub source archive omits submodules and generated references. For deployment without Git, copy the complete materialized `skills/` tree. Initialization and upstream updates need network access; reference generation is local.

To update model presets:

```bash
bun upstream/update.mjs --ref main --check
bun upstream/update.mjs --ref main
```

`--ref` accepts a branch, tag or commit SHA. The updater validates before replacing generated presets and leaves local adaptations and skills untouched. `--check` returns 0 for no change, 1 for a change or error; `GITHUB_TOKEN` can help with API rate limits.

```bash
bun test
bun run typecheck
bun run test:host
```

Host checks use the installed OMP with isolated state and a scripted local provider. They verify integration and transport, not external model obedience.

## History and attribution

[Change history](CHANGELOG.md). Upstream revisions, sources and licenses are retained in [upstream/](upstream/) and each skill's attribution files.
