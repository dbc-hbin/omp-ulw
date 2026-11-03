---
name: ulw-plan
description: "ulw-plan artifact format, durable planning state, adversarial plan review and execution handoff."
metadata:
  short-description: Decision-complete plan and review contracts
---

# Plan artifacts and review

This reference extends [ulw-plan](../SKILL.md), not native OMP execution policy. Use the [CLEAR](intent-clear.md) or [UNCLEAR](intent-unclear.md) path to resolve decisions, and [stance calibration](stance-calibration.md) to present them.

## Grounded approach and approval

The draft records affected users, ideal-state properties (`IS-n`), current gaps (`GAP-n`), independently meaningful components, cited findings, decisions with reasons, scope IN/OUT and open questions. Each gap belongs to the requested outcome; evidence does not authorize adjacent features. Investigate technical facts and dependencies, then identify genuine owner decisions rather than asking the user to rediscover the repository.

For architecture or external-source planning, preserve the reasoning sequence: collect claims, verify them against primary evidence, design alternatives and dependencies, challenge them adversarially, then synthesize one plan. These are planning activities, not fixed worker counts or orchestration APIs. Include design consultation when an unresolved boundary, interface or algorithm needs it. Unverified external claims remain assumptions or risks, not instructions.

Before final-plan creation, present the affected-user outcome, current gaps, approach, evidence and assumptions. Record `status: awaiting-approval`, the approach and `pending-action` in the draft. A substantive scope change revises the brief; an unanswered gate remains pending. Approval authorizes writing the plan, not implementation. Explicit `ulw-execute` with no selectable plan already authorizes this prerequisite artifact: return it to that workflow without another generic approval question.

## Scaffold and resume

Use [scaffold-plan.mjs](../scripts/scaffold-plan.mjs); [plan-templates.mjs](../scripts/plan-templates.mjs) owns the emitted text. From the target workspace:

```text
node "<skill-root>/scripts/scaffold-plan.mjs" <slug> --stdout --clear --draft-only --review-required
```

Choose `--clear` or `--unclear`; include `--review-required` unless review was explicitly declined. After approval, omit `--draft-only` to obtain the plan skeleton. `bun` is also accepted. A slug matches `^[a-z0-9][a-z0-9-]{0,79}$`.

`--stdout` emits JSON without filesystem writes:

```json
{
  "draft": { "path": "doc/drafts/<slug>.md", "content": "<draft Markdown>" },
  "plan": { "path": "doc/plans/<slug>.md", "content": "<plan Markdown>" }
}
```

`--draft-only` omits `plan`. Read existing artifacts first; persist emitted content only for missing artifacts, then fill the owned draft/plan. `--stdout` itself neither detects nor preserves existing content. Standalone file-output mode preserves recognizable existing artifacts on a plain rerun; `--reset` requests replacement and `--reset --force` can discard edits. Neither is a resume procedure. Its path guards restrict output to Markdown under `doc/` and reject symlink paths. Planner permissions remain narrower: only this request's draft and plan, no implementation.

Resume from the durable draft, not an inferred conversation state. Keep its emitted ledgers and frontmatter keys. A review-required draft starts with:

```yaml
slug: <slug>
status: drafting
intent: clear
review_required: true
plan_path: doc/plans/<slug>.md
plan_sha256: null
review_round_id: null
review_round_limit: null
pending-action: write and review doc/plans/<slug>.md
review:
  plan_reviewer:
    status: pending
    workspace_root: null
    runtime_home: null
    target: doc/plans/<slug>.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
approach: <approach to plan>
```

The non-review variant emits `review_required: false` and `pending-action: write doc/plans/<slug>.md` instead of the review block. Both variants retain `## Approval gate` with its own status. If review is requested later, add the complete review state before starting it. `review_round_limit: null` means progress-based convergence, not a five-round cap; normalize a stale value of `5` when resuming old drafts.

## Decision-complete plan format

Keep these script-produced headers, in this order:

```text
# <slug> - Work Plan
## TL;DR (For humans)
## Scope
## Verification strategy
## Execution strategy
## Todos
## Final verification wave
## Commit strategy
## Success criteria
```

- **TL;DR:** fill last from the finished plan. Explain who benefits, what changes, why, exclusions, risk and the few decisions worth checking. Keep technical paths and task machinery in the detailed sections. Effort is one of `Quick | Short | Medium | Large | XL`, not a duration estimate.
- **Scope:** begin with `### Affected user and ideal state`, including the affected consumer and `IS-n`/`GAP-n` rows with reasons. Follow with Must have and Must NOT have; exclusions prevent scope creep, not incomplete delivery.
- **Verification strategy:** record project-specific tests, real-surface acceptance and evidence expectations for the future executor. The planner specifies checks, not runs implementation QA. Use the repository's test strategy; a planning gate need not ask again when it is already settled.
- **Execution strategy:** record genuine dependencies, grouping and the matrix `Todo | Depends on | Blocks | Can parallelize with`. Describe the work's dependencies, not native dispatch syntax or model choices.
- **Todos:** each item states the exact change/non-goals, gap closed, dependencies, exhaustive path/contract references, observable acceptance, relevant success/failure scenarios and evidence destination. The executor has no interview context. Keep implementation and its tests together where they are one deliverable.
- **Final verification wave:** retain the four emitted rows `F1. Plan compliance audit`, `F2. Code quality review`, `F3. Real manual QA`, `F4. Ideal-state fidelity`. These are future execution checks; their execution follows current OMP. Plan review below is a different activity.
- **Commit strategy:** record only the delivery authorization and constraints actually supplied; the section is not permission to commit or a second commit policy.
- **Success criteria:** map every `IS` row to `Delivering todo(s) | Proving QA scenario | Evidence`. Every requested gap must have a delivering task, and every ideal-state property must be provable.

