---
description: Invoke the explicit ulw-plan workflow
---

Read and follow `../skills/ulw-plan/SKILL.md` (relative to this prompt template, not the working project) in full, then its required references. Use the installed path supplied by the OMP prompt extension's workflow pointer when available. Activate ulw-plan explicitly for this request; preserve the workflow's planning/execution permission boundaries and OMP compatibility contract.

This template is planning-only. If the user's original request also includes
implementation, do not claim the request complete at the plan handoff:
after the plan is approved, hand it to `ulw-execute` in the same session when
the user has already authorized implementation, or state the exact execute
handoff still awaiting approval.

ulw-plan $ARGUMENTS
