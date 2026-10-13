# Designpowers Reference Manifest

Upstream project: `Owl-Listener/designpowers`

Upstream repository: `https://github.com/Owl-Listener/designpowers`

Historical upstream submodule path: `packages/shared-skills/upstreams/designpowers` (not present in this OMP package).

Pinned upstream commit: `cb00757da9d554591fa78d27aa1854d60a05c4f7`

## Materialized Files

The upstream build materialized third-party designpowers files into `packages/shared-skills/skills/frontend/references/designpowers/vendor/`. This OMP package ships the resulting files directly under this reference's `vendor/` directory; no materialization step is required.

- `LICENSE` -> `vendor/LICENSE`
- `agents/*.md` allowlist -> `vendor/agents/`
- selected `skills/*/SKILL.md` allowlist -> `vendor/skills/*/reference.md`

The upstream package ignored its materialized `vendor/` directory and included it through `.npmignore`. Here, `vendor/` is tracked source material, not generated output.

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

Upstream historical path map lived in `packages/shared-skills/scripts/designpowers-refs-manifest.mjs` and is consumed by `packages/shared-skills/scripts/materialize-frontend-refs.mjs`.
