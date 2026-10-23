---
name: hyperplan
description: "Optional adversarial planning with five independent perspectives, three cross-critique rounds, and a separate planner. Activate only when the user explicitly asks for hyperplan or adversarial cross-critique planning."
argument-hint: "[planning-request]"
---

# Hyperplan

Say `HYPERPLAN MODE ENABLED!` once on explicit activation. Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Read [perspectives](references/perspectives.md) and [round contracts](references/rounds.md) before dispatch.

Host and current user instructions take precedence. Merely reading this skill does not activate it. Reuse references already read; load operation-specific guidance when needed.

This is adversarial filtering, not consensus building. Attack claims ruthlessly; defend with evidence, refine when an attack lands, and concede when wrong. Hostility is directed at reasoning, not people. Simplicity, complete impact analysis, verified evidence, sound architecture, and lateral alternatives must all survive each other's objections. Never drop a perspective merely because an upstream category is unavailable.

## Exact native translation

Source: OMP-native hyperplan workflow, reconciled with the upstream development variant at revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe`.

OMP uses background `task` children, not a resident team service. `team_create`, `task_send`, `team_delete`, category routing, injected system identities, and foreground task flags are not available contracts. Perspective instructions belong in each child's `task`; use only roles listed in the current native schema, or omit `agent` for the default worker. Never pass category, subagent_type, prompt, load_skills, or run_in_background. Do not pass model for ordinary workers; `model` and `sourceSession` are only valid with the exposed `seance` agent for read-only historical consultation. A perspective name is a logical lane, not an agent id or native role.

Read the exposed task schema. Shared goal and constraints go in `context`; independent assignments go in `tasks`, with `solutionSpace` describing actual uncertainty. Include the round's required JSON receipt shape in each task and validate the terminal response against it. Do not send outputSchema or schemaMode unless exposed by the current task schema. Children start blank: include required source paths, scope, round number, and findings/attacks explicitly.

The lead is the information broker. Record every returned actual child id against perspective, round, attempt, and resolved identity. Forward bundles in the next wave's task context. Send necessary in-flight clarification only by `write` to `agent://<actual-id>`; children may relay a relevant discovery to the supplied actual lead id through the same channel. Never use `lead`, `skeptic`, or any invented team recipient as a transport address. Messages are not terminal results.

Use a fresh five-child wave for each round so its strict output contract and completion receipt are unambiguous. This preserves the three-round debate without assuming that messaging restarts a terminal child or changes its schema. Do not launch a replacement for a still-running lane.

## 0. Capture the request

Restate the original planning request, scope, constraints, and observable desired outcome. Register the workflow phases in native todo when available. Keep a lead-owned ledger containing actual ids, pending jobs, rounds, findings, attacks, defenses, unresolved questions, and attempts. Preserve existing ledger content; never share concurrent write ownership.

Planning is read-only against project code. Use a task-owned artifact location for debate evidence if needed; do not change implementation or pre-write an executable plan. Clarify a genuinely blocking scope decision with native blocking ask after finishing independent investigation.

## 1. Round 1: independent analysis

Dispatch all five perspectives together: Pragmatist Skeptic, Integration Tester, Autonomous Researcher, Architect Strategist, Creative Challenger. Omit `agent` and put each read-only perspective in its task: these rounds develop, debate and refine planning hypotheses rather than perform a separate independent review of an existing plan, code or artifact, so `reviewer` is not the selector here. Default workers serve that deliberative reasoning role; the JSON receipt format is not the routing reason. Do not substitute fictional architect/artistry roles.

For a separate assessment of an actual code diff, set `tasks[].agent = "reviewer"`; use `security-reviewer` only for repository vulnerability analysis (source-to-sink/control). Both remain mandatory for those targets: accept their native response format, and the parent retains the raw response and normalizes any needed workflow receipt using only observed verdicts, evidence and verified task identity; if either is unavailable for its target, record the capability gap rather than substituting a default worker. For plan review, plan gap analysis, deliberative or research claim verification, or an artifact assessment with no code diff, the specialist role does not cover the deliverable: omit `agent`, assign a fresh read-only default worker explicit no-edit scope and the required receipt criteria (for plans, a fresh read-only plan-review worker), and validate that ordinary report yourself. Missing review coverage remains unresolved, never fabricated PASS. Choosing a default worker for a role it actually supports is role compatibility, not a custom-JSON workaround; custom JSON never justifies bypassing reviewer on a code diff or security-reviewer on repository vulnerability analysis. This does not turn the perspective debate or planner synthesis into reviewer assignments.

Each child reads relevant project evidence and returns 3-7 stable, numbered findings, each at most three sentences. Finding ids are unique across the run, such as `skeptic-1`. Cite file:line for code, official URLs for library claims, and user statements for preferences; explicitly mark missing evidence. No member sees another's findings yet. No synthesis or executable plan.

Use the Round 1 schema in [round contracts](references/rounds.md). A child assignment specifies TASK, DELIVERABLE, SCOPE, VERIFY, and STOP WHEN. VERIFY means inspect citations and the required payload, not run unrelated builds.

## First-wake collection: every wave

Immediately record returned actual child ids in a pending set. Work independently while they run. Native `wait({})` wakes on the first settled job, message, or steering interrupt; it does not accept handles and does not guarantee the wave is complete.

