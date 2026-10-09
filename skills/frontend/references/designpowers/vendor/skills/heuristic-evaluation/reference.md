---
name: heuristic-evaluation
description: Use after a build to evaluate usability against Nielsen's 10 heuristics and run cognitive walkthroughs of every key task. Dispatches the heuristic-evaluator agent in parallel with design-critic and accessibility-reviewer, then feeds findings into the reconciliation protocol. This is the usability lens — "will people actually be able to use this?" — distinct from craft critique and accessibility audit
---

# Heuristic Evaluation

Heuristic evaluation is the usability lens on a build. Where `../designpowers-critique/reference.md` asks "does this match the plan?" and the accessibility review asks "can everyone access this?", heuristic evaluation asks "will people actually be able to use this without getting lost, confused, or stuck?" This reference supplies the heuristic-evaluator charter to an actual OMP reviewer and integrates its findings with the other reviewers.

## When to Use

- **After `design-builder` completes a build** — run alongside `../designpowers-critique/reference.md` and the accessibility review, not after them
- Before a fix round, so usability findings are reconciled with craft and accessibility findings together
- When a flow feels confusing but you can't articulate why — the heuristics name the problem
- When evaluating an existing design (see the local frontend orchestration contract → Review Mode), not just freshly built work

This skill is **not optional after a build.** Skipping it is a Red Flag (see the local frontend orchestration contract). Usability problems that craft critique and accessibility audits both miss are exactly what this catches.

## Process

### Step 1: Confirm Inputs Exist

Before dispatching, assemble:
- The **build** to evaluate (running app, prototype, or screenshots — test what was built, not the spec)
- The **design brief** (from the frontend direction/discovery lane) — for the key tasks to walk through
- The **personas** (from `../inclusive-personas/reference.md`) — each persona's primary task gets a cognitive walkthrough
- `doc/frontend-design/state.md` — the shared state the agent will read and update

If there is no brief or no list of key tasks, the cognitive walkthrough has nothing to walk through. Go back and capture the key tasks first.

### Step 2: Dispatch the heuristic-evaluator Agent

Dispatch an actual OMP reviewer using the local `../../agents/heuristic-evaluator.md` role brief. It will:

1. Evaluate the interface against **Nielsen's 10 heuristics**, citing specific violations with evidence (H1–H10)
2. Run a **cognitive walkthrough** of every key task — four questions per step
3. Analyse **error paths**, not just happy paths — recovery, undo, back navigation, dead ends
4. Assess **learnability** (first-time user) and **efficiency** (repeat user)
5. Acknowledge what works well, not only what fails

The agent narrates at three moments (arrival, working, departure) per the Agent Transparency protocol in the local frontend orchestration contract.

### Step 3: Run in Parallel and Reconcile

Per the **Reconciliation Protocol** in the local frontend orchestration contract, the heuristic-evaluator runs **simultaneously** with `design-critic` and the accessibility-reviewer:

```
design-builder finishes
        |
   ┌────┼────────┐
   v    v        v
critic  reviewer  heuristic    (run simultaneously)
   |    |        |
   └────┼────────┘
        v
  reconciliation
```

When findings overlap or conflict, classify them (Aligned / Complementary / Conflicting) and resolve using the protocol's priority rules. Remember: **usability wins over style** — a beautiful interface that confuses people has failed.

### Step 4: Honour the Auto-Mode Safeguard

Even in auto mode, the pipeline **must pause** if the heuristic-evaluator finds a critical **H3 violation** (no undo on a destructive action) or **H1 violation** (user is completely lost). These indicate structural problems, not polish issues, and the user should decide how to resolve them.

> ⚠️ **Auto paused:** heuristic-evaluator found a critical usability issue (H3 — no undo on delete) that needs your decision. [details]

### Step 5: Feed the Fix Round

After reconciliation:
1. The agent's findings join the single prioritised fix list (critical first)
2. Note which findings the heuristic-evaluator sourced and whether any were reconciled with other reviewers
3. **Record deferred Minor findings** in the Design Debt Register via `../design-debt-tracker/reference.md` — promises don't disappear because severity is low
4. Re-run the heuristic-evaluator only on critical fixes after the build round, not the full evaluation

## What You Get

A structured heuristic evaluation report (see the agent definition for the full format): a heuristic findings table (H1–H10 with verdicts), cognitive walkthrough results per task, findings grouped by severity, what works well, and a recommendation (Proceed / Revise / Rethink).

## Integration

- **Runs after:** `design-builder` (build complete) — or against an existing design in Review Mode
- **Runs alongside:** `../designpowers-critique/reference.md`, accessibility review (parallel, then reconciled)
- **Feeds:** the reconciliation protocol → `design-builder` fix round → `../synthetic-user-testing/reference.md`
- **Calls:** `../design-debt-tracker/reference.md` for deferred Minor findings
- **Records to:** `doc/frontend-design/state.md` (Decisions Log, Handoff Chain, Open Questions)
