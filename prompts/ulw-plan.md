---
description: Invoke the explicit ulw-plan workflow
---

Use `../skills/ulw-plan/SKILL.md` (relative to this template), or the extension's installed skill path. Activate ulw-plan for this request and load references only for the current planning artifact. In native plan mode, the lead writes the canonical local plan and submits it through `xd://propose` as that skill specifies.

This template starts with planning. If the original request also includes
implementation, preserve that outcome: in native plan mode, submit the local
plan through `xd://propose` and follow the user's execution selection. Outside
that mode, hand the approved plan to `ulw-execute` in the same session when
implementation is authorized, or state the exact pending execution decision.
If the user explicitly selected `ulw-execute`, preserve that ownership and the
canonical local URI in the plan's Context before proposal; after native approval,
handoff that exact URI to the workflow without recreating the approved plan.

ulw-plan $ARGUMENTS