Implementation checkboxes are column-zero `- [ ] N. <title>` with positive decimal `N`, inside `## Todos`. Final rows are column-zero `- [ ] F<number>. <title>` inside `## Final verification wave`. Headings and ordinary bullets are not executable tasks. Preserve nested `Recommended task executor category:` for existing plan consumers as task difficulty/specialty metadata; it does not select a native role or model. Retain the per-task `Commit:` field as a record of actual authorization, not a mandate.

Append task batches within the Todos region without replacing script-produced headers or existing tasks. Before handoff, check the actual row grammar, header order, counts, references, dependency matrix and complete `GAP -> todo -> IS -> proof` mapping. A plan with unresolved implementation decisions is not decision-complete.

## Gap analysis and adversarial PLAN review

Before final review, obtain read-only gap analysis of the proposed plan: missing affected users, contradictions, unsupported assumptions, uncovered gaps, missing acceptance, scope creep and material external constraints. Fold grounded findings into the plan; an unsafe assumption becomes an owner question, not an invented default. On the UNCLEAR path also challenge the most consequential adopted assumption for unnecessary complexity without shrinking the request.

High-accuracy review is default-on unless explicitly declined. An explicit high-accuracy/deep-review request, including after plan creation, requires actual review of the current complete plan. It does not change CLEAR/UNCLEAR routing. A plan review assesses whether the documented work can deliver the accepted outcome; code-diff review assesses implemented changes. Do not substitute the latter for the former.

Each round uses one fresh read-only plan assessment. Supply the literal workspace root, exact `doc/plans/<validated-slug>.md`, all-byte SHA-256, round identifier, accepted decisions, expected artifacts and blocker criteria below. The assessment reads that exact complete plan, verifies its identity and returns verdict (`approved`, `changes_requested` or `inconclusive`), evidence, coverage, findings and blocker closures. It must not search for a convenient replacement plan or implement fixes. Missing content, identity or coverage is inconclusive.

Bind the result to the actual assessment identity and unchanged plan. Record real values only; `runtime_home` or other unavailable metadata stays null, not invented. Freeze plan edits during the round. A changed digest invalidates approval; fixes require a fresh round. Validate the literal path and workspace containment, including symlink drift, rather than claiming descriptor-relative no-follow guarantees from ordinary file tools.

### Durable review lifecycle

The draft owns this state; these are record transitions, not orchestration or CAS APIs:

| Transition | Required record |
| --- | --- |
| Review requested | `review_required: true`, exact `plan_path`/target, pending action to write and review; digest/round/launch/session initially null |
| Round initialized | fresh `review_round_id`, complete `plan_sha256`, canonical workspace, target, `round_status: active`, pending action to review |
| `pending -> launching` | fresh `launch_id`, bound to workspace, target, round and digest |
| `launching -> in_flight` | actual returned assessment handle in `session` |
| `in_flight -> approved|changes_requested|inconclusive` | one terminal result matching workspace, target, launch, round, digest and actual handle; current plan digest still matches |
| Interrupted launch with no receipt | mark the round inconclusive with `launch_interrupted_without_receipt`; use a fresh round rather than inventing a handle |

Reject duplicate, late, stale and mismatched completions. After compaction, resume an actual in-flight assessment from its persisted identity; do not duplicate it. Preserve terminal records. Keep accepted blockers, notes, round count and closures alongside the review fields. Approval is bound to the reviewed bytes, not merely the filename.

### Convergence

<!-- ulw-plan-review-convergence-contract -->
```json
{
  "max_rounds": null,
  "continue_while": "previous_round_raised_new_blocker_eligible_finding_or_closed_ledger_blocker",
  "stop_on": "round_without_new_blocker_eligible_finding_or_ledger_blocker_closure",
  "on_stop_without_approval": "stop_report_outstanding_blockers_ask_user",
  "blocker_eligibility": [
    "explicit_requirement_or_accepted_decision",
    "existing_failing_regression",
    "reproducible_broken_flow",
    "concrete_security_data_loss_or_compatibility_risk",
    "external_api_provider_or_release_contract_conflict",
    "ideal_state_row_unmapped_or_unreachable_for_the_affected_user"
  ],
  "ineligible_finding_disposition": "non_blocking_note",
  "approval_with_notes_counts_as_approval": true,
  "ledger_freeze_after_round": 1,
  "closure_round_scope": ["accepted_ledger_blockers", "regressions_introduced_by_fixes", "new_findings_passing_blocker_eligibility"],
  "fix_edit_policy": "smallest_edit_no_scope_expansion"
}
```

Freeze the accepted blocker baseline after round 1; later additions must independently satisfy blocker eligibility, not restate closed findings or expand scope. Fix eligible blockers with the smallest plan edit. Notes alone do not block approval. A further round is justified only by a new eligible blocker or confirmed closure; a non-approving round with neither stops for a user decision on the outstanding blockers. There is no fixed round cap. Preserve unresolved state if no decision arrives.

## Handoff

Deliver the exact plan path, approach, affected-user outcome, actual wave/task counts, material defaults, scope additions (if any) and review disposition. Check that the final plan digest matches its approval before claiming reviewed completion. Identify any unresolved gate instead of presenting it as approved.

Execution is a separate explicit request via [ulw-execute](../../ulw-execute/SKILL.md), normally `/ulw-execute <plan-name>`. Refer execution options and delivery mechanics to that workflow. Standalone planning stops at the plan; an execution workflow invoking prerequisite planning receives the artifact back and owns what follows.
