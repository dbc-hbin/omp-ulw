---
name: ulw-plan
description: "ulw-plan question presentation, fork-reply interpretation and planning-style observations."
metadata:
  short-description: Adapt planning questions without changing decision ownership
---

# Stance calibration

[Intent routing](../SKILL.md) decides which planning decisions remain. Stance changes their form, pacing and batching; it never changes what a reply means or grants authorization. Follow the [plan artifact contract](full-workflow.md) for decisions and review state, and current OMP for interaction and memory tools.

## Presenting choices

Use the user's current preference first, then relevant planning-interaction episodes from similar project/domain contexts. Without a useful preference, CLEAR generally benefits from one focused fork at a time; UNCLEAR benefits from concrete examples for critique. Do not infer a permanent style from one answer.

- **Batch:** group related surviving forks with recommendations and consequences.
- **One-by-one:** resolve one material fork before presenting another.
- **Examples-first:** offer two or three contrasting outcomes and ask which is closest or what is wrong.

The user can switch form at any time. Explain consequences, not tool mechanics. Explicit delegation such as "you decide" can resolve an ordinary fork; a missing answer does not transfer ownership or approve a plan.

## Interpret each reply afresh

Ask whether the reply leaves one usable outcome and whether it adds decision-relevant information. Tone, hedge words and a stored profile do not answer either question.

| State | Meaning | Next planning action |
| --- | --- | --- |
| RESOLVED | One outcome follows from the reply and existing constraints, including explicit delegation | Record the semantic decision and rationale |
| RESOLVED_BUT_UNINFORMED | An outcome was named arbitrarily or with a material misconception | Explain the consequence; confirm an owner decision or expose the recommended ordinary default for veto |
| UNRESOLVED_PROGRESS | Still open, but an option was eliminated, a constraint added or framing challenged | Incorporate the information and clarify this fork |
| UNRESOLVED_BLOCKED | Still open with no relevant information added | Reframe as concrete outcomes with a recommendation and material consequence |

A reply can resolve several forks, challenge a fact and add scope at once; process each part. Repeated blocked replies justify offering a different presentation, not silently changing decision ownership.

## Delegation and stop-asking requests

Interpret phrases such as "알아서", "니가 정해", "질문 그만" or "stop asking" by speech act and scope:

1. Is this a direct current instruction, rather than negation, quotation or a hypothetical?
2. Does it delegate this fork, delegate the remainder, stop the interview, request a recommendation or ask for better questions?
3. What is the narrowest scope supported by the words? One-fork delegation does not delegate the session.

Record delegated ordinary defaults. A request for a recommendation alone does not adopt it. Stopping the interview changes presentation: consolidate surviving owner decisions into a single concise block with recommended choices and consequences. Do not turn frustration or silence into authorization for an irreversible action or spend. Plan-creation approval remains separate from implementation.

## Optional planning-style episodes

Preserve qualified observations in the existing planning-style memory topic when available; otherwise the draft may record the session stance. No separate profile store or mandatory close procedure is required.

Record explicit interaction preferences as `declared`, or the same unsolicited pattern across two or more independent forks as `observed`. Do not record bare approval, a single local delegation, frustration alone, factual corrections or answer shapes forced by your own question format. Keep observations, not counters or a fixed persona. Retain context and contradictory preferences rather than applying a global majority.

Existing episode shape:

```text
- [YYYY-MM-DD] <repo/domain and familiarity context> - <observed behavior> <!-- src: <session-id>; model: <session model>; pattern: observed|declared; confidence: low|medium|high -->
```

Foreign-session seeds are tentative opening-style hints only, subordinate to current statements and native episodes. Preserve their provenance and `confidence: low`; do not promote inferred preferences into owner decisions.

```text
- [YYYY-MM-DD] (seed) appears to <hypothesis and context> <!-- src: <harness>/<session-id>,...; harness: <names>; model: <models>; seeded: YYYY-MM-DD; pattern: inferred-from-external-sessions; confidence: low -->
```
