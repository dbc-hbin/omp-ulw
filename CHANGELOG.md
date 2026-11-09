# Change history

[English](CHANGELOG.md) | [한국어](CHANGELOG.ko.md)

### 2026-11-09 Shell execution guidance

- Add common shell guidance to supported model presets according to their active tools. Sequence bash calls that depend on shell state; an overlapping call reported as a copy sees the last completed command-boundary state, and its changes do not persist in the original shell.
- Use `sh()` only when the live eval documentation exposes it. It runs short commands to completion without auto-backgrounding and has persistent shell state separate from the bash tool. Keep long jobs and watches in native async bash when available.
- Apply the same execution boundaries in the data-scientist reference. Preserve OMP-owned tool descriptions and schemas; no runtime upgrade or generated preset bundle change is included. The shell-copy behavior is in OMP 18.18.2; `sh()` is still unreleased at the inspected main revision.

Sources: [OMP overlapping shell copies](https://github.com/can1357/oh-my-pi/commit/1e2fbfd2e24f1f40a15e58dae90b7d6d2e2dac8a), [OMP eval shell helper](https://github.com/can1357/oh-my-pi/commit/d013a0a2695cd3fa2fd494b12d99bc93c30a0915).

### 2026-11-09 OMP marker compatibility and OMO skill updates

- **OMP adapter:** Accept both the stable `§` and upcoming `⁂` system section markers while requiring one consistent marker per template. Preserve custom templates, host capabilities, project rules and child assignments. Extend the existing role-replacement regression and native child smoke for both forms.
- **Chart correctness:** Aggregate near the data source, name the reporting time zone, mark unfinished buckets on their own bars, and cross-check a headline figure against a named second source. Separate browser HTML artifacts from standalone PNG delivery using OMP's actual display tools.
- **Visualize and frontend:** Scope CSS classes, measure bar geometry and legend colors in the existing four theme/viewport captures, and align end labels. Simple chart/table/diagram artifacts skip design-system, Lighthouse and research gates unless explicitly required; build, lint, accessibility, behavior and visual QA remain required.
- **Skill consistency:** Include 1920 px page-layout captures in the visual reviewer instructions; align programming refactor triggers and the frontend's single-primary-action accent rule. Document ast-grep's observed lazy `$$$` capture and keep conflicting native goals blocked with loop state owned by the lead session.
- **Comparison baselines:** OMO `dev` `adddd17004076e799c2de18ccfdee29e12525ace`; installed/latest stable OMP `18.18.1` (`24439066040e006eb08da7b204f0ac41c79d2de9`), with marker compatibility prepared for unreleased main `9f603337c893bb29530bed6ad1c267cd88519275`. Senpi `e7b059887ea797fc71ef457f5df52156e5705235` still matches all 132 renders of the 33 pinned presets, so the bundle is unchanged.

Sources: [OMO chart policy](https://github.com/code-yeongyu/oh-my-openagent/commit/0472192d549b861abfc5c1d6f1c3f12caf6c12c8), [OMO skill audit](https://github.com/code-yeongyu/oh-my-openagent/commit/e313b72ba1901544453e529ecbf9a22eec2ea4d7), [OMP marker change](https://github.com/can1357/oh-my-pi/commit/1c241750ae247d1c43678d68a2eec0c1bd853e2b), [OMP 18.18.1](https://github.com/can1357/oh-my-pi/releases/tag/v18.18.1).

### 2026-11-06 Skill references and OMP 18.17 wait contract

- **Programming references:** Fixed seven skill-relative paths in the Python and Rust references by restoring their language subdirectories, including the Python enforcement script path.
- **Native waiting:** Updated workflow instructions to allow a wait to return without a new terminal result, with multiple results/messages, or on a steering interruption. Wait only on owned work or a blocking answer owed; process available results before waiting again. Actual-id reconciliation and terminal-only dependency completion remain required.
- **OMP:** Checked installed/latest stable `18.17.0` (`75e7801e247d4e3263439d4cc08ccad60dc64bdd`). The previously deferred user-chosen effort and per-call model conflict rules are now stable and remain intact through the existing adapters; no duplicate rule or adapter change is needed.
- **Upstream comparison:** OMO `dev` `f2a520fff532b30223c9ca785bf845c11898f58a` has unchanged core prompt and agent trees. Senpi `f90d22da976a65083a699fa9fa70988d7c438095` has unchanged model/shared prompt trees; all 132 renders (33 presets, terminal/app, eval on/off) match the pinned revision, so the preset bundle remains unchanged.

Sources: [OMO reference repairs](https://github.com/code-yeongyu/oh-my-openagent/commit/ab2c2d538e650cd1182aa20854dee837de1362c1), [OMP wait delivery](https://github.com/can1357/oh-my-pi/commit/adcb8800b6409c649a622b45170192b439459c89), [OMP idle waits](https://github.com/can1357/oh-my-pi/commit/4565560e2876723f924ad988a402e1421d5b1d67), [OMP 18.17.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.17.0).

### 2026-11-04 Model preset and OMP adaptation updates

- **Presets:** Updated to Senpi `9815495b8ee5e936e48d1ba5e293eea7642a0529`. There are 33 registered presets, with no new models added. GPT-6 Astra uses root-cause diagnosis, a concise core, verification integrated into completion conditions, and new writing guidance.
- **Shared model instructions:** Pass upstream's `sharedSections: "full" | "diet"` selection to the model core and default assembly path. The nine Opus and Fable presets retain the original text from before the reduction; the other 24 apply the new shared instructions or Astra core revision. OMP continues to own the tool, project, skill, and workstation sections.
- **OMP adaptations:** Adapt the reporting format and request intent classification in both the full and reduced versions. An active `ask` is converted to OMP's blocking contract after the conditions in upstream's question rules are met. Astra uses async bash and native `wait` instead of Senpi `monitor`, both with and without `eval`. External or paid actions without approval and reversion of user changes are not permitted; DeepSeek V4.1's reduced instruction hierarchy and background waiting guidance are also aligned with the OMP contract.
- **OMO:** The model prompts and agent tree in `dev` `8c087588677b63ccb80affb46f2c485625f929b1` are unchanged from the previous `8bda141b` baseline. The existing rule that refusals are final remains in place, with no additional ports.
- **OMP:** Checked the system prompt boundaries, task instructions, parent and child sessions, and provider hook contracts against the installed version and latest stable release, `18.16.0` (`650f3a108229ee11bf68ba3377f4e8c3391cd424`). The host adaptation code remains compatible without changes. The user-chosen effort and per-call model conflict rules in unreleased main `ff0a986b` are not ported as part of the stable version's contract.

Sources: [Pinned Senpi revision](https://github.com/code-yeongyu/senpi/tree/9815495b8ee5e936e48d1ba5e293eea7642a0529), [Astra core revision](https://github.com/code-yeongyu/senpi/commit/d92272573fc01f38d8798d20391d77dc3853778a), [Restoration of the original Opus and Fable text](https://github.com/code-yeongyu/senpi/commit/71845495e8bb0362cac2f44a6a11a961be9af659), [OMO comparison baseline](https://github.com/code-yeongyu/oh-my-openagent/commit/8c087588677b63ccb80affb46f2c485625f929b1), [OMP 18.16.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.16.0).

### 2026-11-03 Reduced ULW responsibilities

- Preserved command names, aliases, templates, disable flags, goal connections, state restoration, and continuation hooks.
- Consolidated lengthy model-specific ULW policies into a single policy, leaving shared execution, delegation, and verification rules to OMP.
- Reduced planning, execution, loop, DAG, and research documents and related references to focus on each feature's deliverable and state contracts.
- Real-host verification checks command-specific pointers, session persistence and goal preservation, state-based continuation, and the independent operation of explicit native keywords.
- Specialized commands and aliases automatically connect to suitable native keywords. Explicit selections, OMP disable settings, and tool conditions are preserved, without duplicating native notifications.

### 2026-11-01 Follow-up OMO workflow skill updates

- **`ulw-plan`:** Removed the five-round review limit and switched to progress-based termination. A new round opens only when the previous round found a new blocker or closed an existing blocker; if neither occurred, report unresolved blockers and ask the user. Updated the convergence contract JSON (`max_rounds: null`, `continue_while`, `stop_on`) as well.
- **`visualize`:** Must pass the `frontend` `check-draft-guard.ts` lint before previewing.
- **`mass-ulw`:** Connect a subsequent wave that depends on the entire preceding wave through one review node (n+m dependencies instead of n×m).
- Sources: [OMO `9ddcfaac`](https://github.com/code-yeongyu/oh-my-openagent/commit/9ddcfaac8), [`bbd125e3`](https://github.com/code-yeongyu/oh-my-openagent/commit/bbd125e3c), [`634b4ed9`](https://github.com/code-yeongyu/oh-my-openagent/commit/634b4ed9c), and `mass-ulw/references/planning.md` in OMO `8bda141b`.

### 2026-11-01 OMO test cleanup and frontend check ports

- **New `programming` skill:** Imported language-specific rules, test-writing gates (`references/testing/`), and Bun scripts from OMO `8bda141b`. Script paths are relative to `$SKILL_DIR`; upstream unit tests are not included.
- **`remove-ai-slops`:** Changed category 9 to "missing or junk tests." Test declarations are marked R/F/C/D, and tests that already failed at baseline are recorded as bugs. Static checks use `check-test-junk.ts`; before deletion, the root agent proves each case individually with `mutation-proof.ts`.
- **`frontend`:** Added grounding (ideal state and gap ledger), numerical craft-floor criteria, fixed dimensions across states, and a WCAG 2.2 AA results table for each deliverable. Provides both the detect SDK (`scripts/detect/`) and source lint `check-draft-guard.ts` as post-render lint tools. detect uses `Bun.WebView`; fixed an issue in Bun 1.4.2 that prevented `--reflow` scripts from being evaluated (the trailing `;`). License notices are in sections 6 and 7 of `ATTRIBUTION.md`.
- **`visual-qa`:** Runs detect preflight checks before the reviewers and adds checklist items A13, B8, E7, F8, and F9 (with updated A3 measurement criteria). Expanded the id list in `verdict-schema.json` as well.

### 2026-11-01 OMP 18.14.2 contract updates

- **Preset update:** Pinned to Senpi `b6f8bd72ffe6c9f8e754e466fa54970c6002fbc8`. Among the terminal/app renders of the 33 presets, the only change is a full rewrite of the DeepSeek V4.1 Flash core; model selection rules remain the same.
- **Per-call `model`:** OMP 18.13+ `task` accepts exact model IDs approved by the operator for each spawn or `tasks[]` entry. Skills use those exact IDs only when the live schema advertises an approved list, and continue to omit category and OMO reasoning-tier names. `sourceSession` is exclusive to seance.
- **Visual QA:** Passes the screen brief and required content list by name to both reviewer prompts, and explicitly identifies `expectedColumns` as a primary field in TUI evidence.
- **OMP:** Based on the installed version and latest stable release, `18.14.2`. The text targeted for replacement in `host.ts` and `payload.ts` still matches in this release. The opt-in `taskFile` is disabled by default and is not documented.
- Sources: [Senpi DeepSeek V4.1 Flash changes](https://github.com/code-yeongyu/senpi/blob/b6f8bd72ffe6c9f8e754e466fa54970c6002fbc8/packages/coding-agent/src/core/extensions/builtin/prompt-preset/changes.md), [OMP task tool description](https://github.com/can1357/oh-my-pi/blob/v18.14.2/packages/coding-agent/src/prompts/tools/task.md), [OMO visual-qa](https://github.com/code-yeongyu/oh-my-openagent/blob/dev/packages/shared-skills/skills/visual-qa/SKILL.md).

### 2026-10-29 Refusals are final

- Appends OMO's refusal rule to the end of every model preset. A permission or approval denial, or a user refusal, is final for what that call was meant to do; the same result must not be reached through another tool, command, path, or host. Independent work continues; the main session asks the user about the refused step, while subagents report it to their parent as a blocker.
- Source: [OMO `192c1138` refusal rule](https://github.com/code-yeongyu/oh-my-openagent/commit/192c1138).

### 2026-10-26 Selective ports

- **Preset update:** Pinned to Senpi `a854e7acffa90aba674b9454279035a2fb7140f4`. The updater explicitly allows only the new `@earendil-works/pi-ai/utils/fable55-launch` dependency, downloads it from the same SHA as the other sources, and includes it in the bundle. Arbitrary package imports and sources outside the allowed scope remain rejected.
- **Model selection:** Kimi Code's `k3.1-pro` and K3.1 aliases select the dedicated `kimi-k3-1`; Fable/Mythos 5.5 selects `claude-fable-5-5`, which reuses the 5.1 prompt instead of the older Fable 5 prompt. At this SHA, Fable 5.5 is still being prepared for release; model defaults, providers, and permissions are unchanged.
- **Frontend:** Ordinary UI prioritizes the primary action and information hierarchy, without unconditionally requiring elaborate presentation. Reduces unnecessary decoration, repeated information, and fabricated social proof while preserving required inputs, data, copy, and user references.
- **Visual QA:** When modifying an existing UI, captures a baseline before the change when possible and compares it with the result in the same state. Distinguishes actual defects from differences in taste and does not repeat fix loops based on taste alone. Explicit reference mismatches and loss of required content are defects.
- **Research corrections:** After a correction, compares affected facts, numbers, qualifiers, and source connections against the originals again and reruns only invalidated verification. Does not introduce a separate fact-ledger execution tool or new verification commands.
- **OMP:** Retains the contracts of the installed version and latest stable release, `18.12.6`. The `/resume` background-job cancellation behavior in unreleased main is not yet documented as a guarantee of the current runtime.

Sources: [Senpi preset change history](https://github.com/code-yeongyu/senpi/blob/a854e7acffa90aba674b9454279035a2fb7140f4/packages/coding-agent/src/core/extensions/builtin/prompt-preset/changes.md), [OMO frontend and visual-qa changes](https://github.com/code-yeongyu/oh-my-openagent/commit/9d731da51c1ee9bee8a337851263ce7d2d26a1d4), [OMO research correction contract](https://github.com/code-yeongyu/oh-my-openagent/commit/637d524ba33c1631e5e7d2e245e64077dd733aa7).

### 2026-10-23 Delegated role comparison and ports

OMO specialists and execution categories are separate dimensions. The table below compares the actual role contracts in OMO `541c6029` and the installed OMP `18.12.6`; it is not a table of equivalent names or models.

| OMO role or category | OMP counterpart | Ported selection criteria and limitations |
| --- | --- | --- |
| `explore` | `scout` | Finds locations, flows, and evidence in unfamiliar code. Perform a single lookup in an already known file directly. |
| `librarian` | Partial counterpart in `scout` | Collects external evidence supported by the tools. Specify library, version, official source, and link requirements in the assignment; do not assume the entire specialist role is equivalent. |
| `quick` | Partial counterpart in `sonic` | Mechanical edits and predefined data collection following explicit steps, prohibited scope, and success criteria. A transformation can qualify even across many files if it is fully determined; even short code is excluded if it requires judgment about causes or contracts. |
| `deep-low` | Default worker (omit `agent`) | Investigation and implementation toward one goal whose decisions can be resolved through code, tests, and history. Do not replace all of `deep-low` with sonic because of OMP sonic's low-reasoning contract. |
| `deep-high` | No direct counterpart | Assign unresolved trade-offs, boundary contracts, new mechanisms, and invariant judgments to the parent or a suitable reasoning worker. A role name alone does not guarantee a model or reasoning level. |
| Design and debugging consultation from `ultrabrain` or `oracle` | No direct counterpart | The parent or a worker given an explicit reasoning assignment. When reasoning itself is the deliverable, require evidence, counterexamples, rejected alternatives, and actionable recommendations; explicitly prohibit edits for consultation. |
| `metis` / `plan-consultant`, `momus` / `plan-reviewer` | No direct counterpart | Use these roles for requirements and plan analysis only when they are actually advertised; otherwise assign a default worker with edits prohibited. Do not force substitution with OMP's diff-only `reviewer`. |
| `code-reviewer`, post-implementation review | `reviewer` | Corresponds only to review of concrete bugs introduced by a new diff. Preserve the original response format and distinguish it from implementation, execution QA, and general plan review. |
| Repository vulnerability analysis within `oracle` security concerns | Partial counterpart in `security-reviewer` | Checks vulnerability evidence leading from inputs to control or risk points. Do not assign general counterargument work, attack execution, or network investigation. |
| No direct counterpart | `seance` | Read-only consultation with the past session specified by `sourceSession` and its child records. |
| `unspecified-low/high` | No separate role | Import only the fallback judgment used when no specialist role fits. Distinguish the work scope from unresolved reasoning and select according to the actual OMP worker contract. |

Applies the same selection criteria to the default host Tool Policy and the native `task` descriptions of supported providers through the existing routing adapter in `host.ts`. If a decision remains open, return the evidence read, unresolved issues, and alternatives to the parent before making affected edits; the parent resolves it or passes the same brief and evidence to a suitable worker. Avoid both unnecessary splitting merely to use sonic and unconditional preference for a general worker. Model assignment, tool permissions, and conditions for injecting child presets are outside the scope of this change.

Sources: [OMO Senpi execution categories and selection conditions](https://github.com/code-yeongyu/oh-my-openagent/blob/541c6029eac63033fd7b76e7244be5d3f37e4024/packages/senpi-task/src/category/openai-categories.ts), [OMO distinctions between exploration, external research, and consultation](https://github.com/code-yeongyu/oh-my-openagent/blob/541c6029eac63033fd7b76e7244be5d3f37e4024/packages/omo-opencode/src/agents/dynamic-agent-core-sections.ts), [OMP default worker and sonic definitions](https://github.com/can1357/oh-my-pi/blob/v18.12.6/packages/coding-agent/src/task/agents.ts), [OMP role prompts](https://github.com/can1357/oh-my-pi/tree/v18.12.6/packages/coding-agent/src/prompts/agents).

### 2026-10-22 Selective ports

- **Separate exploration from reasoning:** Use scout to locate code and collect evidence; leave cause analysis, competing hypotheses, contract trade-offs, and invariant judgments to the parent or a suitable general worker. Read-only describes work permissions, not reasoning difficulty. Return judgments that exploration could not resolve with evidence and unresolved options so the parent can handle or reassign them. Explicitly prohibit edits by a general worker where required, without mistaking this for a read-only sandbox.
- `host.ts` adapts only the known wording that mandates exploration in the default host template's Tool Policy. `payload.ts` applies the same adaptation to native `task` descriptions in supported provider requests. Tool names, argument schemas, execution, and model assignment are unchanged; project instructions, user messages, custom system prompts, and child roles are preserved. OMO's `deep-high` and `ultrabrain` categories are not added as OMP tool arguments.
- This adaptation is limited to the currently known OMP wording. Supports the OpenAI Responses/Codex/Completions, Anthropic, Google, and Bedrock tool description paths; transports that bypass provider hooks and unsupported request formats are unchanged. A role name alone does not guarantee selection of a large model; if the required model cannot be assigned, the parent performs the reasoning or reports that limitation.
- **`wait` contract:** Incorporated OMP 18.12.4+ semantics into the shared contract: it can wait for replies to messages sent during the current run as well as work that was started, and returns immediately when there are neither running jobs nor pending replies.
- **Visual reproduction:** For requested screenshot, video, 3D, and diagram reproductions, compare the actual original with the render in the same state, at the same point in time, and in the same viewport. Select representative states from the original, without mandating a fixed frame count, a new comparison manifest, or a separate iteration count. Deliver promised reports with the demo; use an actual browser display and artifact link only when HTML is chosen.
- **Frontend scope:** Includes HTML/CSS/SVG reports, illustrations, slides, and print deliverables. Does not apply to plain-text responses.
- **Dedicated reviewers (corrected by the October 23 role contract):** Send code diff reviews to `tasks[].agent: "reviewer"` and repository vulnerability analysis to `security-reviewer`. Assign requirements, plans, and general deliverable evaluations to an actually supported specialist role or a default worker explicitly prohibited from editing. Do not bypass a suitable specialist with a general task merely because of a custom JSON format. The parent preserves the original review and converts it to the required result format, without inventing missing evidence, review coverage, approvals, or confidence.
- Sources: [OMO `d98fe7ac` reasoning routing](https://github.com/code-yeongyu/oh-my-openagent/blob/d98fe7ac1aeb2355fd6ef416310e24ff3ae0dd21/packages/senpi-task/src/category/openai-categories.ts), [Visual comparison changes](https://github.com/code-yeongyu/oh-my-openagent/blob/d98fe7ac1aeb2355fd6ef416310e24ff3ae0dd21/changes/unreleased/10812.md), [OMP wait contract](https://github.com/can1357/oh-my-pi/blob/v18.12.6/packages/coding-agent/src/prompts/tools/wait.md). The 62 terminal/app renders of the 31 presets in Senpi `71e88e1` were identical to the existing pin, so the source bundle was not updated.

### 2026-10-19 Compatibility check

- Upstream preset candidate `83d3ea5` was identical to the existing preset bundle except for the revision header, so the source pin was retained. `changed:true` from `--check` also includes header changes and therefore does not mean there is a new prompt.
- Selectively incorporates the accent-stripe design guidance from upstream `8593083`, subject to prioritizing user references and existing designs. Does not import a separate style checker or fixed audit procedure.
- OMP adaptations retain blocking `ask` and explicit approval boundaries without requiring unnecessary reapproval for requested cleanup or refactoring. Communicate outcomes, verification, and blockers instead of using a fixed progress report format; preserve user and other workers' changes during recovery.
- Astra's asynchronous guidance is first transformed at the original text block level so that general wording replacements do not invalidate the watcher adaptations for `async: true` and `timeout: 0`.
- Distinguishes OMP 18.12.x native goals from the durable state of specialized workflows. Does not mandate a new `DESIGN.md` or Lighthouse audit for ordinary UI changes; review verifies changed paths and actual risks instead of a fixed number of scenarios. The global `AGENTS.md` is unchanged.
