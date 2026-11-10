# ATTRIBUTION / NOTICE

This OMP extension redistributes the reference assets below under their original
licenses. Each upstream's license and required notices are reproduced below.
Modifications to the original files are noted where applicable.

These third-party references are NOT committed to this repository. Each upstream is
tracked as a pinned git submodule under `upstream/skills/<name>`. Run
`bun upstream/materialize-frontend-refs.mjs` after initializing the recorded submodules.
The generator writes the existing runtime paths in this skill's `references/` tree.
It copies file bodies verbatim except for the existing scoped OMP adaptations in
`upstream/adapt-frontend-refs.mjs`, description quoting in designpowers skill
references and suppression of Python sibling-import bytecode writes. The
`Pinned upstream commit` lines below document the corresponding Git index gitlinks.
The manifest in `upstream/frontend-refs-manifest.mjs` owns the exact output allowlist.
OMP-owned guides and integration documents remain tracked; the generated reference
bodies do not. A deployment must include the materialized `skills/` tree.

---

## 1. Open Design (brand design-system DESIGN.md references)

The brand design-system reference files under `frontend/references/design/<brand>.md`
(Apple, Stripe, Linear, Nike, BMW, Airbnb, Bugatti, Tesla, and the other named brands)
are path-mapped verbatim copies of the `design-systems/<brand>/DESIGN.md` files from the
Open Design project. They are not committed here; the build materializes them from the
pinned submodule under `upstream/skills/open-design` into
`frontend/references/design/<brand>.md` (dots in `<brand>` map to dashes for the upstream
directory name, e.g. `linear.app` -> `linear-app`).

- Source: https://github.com/nexu-io/open-design
- Pinned upstream commit: 6afe7eae156bfa29251a51fd0636649c257f7444
- Copyright 2026 Open Design contributors
- Licensed under the Apache License, Version 2.0 (the "License"); you may not use these
  files except in compliance with the License. You may obtain a copy of the License at:

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software distributed under
  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, either express or implied. See the License for the specific language governing
  permissions and limitations under the License. A full copy of the Apache-2.0 license
  text is provided in `LICENSE-Apache-2.0.txt` alongside this notice.

- **Changes (Apache-2.0 §4(b)):** the original `DESIGN.md` design-system files are
  redistributed verbatim. The only modification is path-mapping: each upstream
  `design-systems/<brand>/DESIGN.md` is renamed to `frontend/references/design/<brand>.md`
  (with dots in the brand name mapped to dashes for the upstream directory lookup). The
  file contents are byte-for-byte identical to the pinned upstream commit; no text is
  abridged, summarized, or rewritten.

- **Trademark notice:** All product names, brand names, trademarks, and registered
  trademarks referenced in these design-system files (e.g. Apple, BMW, Airbnb, Bugatti,
  Stripe, Nike, Tesla, and other named brands) are the property of their respective owners
  and are used for identification and descriptive purposes only. This project is not
  affiliated with, endorsed by, or sponsored by any of those brands. No trademark license
  is granted under the Apache License 2.0 (Section 6). Named typefaces are referenced by
  name only; no font binaries are included.

---

## 2. taste-skill (Leonxlnx) — taste and image-generation skills

The taste-skill files and image-generation skills under `frontend/references/design/`
(`taste-skill.md`, `gpt-tasteskill.md`, `minimalist-skill.md`, `brutalist-skill.md`,
`soft-skill.md`, `redesign-skill.md`, `image-to-code-skill.md`, `output-skill.md`,
`stitch-skill.md`, `imagegen-frontend-web.md`, `imagegen-frontend-mobile.md`,
`imagegen-brandkit.md`) are path-mapped copies of the per-skill `SKILL.md` files from the
taste-skill project (each `skills/<name>/SKILL.md` is renamed to
`references/design/<name>.md`; `imagegen-brandkit.md` maps from `skills/brandkit/SKILL.md`).
`stitch-design-example.md` is a path-mapped verbatim copy of `skills/stitch-skill/DESIGN.md`,
the worked example of the design-system document that the stitch skill exports.
They are not committed here; the build materializes them from the pinned submodule under
`upstream/skills/taste-skill`. Three mapped references retain this port's existing
task-scoping adaptations through `upstream/adapt-frontend-refs.mjs`; the complete
pinned bodies are retained rather than historical capture omissions.

