# Phase 4 — Oracle Triple Consultation

At 2 consecutive failed hypothesis rounds, stop investigating and reframe. Continuing past two failures usually means the real cause is in a category you haven't imagined — and more time on your current mental model is wasted time.

The Oracle Triple is how you break out of the mental box.

> ⚠️ **Wrong tool for non-debugging tasks.** The Triple is for *stuck root-cause hunts*. If your task is producing an artifact (extraction, reverse engineering, audit, compliance documentation) and you want a skeptical review before declaring it done, use the **Verification Oracle** pattern in [partial-runtime-evidence.md](partial-runtime-evidence.md#verification-oracle-pattern-for-non-debug-tasks). Running the Triple on a finished extraction returns three diverging "what if you tried…" tangents that are not what you need.

---

## When to invoke

| Situation | Invoke? |
|---|---|
| 1 round failed, you have new distinguishing evidence | No — run one more round with a refined hypothesis set |
| 2 rounds failed, hypotheses now feel like variations of each other | **Yes — invoke now** |
| 2 rounds failed, no new evidence angles left to try | **Yes — invoke now** |
| You've been investigating >2 hours on the same bug | **Yes — invoke now regardless of round count** |
| 1 round failed but the user is watching and wants speed | No — one round isn't enough to justify Oracle cost. Resist the urge. |

---

## Why three Oracles, and why *orthogonal* framings

A single Oracle call returns a single coherent analysis. Coherent analyses tend to inherit the framing of the prompt, which means they inherit the same blind spots the investigator already has. Three Oracles with *orthogonal framings* force the analyses to diverge, and the places where they agree across frames is where the real signal lives.

The three framings below are chosen to cover distinct bug-cause categories:

- **A (obvious-but-missed)** — embarrassingly simple causes the investigator walked past.
- **B (system-boundary)** — causes living at integration seams, not in the code being read.
- **C (invariant-violation)** — assumptions load-bearing to current hypotheses that may themselves be false.

Spawn all three in parallel.

---

## The three OMP assignments

Dispatch three background native tasks together, using context + tasks as shown in [02-investigate.md](02-investigate.md). Prefer listed senior-task or omit agent for the default worker. Read-only; no implementation or nested delegation. Each receives the same exact bug, raw observations, failed hypotheses, loaded code identity and bounded source paths. Include in each assignment a JSON receipt schema with required framing (string), candidates (array of strings), assumptions (array of strings), and queries (array of objects with query, holds, fails string fields), additionalProperties:false throughout. Use solutionSpace to state that the cause is unknown and this framing explores alternative explanations, not file scope.

- A, obvious-but-missed: exactly three ranked causes. Check typo/off-by-one, wrong import/constant, stale cache, wrong process/file, harness vs app, src vs dist. Explain compatibility with the evidence.
- B, system-boundary: exactly three causes naming specific boundary and violated contract. Consider SDK behavior, middleware, gateway rewriting, build/runtime env, module order, shared-library versions, ABI and transport negotiation.
- C, invariant-violation: exactly five load-bearing assumptions, each with the smallest falsification query and predicted observable if true vs false.

Maintain the actual pending set and collect all three terminal receipts under the first-wake wait semantics before synthesis. Reasoning is a proposed query, never runtime confirmation. A failed/missing payload is retried with a fresh child only after terminal collection; retain successful siblings. Do not replace a running child due to elapsed time.

## Synthesizing across three Oracles

**Do not pick the highest-ranked candidate from a single Oracle.** That defeats the purpose of getting three framings.

Instead, walk the outputs in this order:

### 1. Agreement scan

Note which candidate causes appear in at least two Oracles' outputs. Independent agreement across orthogonal framings is strong signal — when the obvious-but-missed framing and the system-boundary framing both land on the same cause, that's usually the bug.

### 2. Disagreement scan

Note where Oracles disagree. Disagreement is genuine uncertainty that runtime evidence (not more reasoning) must resolve. Each disagreement becomes a candidate for the next round's distinguishing query.

### 3. New falsification queries

Framing C produces concrete "one query that would decide it" suggestions. Pull these verbatim into your new round's evidence-gathering plan — they are designed to be decisive.

### 4. Build the new hypothesis set

Minimum 3, same rules as Phase 2. Aim to have hypotheses drawn from the agreement scan (likely cause) AND from the disagreement scan (so one round's evidence resolves the disagreement).

Record in the journal:

```markdown
## Oracle Triple — Round <N>
- Invoked at: <ISO timestamp>
- Framing A summary: <top 3 candidates, one line each>
- Framing B summary: <top 3 candidates>
- Framing C summary: <5 load-bearing assumptions + falsification queries>

### Cross-framing agreement
- <candidate> appeared in A + B
- <candidate> appeared in B + C

### New hypothesis set
1. <hypothesis> — evidence to gather: <one-liner>
2. ...
```

### 5. Reset the counter

Reset the "consecutive failed rounds" counter to 0. Return to Phase 3 (parallel investigation) with the new set.

---

## If *another* 2 rounds fail after the Oracle Triple

Use this threshold to reconsider the approach, not to hand a factual investigation back to the user.

Reassess the evidence and change the investigation approach. Escalate to the user (see `05-escalate.md`) only when the next step requires a material decision or access the session cannot supply; include the hypotheses, observations and Oracle synthesis. A round count alone is not a blocker or a reason to stop. Do not guess a fix.

This is rare — in practice, the Oracle Triple resolves almost all stuck debugging sessions within one round, because it pulls in framings the investigator was too close to the code to see.