---
name: ulw-plan
description: "ulw-plan UNCLEAR intent: research a concrete approach, expose assumptions and review the resulting plan."
metadata:
  short-description: Fuzzy outcome, evidence-backed proposals
---

# UNCLEAR intent

Use this path when the outcome itself needs formulation, not merely when the request is long or implementation details are missing. Follow [ulw-plan](../SKILL.md) for scope and [artifact/review details](full-workflow.md) for the deliverable. An explicit request to be interviewed uses CLEAR instead.

## Derive an approach

Research current behavior, consumers, constraints and relevant conventions. For architecture or external-source requests, collect claims, verify them, design alternatives, challenge them and synthesize the grounded approach. These activities do not require a separate orchestration service or fixed worker roster.

Define the requested ideal-state and gap rows, then the components that can succeed or fail independently. Unclear intent is neither permission to reduce the request nor to add adjacent features. For example, "make auth better" needs evidence of existing auth problems; it does not by itself authorize adding MFA.

Adopt evidence-backed reversible defaults and record each in `## Open assumptions (announced defaults)` as `assumption | adopted default | rationale | reversible?`. Surface material assumptions for veto rather than presenting them as user decisions. Research cannot supply a missing objective, material owner choice or authorization: ask the focused question that blocks the plan instead of inventing an answer.

When the user cannot articulate the outcome, offer two or three concrete approaches for critique rather than a blank-page interview. Use [stance calibration](stance-calibration.md) to choose the presentation; current explicit preferences win.

## Challenge defaults and deliver

Gap analysis must challenge the most consequential assumption: is its constraint real, and does the proposal introduce complexity unsupported by the request? Reframing may simplify the approach but must not silently defer requested behavior. Record evidence and reversibility for changed defaults.

Outside native plan mode, present the derived approach and defaults before final-plan creation; the gate remains planning-only, and explicit no-plan ulw-execute already authorizes its prerequisite plan. In native plan mode, record these decisions in the canonical local plan and use `xd://propose` after completion and review, as specified in [full-workflow](full-workflow.md). Surface defaults in the plan's permitted decisions/assumptions section.

Adversarial plan review is default-on unless explicitly declined; it is especially important when defaults substituted for an interview. Apply the identity binding, blocker eligibility and progress-based convergence in [full-workflow](full-workflow.md). A trivial task does not cancel an explicitly requested review. Return the complete plan and review disposition without beginning implementation.
