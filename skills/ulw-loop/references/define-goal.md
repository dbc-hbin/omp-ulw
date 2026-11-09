# Define Goal

This reference defines the content of the loop's binding record; use the [responsibility boundary](omp-contract.md) for working methods and permissions.

## Binding objective

Before execution, record in `brief.md` and `goals.json`:

- The original request and concrete outcome, with literal deliverable paths or surfaces.
- Observable success criteria and the evidence that will decide each one.
- User constraints and scope bounds; distinguish repo-derived assumptions with their evidence, rationale and reversibility.
- `when_to_stop`: the exact observable completion state, not an activity such as "keep investigating".

Read existing state first. Continue matching active intent; do not silently replace a conflicting objective or overwrite completed evidence for unrelated work. Register the aggregate once, with dependency-ordered per-goal objectives inside `goals.json`; no competing native goal. Do not invent budgets or deadlines.

## Criteria before execution

Every criterion needs a stable `id`, exact `scenario`, binary `pass_condition` and literal `expected_evidence` path before work begins. The scenario names inputs and the observable result; a criterion that cannot fail is not useful. Declare `essential` explicitly when a criterion may be deferred past a non-final checkpoint. Final completion still requires it.

Keep criteria proportional to the goal. Existing LIGHT/HEAVY metadata may remain: LIGHT describes a known-pattern goal, normally one or two criteria for the deliverable and riskiest edge; HEAVY covers new boundaries or significant risk, with happy path, edge, regression and adversarial coverage. These are evidence-coverage labels, not worker or model selectors.

The evidence standard follows the deliverable: a behavior needs its actual usage result, a performance target needs a baseline and named measurement, and research needs a cited answer with source artifacts. Pick thresholds that decide acceptance, not decorative precision. Capture paths and adversarial applicability in advance; record observed results later through the [ledger contract](omp-ledger.md).

## Contract changes

Do not bend criteria retrospectively to fit implementation. Changes to objectives, dependencies or criteria require the [steering transition](full-workflow.md#dynamic-steering), with evidence and rationale. Passed evidence remains historical evidence, never a result to relabel under new wording.

A goal is complete only at its validated checkpoint. The aggregate's final gate must cover the original intent and actual user outcome, not just a successful state validator.
