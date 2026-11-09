# Designpowers Reference Manifest

Upstream project: `Owl-Listener/designpowers`

Upstream repository: `https://github.com/Owl-Listener/designpowers`

Local upstream submodule path: `upstream/skills/designpowers`.

Pinned upstream commit: `cb00757da9d554591fa78d27aa1854d60a05c4f7`

## Materialized Files

Run `bun upstream/materialize-frontend-refs.mjs` from the extension checkout after initializing its pinned submodules. It materializes the allowlisted third-party designpowers files into this reference's `vendor/` directory.

- `LICENSE` -> `vendor/LICENSE`
- `agents/*.md` allowlist -> `vendor/agents/`
- selected `skills/*/SKILL.md` allowlist -> `vendor/skills/*/reference.md`

The materialized `vendor/` directory is ignored by Git. Copy the complete generated `skills/` tree when deploying without the source submodules.

## Included Upstream Skills

- `accessible-content`
- `adaptive-interfaces`
- `cognitive-accessibility`
- `design-debate`
- `design-debt-tracker`
- `design-handoff`
- `design-md`
- `design-retrospective`
- `design-review`
- `design-system-alignment`
- `designpowers-critique`
- `heuristic-evaluation`
- `inclusive-personas`
- `inspiration-scouting`
- `interaction-design`
- `motion-choreography`
- `research-planning`
- `responsive-patterns`
- `synthetic-user-testing`
- `taste-feedback`
- `taste-report`
- `token-architecture`
- `ui-composition`
- `usability-testing`
- `verification-before-shipping`
- `voice-and-tone`
- `writing-design-plans`

## Included Upstream Agents

- `accessibility-reviewer.md`
- `content-writer.md`
- `design-builder.md`
- `design-critic.md`
- `design-lead.md`
- `design-scout.md`
- `design-strategist.md`
- `heuristic-evaluator.md`
- `inspiration-scout.md`
- `motion-designer.md`

## Excluded Upstream Skills

These upstream skills are intentionally excluded because they are bridge/state/router integration surfaces that would compete with the existing frontend/OMP workflow:

- `figma-bridge`
- `design-express`
- `design-library`
- the local orchestration contract
- `design-discovery`
- OMP recall/retain observational design episodes
- `design-state`
- `design-strategy`
- the current-project taste calibration in Lane A

## Source Of Truth

The local path map lives in `upstream/frontend-refs-manifest.mjs` and is consumed by `upstream/materialize-frontend-refs.mjs`. It follows OMO's allowlist and deterministic frontmatter normalization, preserving this port's OMP role, tool, state and link adaptations through `upstream/adapt-frontend-refs.mjs`.
