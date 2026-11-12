# omp-ulw

English | [한국어](README.ko.md) | [简体中文](README.zh-CN.md)

Model-specific prompts and native ULW workflows for [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi). Model profiles own working methods; OMP supplies tool schemas, permissions and native mode capabilities. The extension also provides session-level ULW activation, planning, execution, research and specialist skills.

## Getting started

With Git, Bun and OMP installed:

```bash
git clone --recurse-submodules https://github.com/dbc-hbin/omp-ulw.git
bun ./omp-ulw/upstream/materialize-frontend-refs.mjs
omp -e ./omp-ulw/index.ts
```

Alternatively, `omp -e` accepts the package directory itself (`omp -e ./omp-ulw`), which loads the `omp.extensions` entry declared in `package.json`.

In the interactive TUI, use `/ulw <task>`, `ulw <task>`, or `/goal ulw <task>` to activate ULW and a native goal. An existing goal is not replaced. RPC clients must create a native goal separately; `/goal` is a TUI command.

Put the command or alias at the start of the input, after optional whitespace. Discussion such as `Explain ulw`, `Explain /ulw` or `What does /ulw-plan do?` stays inert. Existing paused and budget-limited goals also retain ownership.

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

Additional skills include `debugging`, `programming`, `review-work`, `eval-integrity`, `visual-qa`, `frontend`, `ast-grep`, `lsp-setup`, and `refactor`. `/eval-integrity` audits benchmark, A/B and LLM-judge claims for independent, valid measurement without modifying their inputs. Plain ULW does not automatically enable specialized workflows.

`/web-browser` loads the `browser` skill for OMP's native Eval browser: interactive pages, snapshots, frames, network evidence and captures. OMP's own `/browser` headless/visible command remains intact. Read `xd://eval/browser` first. `/ultimate-browsing` covers incomplete/blocked sources, official platform endpoints, archives and media prerequisites using `read`, `web_search` and the same browser. Host browser routing and permissions remain authoritative. A relay is optional for real Chrome sessions; public managed-browser work does not require one. No OmOWright runtime, BrowserSkill daemon, cookie extractor or crawler is installed by these skills. Their attribution files map the upstream source coverage and retain the source license.

Research and mass-research carry their source-access contracts directly, including native `/skill:ulw-research` and `/mass-ulw research` invocations without the shared ULW policy. Web collection briefs explicitly pass the applicable browser/blocked-reader references and state/evidence requirements to capable workers. Rendered references and HTML report probes use the same native browser; static sources continue to use `read`.

## Model prompts

- [`upstream/presets.js`](upstream/presets.js): generated upstream model presets and selection rules.
- [`presets.ts`](presets.ts): adapts prompts to OMP's tool and async contracts.
- [`index.ts`](index.ts): applies prompts to main and supported subagent sessions.
- [`host-guidance.ts`](host-guidance.ts): removes overlapping native behavioral defaults for selected profiles while preserving tool and permission contracts.
- [`upstream/update.mjs`](upstream/update.mjs): updates presets from a pinned upstream revision.
- [`upstream/omp-build.mjs`](upstream/omp-build.mjs): avoids duplicating sections already supplied by OMP.

For supported profiles, model-specific guidance takes precedence over generic OMP working style; duplicated native planning, rereading, delegation and verification rules are removed. Tool availability is refreshed before provider requests. Subagents retain their specialist role, permissions and completion protocol. Custom or unrecognized system templates are preserved; unsupported models retain native OMP behavior, including after fallback. Restart OMP after changing an installed extension.

The 33 presets include the dedicated Claude Fable / Mythos 5.2 profile, replacing the provisional Fable 5.5 entry. Research and mass-research handoffs attach observed evidence to claims and probes to closed leads; remembered assertions remain leads until checked. Valid recorded evidence is reused without repeating settled checks.

## Frontend reference sources

Third-party design references, UI/UX research data and designpowers reference bodies are generated from four pinned Git submodules under `upstream/skills/`. Their generated files are ignored by Git and retain the existing paths under `skills/frontend/references/`. OMP-specific guides and integration rules remain tracked.

After pulling an update, initialize the recorded source revisions and regenerate:

```bash
git submodule update --init --recursive
bun upstream/materialize-frontend-refs.mjs
```

Submodule initialization needs network access; generation and normal OMP use are local. Copy the complete materialized `skills/` tree when deploying without Git. A GitHub source archive alone omits the submodule contents and generated references.

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

The RPC smoke uses a temporary HOME/workspace and a local provider without inheriting user credentials or workflow settings. It loads the package directory and checks discovery of its shipped skills.

## History and attribution

- [Change history](CHANGELOG.md)
- Upstream sources and licenses are listed in `upstream/` and the individual skills.
