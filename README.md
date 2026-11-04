# omp-ulw

English | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

Model-specific prompts and native ULW workflows for [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi). The extension provides session-level ULW activation, planning, execution, research, and specialist skills while leaving shared execution and tool policies to OMP.

## Getting started

With OMP installed:

```bash
git clone https://github.com/dbc-hbin/omp-ulw.git
omp -e ./omp-ulw/index.ts
```

In the interactive TUI, use `/ulw <task>`, `ulw <task>`, or `/goal ulw <task>` to activate ULW and a native goal. An existing goal is not replaced. RPC clients must create a native goal separately; `/goal` is a TUI command.

## Workflows

| Command | Purpose | Default OMP keyword |
| --- | --- | --- |
| `/ulw` | Activate ULW for the session | — |
| `/ulw-plan` | Create a reviewed, actionable plan without implementation | `ultrathink` |
| `/ulw-execute` | Execute and track a plan | `orchestrate` |
| `/ulw-loop` | Track multiple goals, dependencies, and evidence | `orchestrate` |
| `/mass-ulw` | Execute a persistent dependency graph | `workflowz` |
| `/ulw-research` | Research with sources, observations, and counterarguments | `workflowz` |

Specialized commands add their default keyword when entered through the TUI or RPC `prompt` input, unless a native keyword is already specified. They respect OMP's keyword settings and tool requirements. RPC `steer` and `follow_up` requests bypass native keyword processing; use a `prompt` request with the corresponding `streamingBehavior` instead. Direct `/skill:` calls and initial CLI text that bypass the input hook require an explicit keyword.

Additional skills include `debugging`, `programming`, `review-work`, `visual-qa`, `frontend`, `ast-grep`, `lsp-setup`, and `refactor`. Plain ULW does not automatically enable specialized workflows.

## Model prompts

- [`upstream/presets.js`](upstream/presets.js): generated upstream model presets and selection rules.
- [`presets.ts`](presets.ts): adapts prompts to OMP's tool and async contracts.
- [`index.ts`](index.ts): applies prompts to main and supported subagent sessions.
- [`upstream/update.mjs`](upstream/update.mjs): updates presets from a pinned upstream revision.
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs): avoids duplicating sections already supplied by OMP.

Subagents use their own selected model and available tools. Custom or unrecognized system templates are preserved; unsupported models retain the default OMP role. Restart OMP after changing an installed extension.

## Updating presets

Bun is required. Network access is needed for updates, not normal OMP execution.

```bash
# Pin a tag, commit SHA, or branch
bun upstream/update.mjs --ref v2026.10.13

# Check for changes without updating
bun upstream/update.mjs --ref main --check

# Update and test
bun upstream/update.mjs --ref main
bun test
```

The updater resolves the ref to a commit SHA and replaces the generated preset file only after validation. `--check` returns 0 for no change and 1 for either a change or an error. `GITHUB_TOKEN` can be used when GitHub API limits apply. Updates do not overwrite local adaptations or skills.

## Tests

```bash
bun test

# Exercise the installed OMP host with a local provider
bun tests/ulw-host-check.ts
bun tests/ulw-goal-host-check.ts
bun tests/child-preset-host-check.ts
```

## History and attribution

- [Change history](CHANGELOG.md)
- Upstream sources and licenses are listed in `upstream/` and the individual skills.
