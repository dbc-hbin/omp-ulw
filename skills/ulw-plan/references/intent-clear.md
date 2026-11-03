---
name: ulw-plan
description: "ulw-plan CLEAR intent: ground the known outcome and ask only unresolved owner decisions."
metadata:
  short-description: Known outcome, grounded owner choices
---

# CLEAR intent

Use this path when the desired outcome is known, or the user explicitly requests an interview. Follow [ulw-plan](../SKILL.md) for scope and [artifact/review details](full-workflow.md) for the durable deliverable.

## Resolve the real forks

Establish the affected user, requested ideal state, current gaps and independently meaningful components. Record them in the draft with cited findings; component count follows the work rather than a quota. A short request can still contain a consequential owner decision.

Apply two filters to each candidate question:

1. Can the repository, system or primary documentation answer it? Investigate and cite the answer.
2. Does the accepted outcome plus evidence settle it as an ordinary reversible default? Record the choice and reason rather than asking again.

Material product choices and external constraints that only the owner can set survive these filters. If the user requested an interview, surface surviving preferences instead of silently adopting defaults. Ask why the choice matters to the plan: what evidence left it open, the recommended option and its consequence. Do not ask users to supply technical facts the project contains. Use [stance calibration](stance-calibration.md) for batching and reply interpretation.

For example, a specified login rate limit may reuse an existing shared limiter without another question about storage. A change to the public over-limit response remains a client-contract decision unless the request or existing contract already settles it. Illustrative paths are not repository evidence.

## Clearance and approval

The draft must settle objective, scope IN/OUT, approach, dependencies, acceptance and relevant constraints (such as budget, stack, scale or audience). Explore or ask only where the actual request leaves a material gap; do not turn this list into a stock interview.

Present the grounded approach, adopted defaults and any remaining owner decisions. Obtain the planning decision described in [full-workflow](full-workflow.md), then produce one decision-complete plan. Run gap analysis and default-on adversarial plan review unless explicitly declined; an explicit high-accuracy request requires review, not another offer. Deliver the plan and review disposition, then hand off to ulw-execute only on an execution request.
