---
name: ulw-plan
description: "Writes one grounded, decision-complete work plan before implementation. Use only for an explicit ulw-plan request or a plan-before-implementation request; bare ULW does not activate it."
argument-hint: "<planning-request>"
metadata:
  short-description: Ground decisions, review the plan, and hand it to ulw-execute
---

# ulw-plan

Produce one decision-complete plan. Outside native plan mode, use `doc/plans/<slug>.md` and its durable draft at `doc/drafts/<slug>.md`; approval of the approach authorizes plan creation only. In native plan mode, the lead writes the canonical `local://<slug>-plan.md` using the host's plan format, keeps planning/review state in `local://<slug>-draft.md`, and submits the completed plan through `xd://propose`. Do not create `doc/` artifacts or request plan approval through ask/chat in that mode. Children investigate and return proposed content under their read-only completion contract; the lead alone writes the artifacts. Planning never authorizes product changes or delegated implementation. Execution follows the user's request and any required native approval.

Use the [host authority boundary](../ulw-loop/references/omp-contract.md) for model guidance, native permissions and execution modes. This workflow adds planning artifacts and evidence requirements.

## Ground and decide

Identify affected users or consumers, the requested ideal state (`IS-n`), and the gaps from current behavior (`GAP-n`), with reasons and cited evidence. Stay within the requested outcome: neither reduce it into an invented MVP nor add adjacent features. Record independently meaningful components, facts, decisions, scope IN/OUT and unresolved questions in the draft.

Research discoverable facts before asking. For each remaining fork, distinguish an evidence-backed ordinary default from an owner decision: a material product contract, external constraint, irreversible consequence or unapproved spend cannot be silently chosen. State the recommendation, its reason and what changes with the answer. Do not manufacture questions about constraints already settled by the request or repository.

For external evidence, use `web_search` for discovery and `read` for known static sources. Read `skill://browser` when the fact requires rendering, interaction or an authorized account view; read `skill://ultimate-browsing` for blocked/incomplete sources, archives or platform-specific reading. These conditional reads also apply on direct native skill activation; they do not select an execution workflow.

When delegating such evidence gathering, include the required skill/reference paths in the child's brief, its exact source question, allowed reads/actions, required browser capability and authorized public/account state, ownership of any tab, and the citations or captures to return. Parent policy and Eval handles are not inherited capability. Preserve read-only planning and native child permissions; unavailable required access remains an evidence gap.

Record `intent: clear|unclear` and follow the matching reference:

- [CLEAR](references/intent-clear.md): the outcome is known; ask only surviving owner decisions. An explicit request to be interviewed takes this path.
- [UNCLEAR](references/intent-unclear.md): research a concrete approach and surface reversible assumptions for veto; do not offload solution design to an interview.

If the distinction itself matters and remains ambiguous, ask one focused question. Use [stance calibration](references/stance-calibration.md) when presenting choices; it changes question form, not ownership or authorization.

## Approve, produce, review

Follow [artifact and plan-review details](references/full-workflow.md). Outside native plan mode, present the grounded approach and adopted assumptions before creating the final plan; record `status: awaiting-approval` and the next action in the draft. An absent response is not approval; resume the pending decision. An explicit no-plan `ulw-execute` request already authorizes its prerequisite plan without another generic approval gate. In native plan mode, write and review the canonical local plan first, then submit its slug through `xd://propose`; prerequisite planning does not bypass that approval route.

Outside native plan mode, use the existing [scaffold script](scripts/scaffold-plan.mjs), whose [templates](scripts/plan-templates.mjs) define the output schema. Preserve its section names, checkbox grammar and durable fields. In native plan mode, use the host's required format instead of the scaffold; carry the same decisions, dependencies, acceptance and review evidence in permitted sections. The executor must not need the interview context.

Adversarial **plan** review is default-on unless the user explicitly declines it. A high-accuracy/deep-review request sets `review_required: true`, including on an existing plan; answering more carefully is not a substitute. This reviews the completeness and feasibility of the plan, not a code diff. Use fresh read-only plan assessment under current OMP, not a code-review role selected for its name. Record the exact plan identity, findings and review result; apply the convergence rules in the reference.

## Deliver

Outside native plan mode, return the plan path, approach, affected-user outcome, actual implementation/final-verification task counts, important defaults and review disposition. Identify unresolved decisions honestly. Handoff is [ulw-execute](../ulw-execute/SKILL.md): `/ulw-execute <plan-name>` only when the user requests execution. In native plan mode, submit the reviewed canonical local plan through `xd://propose`; the user's execution selection owns the next step and does not itself select a durable ULW workflow. When the user already selected ulw-execute, record that ownership and the local plan URI in Context before review/proposal so a fresh execution context retains it. After native approval, that workflow accepts the exact URI and keeps progress in Boulder without changing the approved plan. Planning alone never starts implementation.
