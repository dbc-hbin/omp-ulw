---
name: hyperplan
description: "Optional adversarial planning with five independent perspectives, three cross-critique rounds, and a separate planner. Activate only when the user explicitly asks for hyperplan or adversarial cross-critique planning."
argument-hint: "[planning-request]"
---

# Hyperplan

Say `HYPERPLAN MODE ENABLED!` once on explicit activation. Consult [the OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state details not resolved by current tool schemas and host instructions; reuse it if already read in this session. Read [perspectives](references/perspectives.md) and [round contracts](references/rounds.md) before dispatch.

Merely reading this skill does not activate it. Use the shared responsibility boundary for selected model guidance, native modes and permissions; this skill owns the debate evidence and planning handoff.

This is adversarial filtering, not consensus building. Attack claims ruthlessly; defend with evidence, refine when an attack lands, and concede when wrong. Hostility is directed at reasoning, not people. Simplicity, complete impact analysis, verified evidence, sound architecture, and lateral alternatives must all survive each other's objections. Never drop a perspective merely because an upstream category is unavailable.

## Exact native translation

Source: OMP-native hyperplan workflow, reconciled with the upstream development variant at revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe`.

Use the exposed native delegation contract; no resident team service is required. A perspective name is a logical lane, not an agent id or native role. Include its instructions and source evidence in the assignment, preserving the child's permissions and completion format.

Shared goal and constraints go in the exposed task context; each assignment includes required source paths, scope, round number, findings/attacks and receipt fields. The round schemas describe the lead's records. Request matching JSON only when compatible with the child's native completion format; otherwise preserve the raw response and normalize supported fields in the lead.

The lead is the information broker. Record every returned actual child id against perspective, round, attempt, and resolved identity. Forward bundles in the next wave's task context. Send necessary in-flight clarification only by `write` to `agent://<actual-id>`; children may relay a relevant discovery to the supplied actual lead id through the same channel. Never use `lead`, `skeptic`, or any invented team recipient as a transport address. Messages are not terminal results.

Use a fresh five-child wave for each round so its strict output contract and completion receipt are unambiguous. This preserves the three-round debate without assuming that messaging restarts a terminal child or changes its schema. Do not launch a replacement for a still-running lane.

## 0. Capture the request

Record the original planning request, scope, constraints and observable desired outcome in a lead-owned ledger with actual ids, pending jobs, rounds, findings, attacks, defenses, unresolved questions and attempts. Preserve existing ledger content; never share concurrent write ownership.

Planning is read-only against project code. In native plan mode, the lead keeps debate state in permitted session-local artifacts and writes the canonical `local://<slug>-plan.md`; children only return findings or proposed content. Outside that mode, use a task-owned artifact location for debate evidence and resolve the planning decision in Step 5 before final-plan creation. Do not change implementation. Requirements questions follow the current host's interaction contract.

## 1. Round 1: independent analysis

Dispatch all five perspectives together: Pragmatist Skeptic, Integration Tester, Autonomous Researcher, Architect Strategist, Creative Challenger. Omit `agent` and put each read-only perspective in its task: these rounds develop, debate and refine planning hypotheses rather than perform a separate independent review of an existing plan, code or artifact, so `reviewer` is not the selector here. Default workers serve that deliberative reasoning role; the JSON receipt format is not the routing reason. Do not substitute fictional architect/artistry roles.

Each child reads relevant project evidence and returns 3-7 stable, numbered findings, each at most three sentences. Finding ids are unique across the run, such as `skeptic-1`. Cite file:line for code, official URLs for library claims, and user statements for preferences; explicitly mark missing evidence. No member sees another's findings yet. No synthesis or executable plan.

Use the Round 1 schema in [round contracts](references/rounds.md). A child assignment specifies TASK, DELIVERABLE, SCOPE, VERIFY, and STOP WHEN. VERIFY means inspect citations and the required payload, not run unrelated builds.

## Pending-set collection: every wave

Record actual child ids in a lead-owned pending set and reconcile terminal results using the exposed completion contract. A message or running snapshot is not a terminal receipt.

Reconcile auto-delivered results and returned jobs by actual id. Remove only terminal children; retain unfinished siblings, record failed/cancelled jobs, and validate the requested receipt from the actual terminal response or full `agent://<actual-id>` payload. Use structured fields only when actually returned. A preview, `resultText`, message, or still-running snapshot is not completion. Advance only when the wave's pending set is empty and all five required payloads are valid.

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

## 5. Planning decision and separate planner handoff

Outside native plan mode, present the surviving choices and unresolved gates for the explicit decision to create the formal plan. An absent, dismissed, timed-out, empty or unavailable answer is not approval. Keep `status: awaiting-approval` and the insight bundle until the decision is resolved. Explicit prerequisite planning already authorized by an enclosing execution request needs no additional generic gate. In native plan mode, do not ask permission to create the plan or request plan approval through ask/chat: obtain the planner's proposed content, let the lead write and review the canonical local plan, then submit its slug through `xd://propose`.

Dispatch a separate planner child, not a debate member, after the applicable planning decision above. Include that decision or native plan-mode status, the complete insight bundle, [ulw-plan](../ulw-plan/SKILL.md) path and canonical output identity. In native plan mode or any read-only child assignment, require proposed complete plan text in the native response and no artifact writes; the lead persists it. Otherwise, explicitly assign only permitted plan-artifact writes. Normalize the planner receipt from its actual response as the round contracts specify. The lead handles blocking questions; a child cannot approve its own plan.

The planner owns structure, sequencing, dependencies and task-specific success criteria. Every hard constraint is binding, every mitigation appears in the relevant task, and every unresolved question gates its descendants. Do not re-explore settled evidence unless a contradiction requires it. Outside native plan mode, the approach decision authorizes formal plan creation only. Native execution follows the user's propose selection; external writes, commits, deployment and destructive actions still require their applicable authorization.

Collect its actual id with the same pending-set procedure. Verify the plan covers every surviving constraint and gate against the canonical content, reusing intact authoritative inline content when supplied. In native plan mode the lead writes the accepted proposed text before review and propose submission. If the child returns questions, resolve them before accepting the plan. Do not present an invalid draft as complete.

## 6. Delivery and cleanup

Present the validated planner output with provenance: five perspectives, three rounds, separately formalized through ulw-plan. Preserve the planner's decisions; return reasoning gaps to the planner. The lead remains the artifact writer when child permissions require it.

Finish only when all children are terminal, the pending set is empty, canonical plan content is established, and unresolved questions are either represented as explicit gates or answered. Native plan-mode handoff uses `xd://propose`. Native finite children need no team deletion; cancellation uses the documented host route and terminal receipt. A blocked capability or exhausted replacement attempt remains visible as blocked; recover only from an explicit user direction that supplies the missing capability, scope, or decision.
