# Phase 5 — User Decision Escalation

Escalation is for genuine ambiguity, not for skipping investigation. Most "should I ask the user" moments are really "I don't want to do one more query" moments, and those are wrong.

---

## Ask the user ONLY when

- **Evidence exhausted**, contradictions remain, and further investigation would require a decision with policy implications (e.g. "patch the third-party SDK vs wrap it vs change architecture").
- The bug has **multiple valid fixes with different scope/risk tradeoffs** and the user's preference drives the choice.
- A proposed fix would **change observable product behavior** for the end user (not just fix the internal bug).
- Further progress after the Oracle synthesis requires user-supplied access or a material decision; failed-round counts alone do not justify asking.

## Do NOT ask when

- Runtime queries or the applicable Oracle Triple can answer the factual question. Material product decisions and required authorization may need the user before the Triple.
- The question can be answered by one more runtime query.
- You're asking for permission to do the obvious thing.
- You're asking because you're tired.

---

## Escalation format

Keep it short. Evidence-dense. One decision, not a status update. The main session uses native blocking `ask` when exposed, with the evidence and options below. If unavailable, ask directly in chat and await the answer. A worker returns the missing decision to the lead instead of asking the user.

```markdown
## Decision needed

**What we know** (verbatim evidence, not paraphrase):
- <fact 1 with file:line or address>
- <fact 2 with source>
- <what the evidence rules IN>
- <what the evidence rules OUT>

**What the decision is** (one sentence):
<the fork in the road>

**Options**:

| # | Fix | Scope | Risk | Effort |
|---|-----|-------|------|--------|
| A | <short label> | <files touched / layers> | <regressions possible> | <rough> |
| B | ... | ... | ... | ... |
| C | ... | ... | ... | ... |

**Recommendation**: <A/B/C> because <one-sentence reason>.

Which direction do you want?
```

---

## Anti-patterns in escalation

- **Asking without evidence.** "What do you want me to do?" is not an escalation, it's abandonment. Every escalation includes the evidence the user needs to decide.
- **Two questions in one.** One decision per escalation. Multi-part questions lead to partial answers and re-escalation.
- **Escalating a factual uncertainty before gathering evidence.** Product policy, missing access and authorization are distinct from factual uncertainty.
- **Presenting options you don't actually have.** If option C requires a library the user doesn't use, don't list it. The options are only things you can actually do today.
- **Hiding a recommendation.** The user hired you to think — always end with a recommendation, even if you're low-confidence. Say so explicitly: "Recommendation (low confidence): B, because X. If you have context about Y that I don't, it might change to A."

---

## What happens after the user responds

- **User picks an option**: return to Phase 6 (root cause confirmation) with the chosen direction. The user's choice is not itself confirmation — you still need runtime evidence that the cause you're fixing is the cause in play.
- **User proposes a different option you hadn't considered**: treat it as new information. Update hypotheses. May trigger another Phase 3 round.
- **User gives more context that resolves the disagreement**: update hypotheses and still confirm the mechanism in Phase 6.
- **User is also unsure**: that's a signal you need more evidence, not more opinions. Run one more targeted query before asking again.