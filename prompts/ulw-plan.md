---
description: Invoke the explicit ulw-plan workflow
---

Use `../skills/ulw-plan/SKILL.md` (relative to this template), or the extension's installed skill path. Activate ulw-plan for this request and load references only for the current planning artifact. OMP owns execution mechanics.

This template is planning-only. If the user's original request also includes
implementation, do not claim the request complete at the plan handoff:
after the plan is approved, hand it to `ulw-execute` in the same session when
the user has already authorized implementation, or state the exact execute
handoff still awaiting approval.

ulw-plan $ARGUMENTS
