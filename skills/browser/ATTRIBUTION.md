# Source and coverage

This is an OMP-native rewrite of the browser workflow documentation in
[OMO at 42d5746e72bfcfb782db6b5182b70a3e9c55f1cc](https://github.com/code-yeongyu/oh-my-openagent/tree/42d5746e72bfcfb782db6b5182b70a3e9c55f1cc/packages/shared-skills/skills/browser),
checked against OMP 18.18.6 and the live `xd://eval/browser` contract. It ports instructions, not the
OmOWright or BrowserSkill runtime. No library, browser binary, extension payload or loader is bundled.

MODIFIED COPY: workflow text and examples are rewritten for native OMP. The source repository's
Sustainable Use License terms are preserved in [LICENSE.md](LICENSE.md); notices for systems named
by the original documentation do not replace the license for that documentation.

| Upstream source | Native destination and treatment |
| --- | --- |
| `SKILL.md` | `SKILL.md`: state-based connection choice, fresh observe/action/verification, actual lifecycle and authorization |
| `references/commands.md` | `references/commands.md`: OMP helper signatures, IDs/refs, run/evaluate and backend restrictions |
| `references/install.md` | `references/lifecycle.md`: optional native relay installation, explicit approval, no hidden profile/security mutations |
| `references/remote.md` | `references/lifecycle.md`: actual configured CDP/relay transports and secure remote prerequisites; no BrowserSkill pairing claims |
| `references/owned-engine/README.md` | Skill and lifecycle references: managed/shared versus explicitly isolated state, no assumed user login |
| `references/owned-engine/ladder.md` | `references/interaction.md`: semantic targeting, diagnosed overlays, screenshot coordinates, bounded recovery and challenges |
| `references/owned-engine/network.md` | `references/network.md`: passive JSON, response-before-trigger, bounded scroll, routes, HAR, trace and sensitive state |
| `references/owned-engine/frames-and-humans.md` | Interaction and human-handoff references: scoped frames, dialogs, emulation, human decisions and shared-tab limits |
| `references/recipes/1password.md` | Native target adoption, tab-bound state preservation and narrowly authorized reading |
| `scripts/*`, runtime staging and package ignores | Intentionally omitted: loaders, doctor/onboarding, built-in OmO grant adapter and BrowserSkill daemon are not OMP interfaces |

The browser-related sections of upstream `packages/prompts-core/prompts/ultrawork/{codex,default,gemini,glm,gpt}.md`
are represented by the shared native browser guidance and the existing local ULW/workflow pointers.
They do not add another model-specific execution policy. Debugging, frontend, review-work,
ulw-execute, ultrawork, ulw-loop, visual-qa and visualize retain their own deliverables while routing
page work through this skill; native desktop work keeps its installed GUI route.

## Workflow integration audit (2026-11-11)

The audit classified 69 browser-bearing instruction documents at the same OMO pin: 46 shared-skill
documents, 9 Senpi skill documents and 14 core prompt variants (27 entrypoints and 42 references).
This is the browser-integration inventory; the complete 21-reader reference map remains in
`ultimate-browsing/ATTRIBUTION.md`. Native command/skill loading was exercised with OMP 18.18.7.

| Source territory | Native integration and deliberate adaptation |
| --- | --- |
| `ulw-research` entry, collection, delivery and report references in shared/Senpi skills | Research's own source-access contract, browser/blocked-reader child briefs, rendered HTML extraction, native layout evaluation and scoped report captures; direct skill and mass research do not depend on shared ULW activation |
| `mass-ulw/references/planning.md` research composition | Explicit source/capability/state/evidence requirements in harvest, expansion and verification handoffs |
| Shared/Senpi execution, loop, debugging and review browser criteria | Native browser evidence and explicit worker references, respecting child roles and verification limits |
| Frontend clone, grounding, audit, React instrumentation and print references | Native page operations and PDF output; existing installed project audit runners retain their actual APIs; no standalone Playwright runtime, guessed port or assumed React event schema |
| Visual QA, visualization and data/dashboard evidence | Existing scoped capture contracts and source-filter/provenance checks; no compulsory full matrix for unrelated edits |
| Core `atlas/*` QA hints and `ultrawork/*` variants | Native browser/review guidance and explicit delegated briefs; no `/playwright` alias, new Atlas role or competing execution policy |
| Shared `git-master/SKILL.md` attachment instructions | Authorized ordinary GitHub attachment UI in `references/human-handoff.md`; no CSRF/cookie extraction, private upload endpoint reconstruction or automatic publishing; no new git workflow command |

Planning and hyperplan entrypoints also carry the conditional source-access contract so their
own native skill invocations and fresh perspective workers can resolve required web evidence.
Static URLs still use `read`; research's upstream browser-for-every-source rule, worker quotas and
legacy team/load-skills APIs are not copied. Browser instructions do not implicitly activate ULW.
Original snapshot/import CLI commands are not invented where the local report tools do not expose
them; observed HTML and provenance are saved through native file tools instead.

OMP has no equivalent guarantee for BrowserSkill's one-use cooperation context, prompted borrow and
human banner, OmOWright's merged cross-frame refs and step trace package, CloakBrowser's pinned
fingerprints or built-in OCR/CAPTCHA helpers. These are not represented by fake aliases. The native
references preserve their underlying state/consent/evidence goals using supported operations and
identify real capability gaps.

Native API sources, pinned to the inspected version:

- [Host/prelude facade](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/tools/browser.ts)
- [Worker methods and Puppeteer run contract](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/tools/browser/tab-worker.ts)
- [Network route/request/HAR types](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/tools/browser/network.ts)
- [Emulation options](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/tools/browser/emulation.ts)
- [Tracing options](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/tools/browser/tracing.ts)
- [Dialog policy](https://github.com/can1357/oh-my-pi/blob/v18.18.6/packages/coding-agent/src/tools/browser/dialogs.ts)

The upstream documentation credits OmOWright and Tencent BrowserSkill under MIT for the systems it
drives. This port carries no copy of either implementation and does not claim its APIs are present.
Use the original repositories for their own software and licensing, not as callable OMP interfaces.
