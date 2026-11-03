---
name: ulw-plan
description: "Writes one grounded, decision-complete work plan before implementation. Use only for an explicit ulw-plan request or a plan-before-implementation request; bare ULW does not activate it."
argument-hint: "<planning-request>"
metadata:
  short-description: Ground decisions, review the plan, and hand it to ulw-execute
---

# ulw-plan

Produce one decision-complete plan at `doc/plans/<slug>.md`, with its durable draft at `doc/drafts/<slug>.md`. Planning permits read-only investigation and writes to those plan artifacts, not product changes or delegated implementation. Approval of a plan approach authorizes plan creation only. A later explicit implementation request changes the active scope; plan completion alone never does.

Current native OMP instructions own execution, delegation, role/model selection, tools, async work, verification, permissions and reporting. See the [host authority boundary](../ulw-loop/references/omp-contract.md) for precedence, not a second runtime policy.

## Ground and decide

Identify affected users or consumers, the requested ideal state (`IS-n`), and the gaps from current behavior (`GAP-n`), with reasons and cited evidence. Stay within the requested outcome: neither reduce it into an invented MVP nor add adjacent features. Record independently meaningful components, facts, decisions, scope IN/OUT and unresolved questions in the draft.

Research discoverable facts before asking. For each remaining fork, distinguish an evidence-backed ordinary default from an owner decision: a material product contract, external constraint, irreversible consequence or unapproved spend cannot be silently chosen. State the recommendation, its reason and what changes with the answer. Do not manufacture questions about constraints already settled by the request or repository.

Record `intent: clear|unclear` and follow the matching reference:

- [CLEAR](references/intent-clear.md): the outcome is known; ask only surviving owner decisions. An explicit request to be interviewed takes this path.
- [UNCLEAR](references/intent-unclear.md): research a concrete approach and surface reversible assumptions for veto; do not offload solution design to an interview.

If the distinction itself matters and remains ambiguous, ask one focused question. Use [stance calibration](references/stance-calibration.md) when presenting choices; it changes question form, not ownership or authorization.

## Approve, produce, review

Follow [artifact and plan-review details](references/full-workflow.md). Present the grounded approach and adopted assumptions before creating the final plan. Record `status: awaiting-approval` and the next action in the draft; do not treat an absent response as approval. Resume that decision rather than repeating investigation. An explicit no-plan `ulw-execute` request already authorizes its prerequisite plan; the planner returns that artifact to the execution workflow without adding another generic approval gate.

Use the existing [scaffold script](scripts/scaffold-plan.mjs), whose [templates](scripts/plan-templates.mjs) define the output schema. Preserve its section names, checkbox grammar and durable fields. Fill decisions, exact references, dependencies, acceptance criteria and evidence expectations so the executor does not need the interview context. Fill the human TL;DR last.

Adversarial **plan** review is default-on unless the user explicitly declines it. A high-accuracy/deep-review request sets `review_required: true`, including on an existing plan; answering more carefully is not a substitute. This reviews the completeness and feasibility of the plan, not a code diff. Use fresh read-only plan assessment under current OMP, not a code-review role selected for its name. Record the exact plan identity, findings and review result; apply the convergence rules in the reference.

## Deliver

Return the plan path, approach, affected-user outcome, actual implementation/final-verification task counts, important defaults and review disposition. Identify unresolved decisions honestly. Handoff is [ulw-execute](../ulw-execute/SKILL.md): `/ulw-execute <plan-name>` in this or another session, only when the user requests execution. A completed planning request ends with the reviewed plan, not implementation.