At each wake reconcile auto-delivered results and returned jobs by actual id. Remove only terminal children; retain unfinished siblings, record failed/cancelled jobs, and validate the requested receipt from the actual terminal response or full `agent://<actual-id>` payload. Use structured fields only when actually returned. A preview, `resultText`, message, or still-running snapshot is not completion. Keep waiting only when the next step needs a pending result. Advance only when the wave's pending set is empty and all five required payloads are valid.

Validate perspective/round identity, stable ids, complete required coverage, and evidence independently. An invalid output is a failed contract. Retain verified siblings; replace only a terminal failed lane with its exact failure context and bind the new actual id to the same logical lane. Do not treat silence or elapsed time as failure, poll repeatedly, or sleep. If native delegation is unavailable, use the lead's single-agent analysis only as an explicitly labeled fallback: skip the five-lane round mechanics, do not claim five independent perspectives, cross-perspective attacks, or a complete hyperplan receipt, and produce only a reduced analysis subject to the normal planning approval gate. Preserve the missing-capability gate and ask the user whether to accept that reduced analysis or stop. Each logical lane gets at most one replacement attempt; after that, record the failure and surface the blocked gap for explicit user-directed recovery rather than retrying indefinitely.

## 2. Round 2: cross-attack

Bundle all Round 1 findings with their stable ids and citations. Give the same bundle to all five fresh children, preserving each perspective. Every child reviews every finding from each of the other four perspectives, never its own. Return one `ATTACK` or `STANDS` judgment per target finding, with concrete evidence/reasoning and at most three sentences. A strong finding earns `STANDS` with a reason; empty flattery does not count.

Collect the whole wave using the pending-set procedure. Check target ids exist, no self-attacks appear, and every other perspective/finding is covered. The lead must not soften attacks when relaying them or synthesize early.

## 3. Round 3: defend, refine, or concede

Group attacks by original finding. Give each perspective only its own original findings and every judgment against them, with attacker provenance. Each fresh child returns one response per original finding:

- `DEFEND`: rebut the attacks with specific evidence.
- `REFINE`: state a stronger claim and explain what changed.
- `CONCEDE`: acknowledge defeat; any surviving fragment must be a separately supported refined claim, not a hidden resurrection.

Each explanation is at most three sentences. Pride is not evidence. Collect and validate all five replies before distillation. Track unanswered attacks as unresolved rather than counting a defense as automatically successful.

## 4. Lead distillation, not plan writing

Keep uncontested findings, successfully evidenced defenses, and refinements that address the attack. Drop conceded or unsupported claims. The lead independently judges the defense; a self-declared `DEFEND` is not proof. Preserve unresolved disagreement as a user-input gate.

Create an insight bundle with these sections:

1. Original User Request, verbatim.
2. Hard Constraints: invariant, original finding id, why it survived.
3. Decisions: proposal, attacks, defense/refinement, reasoning trail.
4. Risks & Mitigations: each mitigation tied to evidence and finding ids.
5. Open Questions: contention and why evidence did not resolve it.
6. Adversarial Provenance: surviving count per perspective and destroyed/conceded count.

Do not turn the bundle into sequenced implementation tasks. It is planner input, not the final plan.

## 5. Blocking approval and mandatory planner handoff

Present the surviving choices and unresolved gates. Use native blocking ask for the explicit decision to create the formal plan. An absent, dismissed, timed-out, empty, or unavailable answer is **not approval**. Keep `status: awaiting-approval`, create no plan, and await an explicit decision in chat if ask is unavailable. A no answer ends at the insight bundle. Never infer permission from a tool's suggestion to proceed.

After explicit approval, dispatch a separate planner child, not a debate member. Include the approval decision, complete insight bundle, [ulw-plan](../ulw-plan/SKILL.md) path and instructions to read it, and the approved output path. Use a listed suitable role or omit `agent`; do not invent a planner role. Apply the planner schema in the round contracts with strict mode. The main lead handles any blocking questions the child returns; a child cannot approve its own plan.

The planner owns structure, sequencing, dependencies, parallelization, and task-specific success criteria. Every hard constraint is binding, every mitigation appears in the relevant task, and every unresolved question gates its descendants. Do not re-explore settled evidence unless a contradiction requires it. Planning approval authorizes the formal plan only, not implementation, commits, PRs, deployment, or destructive commands.

Collect its actual id with the same first-wake procedure. Verify the plan covers every surviving constraint and gate, and read the actual artifact before delivery. If the child returns questions, relay them faithfully and resolve them before accepting the plan. Do not present an invalid draft as complete.

## 6. Delivery and cleanup

Present the validated planner output with provenance: five perspectives, three rounds, separately formalized through ulw-plan. Preserve the planner's content; repair contract failures through the owning planner rather than silently rewriting its decisions.

Finish only when all children are terminal, the pending set is empty, the approved artifact is read back, and unresolved questions are either represented as explicit gates or answered. Native finite children need no team deletion. If any child is still active, use only the documented cancellation route when cancellation is necessary and collect its terminal receipt. Do not invent teardown APIs or start a resident process. A blocked capability or exhausted replacement attempt remains visible as blocked; recover only from an explicit user direction that supplies the missing capability, scope, or decision.