- Source: https://github.com/Leonxlnx/taste-skill
- Official site: https://www.tasteskill.dev/
- Pinned upstream commit: b17742737e796305d829b3ad39eda3add0d79060

```
MIT License

Copyright (c) 2026 Leonxlnx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 3. UI/UX Pro Max — Design Intelligence Skill (Next Level Builder) — ui-ux-db

The search engine and dataset under `frontend/references/ui-ux-db/` (`scripts/core.py`,
`scripts/search.py`, `scripts/design_system.py`, the quick reference, and the `data/*.csv`
knowledge base) are path-mapped verbatim copies from the UI/UX Pro Max skill. They are not
committed here; the build materializes them from the pinned submodule under
`upstream/skills/ui-ux-pro-max`:
`scripts/*.py` from `src/ui-ux-pro-max/scripts/`, `data/*.csv` from
`src/ui-ux-pro-max/data/`. Dataset filenames retain the source names, including
`app-interface.csv`; this preserves the pinned search engine's own registry.
The generated quick reference comes from `src/ui-ux-pro-max/templates/base/quick-reference.md`.
The local `README.md` is an OMP integration guide, not the upstream skill entrypoint.
The former customized corpus is replaced by these pinned sources; no local delta is
applied. Python scripts only insert `sys.dont_write_bytecode = True` before their
first sibling import so normal searches do not modify the installed skill.

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Pinned upstream commit: f32d6a61cdf0bfd57404c45854583fd19ff95088
- "UI/UX Pro Max" is the upstream project's branding; no trademark rights are granted by
  the MIT license, and this distribution does not claim that name as its own.

```
MIT License

Copyright (c) 2024 Next Level Builder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 4. designpowers (Owl-Listener) — design operating-layer references

The designpowers reference corpus under `frontend/references/designpowers/vendor/` is
path-mapped from the designpowers project. It is not committed here; the build
materializes the selected files from the pinned submodule under
`upstream/skills/designpowers`. The materialized set includes the
upstream `LICENSE`, ten `agents/*.md` role-reference files, and selected
`skills/*/SKILL.md` files renamed to `vendor/skills/*/reference.md` so they remain
reference documents instead of nested skill entrypoints. Bridge/state/router integration skills are intentionally
excluded; see `frontend/references/designpowers/UPSTREAM.md` for the allowlist and
exclusion list. The generator retains this port's existing OMP role, tool, state-path
and reference-link adaptations through `upstream/adapt-frontend-refs.mjs`, then applies
the frontmatter description quoting normalization described above.

- Source: https://github.com/Owl-Listener/designpowers
- Pinned upstream commit: cb00757da9d554591fa78d27aa1854d60a05c4f7

```
MIT License

Copyright (c) 2026 MC Dean

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 5. Project-original files

`frontend/SKILL.md`, `frontend/references/design/README.md`, `_INDEX.md`, `aside.md`,
`design-system-architecture.md`, `react-dev-tooling-skill.md`,
`frontend/references/perfection/README.md`, `react-perf-tooling.md`, and
`frontend/scripts/perfection/lighthouse-audit.py` are original to this project and require
no third-party attribution. The perfection docs and script only invoke third-party tools
(react-scan, react-doctor, react-grab, playwright-lighthouse, lighthouse, chrome-launcher)
at runtime; no source from those tools is vendored, so their licenses are not carried here.

`frontend/references/design/aside.md` is a project-original synthesis from live browser
capture evidence and a local reconnaissance run following the MIT-licensed
`JCodesMore/ai-website-cloner-template` workflow; it is not copied from Aside or from the
template. Aside names, trademarks, product text, and visual assets remain the property of
their respective owners and are referenced only for descriptive design-analysis purposes.

`frontend/references/design/lazyweb.md` is a project-original, curl-only operating guide
for the Lazyweb (lazyweb.com) design-research API, written from live endpoint verification;
no Lazyweb source, documentation text, or screenshot content is vendored. Lazyweb names
remain the property of their owner, and the guide grants no license to ship, trace, or
commit reference screenshots harvested through it.

`frontend/references/design/interaction-skill.md` is a project-original, curl-only
operating guide for consulting the beui.dev animated-component registry during interaction
and motion work, written from live endpoint verification; no beui.dev source code,
documentation text, or component implementations are vendored. beui.dev names remain the
property of their owner, and the guide instructs reading component source for mechanism
extraction only, not vendoring it into references or projects.

`frontend/references/design/ambience-skill.md` is a project-original, curl-only operating
guide for consulting the react-bits (reactbits.dev) animated-component registry during hero
atmosphere, background, typographic-motion, and card-surface work, written from live endpoint
verification; no react-bits source code, documentation text, or component implementations are
vendored. react-bits is distributed under MIT plus the Commons Clause, which permits use inside
applications but forbids redistributing or porting the components themselves; the guide
therefore instructs reading component source for mechanism extraction only and never vendoring
it into references, design documents, or this repository. React Bits names remain the property
of their owner.

`frontend/references/design/clone-from-url.md` is a project-original runtime-extraction
workflow guide. Its browser + `getComputedStyle` clone approach follows the same
MIT-licensed `JCodesMore/ai-website-cloner-template` clone-website workflow that `aside.md`
cites; no source from that template is copied. It carries no third-party attribution beyond
that lineage note, and it grants no license to copy any target site's trademarks, brand
assets, or proprietary copy.

`frontend/references/design/grounding.md`, `frontend/scripts/perfection/check-draft-guard.ts`,
`check-accent-stripes.ts`, `collect-files.ts`, and the `draft-guard/` and `accent-stripes/`
modules are project-original upstream files and require no third-party attribution.

## 6. Impeccable (Paul Bakaus): craft-floor rules

`frontend/references/perfection/craft-floor.md`, the "Browser surfaces", "Type and spacing
floor" and generated-scaffold rules in `frontend/SKILL.md`, and the matching
`visual-qa/SKILL.md` checklist items (A3 measure, A13, B8, E7, F8, F9) are adapted from
`skill/reference/craft-floor.md` of the Impeccable project, rewritten in the upstream
project's words with a few short phrases kept close to the source.

- Source: https://github.com/pbakaus/impeccable
- Adapted from upstream commit: 5e745ace7e151feb2a93d360d0281fe39448b857
- Copyright 2025 Paul Bakaus
- Licensed under the Apache License, Version 2.0 (the "License"); you may not use these
  files except in compliance with the License. You may obtain a copy of the License at:

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software distributed under
  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, either express or implied. See the License for the specific language governing
  permissions and limitations under the License. A full copy of the Apache-2.0 license
  text is provided in `LICENSE-Apache-2.0.txt` alongside this notice.

- **Changes (Apache-2.0 §4(b)):** the rules were selected and rewritten. Kept: the
  browser-surface list, more space above a heading than below it, the 65-75ch body
  measure, the 6rem display cap, the -0.04em tracking floor, and the scaffold and shadow
  patterns. Added: a property per browser surface, the 1.25x type-scale step, the 1.5x
  above-versus-below heading ratio, the 2x between-versus-within group gap, the phone
  measure floor, the split into floors and route-overridable defaults, and the `/visual-qa`
  item mapping. Dropped because they conflict with this skill: blur and `backdrop-filter`
  as general motion materials, choosing one theme per product category, decorative custom
  scrollbars, a blanket bounce-easing ban, and the common-typeface ban.

## 7. frontend-detect SDK: Impeccable detector logic and a StyleGallery reflow check

`frontend/scripts/detect/` (the SDK, its rules under `rules/`, and the CLI) and
`frontend/references/perfection/detect.md` reimplement in TypeScript the rule logic of the
Impeccable detector (`crates/core`, `crates/detect`, `crates/foundation/src/registry.rs`) at
the upstream commit named in section 6. No Rust or JavaScript source is copied; the rule ids,
thresholds, exemptions and the `data-impeccable-ignore` waiver attribute follow upstream so
findings stay comparable. The license, copyright line and license text pointer in section 6
apply to this derived work as well.

- **Changes (Apache-2.0 §4(b)):** a new TypeScript implementation over a browser-captured
  page snapshot instead of upstream's Rust engine and WASM bundle; every rule description
  and fix hint is rewritten; `low-contrast` is an error rather than a warning; project
  allowlists (`allowFonts`, `allowEasings`) and design tokens are configuration rather than
  files; a `data-detect-ignore` waiver is added beside upstream's; telemetry, the hosted
  design-direction service, the edit hook, the live mode and the browser extension are not
  ported.

The `viewport-reflow` rule and the reflow pass in `detect.ts` (render at 320, 375, 768, 1024
and 1440 px, append an unbroken stress string at 320 px, report horizontal overflow) follow
the layout verification matrix and `tests/pattern-runtime.spec.mjs` of StyleGallery.

- Source: https://github.com/changeroa/StyleGallery
- Adapted from upstream commit: 0bf928f6269b1cb6cf24f04e0bf28a8ce2bbc0ff
- Code licensed under the MIT License (Copyright (c) 2026 IYEN); documentation under
  CC BY 4.0.

## OMP port modifications (2026-11-11)

The frontend browser routing, runtime, computed-style reproduction and detect reference guidance
are re-ported from OMO `42d5746e72bfcfb782db6b5182b70a3e9c55f1cc` to the native Eval browser skill.
The materialized third-party source bodies and their pinned revisions are unchanged. Public versus
authenticated state, current capabilities and actual screenshot/DOM/network evidence remain explicit;
OmOWright loaders and BrowserSkill setup are not runtime dependencies.

## OMP port modifications (2026-11-09)

The simple chart/table/diagram artifact exception in `frontend/SKILL.md` is adapted from
the [OMO chart correctness change `0472192d549b861abfc5c1d6f1c3f12caf6c12c8`](https://github.com/code-yeongyu/oh-my-openagent/commit/0472192d549b861abfc5c1d6f1c3f12caf6c12c8),
reconciled with [`frontend/SKILL.md` at pinned final revision `adddd17004076e799c2de18ccfdee29e12525ace`](https://github.com/code-yeongyu/oh-my-openagent/blob/adddd17004076e799c2de18ccfdee29e12525ace/packages/shared-skills/skills/frontend/SKILL.md).
OMP uses actual browser display and file artifacts rather than upstream inline HTML APIs.
The exception preserves applicable build rules, draft/rendered lint, accessibility,
behavior and visual QA, and does not override explicit user or project audit requirements.
No new third-party files or runtime APIs are introduced by this policy port.

The single-primary-action accent rule in `references/design/design-system-architecture.md`
follows the [OMO skill audit `e313b72ba1901544453e529ecbf9a22eec2ea4d7`](https://github.com/code-yeongyu/oh-my-openagent/commit/e313b72ba1901544453e529ecbf9a22eec2ea4d7).

## OMP port modifications (2026-11-01)

The craft-floor, grounding, detect SDK and draft-guard files are copied from OMO
`code-yeongyu/oh-my-openagent` `dev` at `8bda141bcd911337623b357b863be0da13cf4d74`
(`packages/shared-skills/skills/frontend`). Upstream unit tests, test-only fixtures, the
development parity scripts and the Python Lighthouse wrapper are not shipped. OMP adaptations:
`SKILL_DIR` resolution notes, native `task`/skill routing in place of OMO slash workflows,
and browser-tool wording in place of OMO's browser driver.

## OMP port modifications (2026-10-08)

This repository retains upstream project-original frontend references and restores omitted materialized third-party taste, brand and designpowers files from the pinned commits named above. Files with runtime routing are modified for OMP: no disabled design-family dependency, no fictional browser/provider API or agent type; local native handoff and database research replace unavailable skill routing. Native workflow/platform references and UI/UX search scripts/CSV data are copied from the installed `.agents/skills/native-ui-design` and `.agents/skills/ui-ux-pro-max` source (Next Level Builder MIT notice above), with local path/routing adaptations. The native reference provenance is preserved as historical source labels, not a dependency on those skills. Third-party role/source references are adapted to the lead-owned state and actual OMP role contracts. Their bodies are no longer claimed byte-for-byte unchanged.

`references/design/component-catalogs.md` is from the upstream shared frontend skill at revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe`; chart routing points to the local database. The upstream Python Lighthouse wrapper is omitted because it depends on a private Playwright websocket path and global npm installation; real installed project-runner audit guidance remains.
