# Strict round contracts and native dispatch

Read [the entry](../SKILL.md) and [OMP contract](../../ulw-loop/references/omp-contract.md). The JSON schemas below define the lead's workflow receipts. Request their fields from children without overriding native completion protocols; when a native format is required, retain the raw terminal response and normalize only supported fields in the lead. Do not send outputSchema/schemaMode unless exposed by the current task schema. Every nested receipt object disallows additional properties. Runtime completion status is distinct from workflow payload fields.

These receipts cover deliberative perspective rounds and planner synthesis. Assign compatible read-only reasoning workers; this is not code-diff review. Preserve required native completion sections and normalize only observed evidence and verified identity. Missing coverage or verdicts remain unresolved.

The perspective enum is always `skeptic`, `validator`, `researcher`, `architect`, `creative`. Stable finding ids are lead-validated, globally unique, and never renumbered between rounds. Evidence strings contain an actual file:line, official URL, user statement provenance, or explicit `no evidence found`; never fabricated citations.

## Round 1 receipt schema

```json
{
  "type": "object",
  "properties": {
    "perspective": {"type": "string", "enum": ["skeptic", "validator", "researcher", "architect", "creative"]},
    "round": {"type": "integer", "enum": [1]},
    "findings": {
      "type": "array", "minItems": 3, "maxItems": 7,
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "claim": {"type": "string"},
          "evidence": {"type": "array", "minItems": 1, "items": {"type": "string"}}
        },
        "required": ["id", "claim", "evidence"], "additionalProperties": false
      }
    }
  },
  "required": ["perspective", "round", "findings"], "additionalProperties": false
}
```

## Round 2 receipt schema

```json
{
  "type": "object",
  "properties": {
    "perspective": {"type": "string", "enum": ["skeptic", "validator", "researcher", "architect", "creative"]},
    "round": {"type": "integer", "enum": [2]},
    "critiques": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "targetFindingId": {"type": "string"},
          "verdict": {"type": "string", "enum": ["ATTACK", "STANDS"]},
          "reason": {"type": "string"},
          "evidence": {"type": "array", "minItems": 1, "items": {"type": "string"}}
        },
        "required": ["targetFindingId", "verdict", "reason", "evidence"], "additionalProperties": false
      }
    }
  },
  "required": ["perspective", "round", "critiques"], "additionalProperties": false
}
```

The lead verifies exactly one judgment for every finding belonging to the other four perspectives, no unknown target ids and no self-judgments. This is a coverage check, not something JSON Schema alone proves.

## Round 3 receipt schema

```json
{
  "type": "object",
  "properties": {
    "perspective": {"type": "string", "enum": ["skeptic", "validator", "researcher", "architect", "creative"]},
    "round": {"type": "integer", "enum": [3]},
    "responses": {
      "type": "array", "minItems": 3, "maxItems": 7,
      "items": {
        "type": "object",
        "properties": {
          "findingId": {"type": "string"},
          "verdict": {"type": "string", "enum": ["DEFEND", "REFINE", "CONCEDE"]},
          "survivingClaim": {"type": ["string", "null"]},
          "reason": {"type": "string"},
          "evidence": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["findingId", "verdict", "survivingClaim", "reason", "evidence"], "additionalProperties": false
      }
    }
  },
  "required": ["perspective", "round", "responses"], "additionalProperties": false
}
```

The lead checks one response per own finding. DEFEND and REFINE require nonempty evidence and a surviving claim. CONCEDE has a null surviving claim; no conceded claim enters distillation. A supported fragment requires a separately reviewed refinement. Each explanation addresses every targeted attack, with attacker provenance retained in the ledger.

## Planner receipt schema

```json
{
  "type": "object",
  "properties": {
    "status": {"type": "string", "enum": ["completed", "questions"]},
    "planPath": {"type": ["string", "null"]},
    "report": {"type": "string"},
    "questions": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["status", "planPath", "report", "questions"], "additionalProperties": false
}
```

`completed` requires complete readable plan text in `report` and no blocking questions. In native plan mode or a read-only child assignment, `planPath` identifies the intended canonical artifact, not a claim that the child wrote it; the lead writes the permitted artifact and checks constraints/mitigations/gates before workflow completion. Otherwise the assigned plan artifact must exist. `questions` requires nonempty questions and no claim of completion. Keep native child completion sections intact; the lead normalizes this receipt. Native plan approval is exclusively the lead's `xd://propose` submission, never a child or ask/chat approval.

## Dispatch construction

Construct each actual call from the current native task schema, not a copied upstream team snippet. For example, after the lead has resolved the scope and schema objects, a Round 1 wave uses this shape:

```js
// context, assignments and round1Schema are lead-owned values assembled
// from the actual request, discovered scope and the schema above.
await tool.task({
  context: sharedRequestAndReadOnlyConstraints,
  tasks: assignments.map(assignment => ({
    name: assignment.uniqueCamelCaseName,
    task: assignment.selfContainedRoundInstructions + "\nCover these receipt fields in your native completion format; matching JSON is optional when compatible: " + JSON.stringify(round1Schema),
    solutionSpace: "Open evidence-based investigation; independently challenge assumptions from the assigned perspective."
  }))
});
```

The task text supplies allowed reads, no-write scope, perspective, finding id prefix, actual lead id when messaging is needed, and observable completion. Later rounds use the relevant round fields and evidence bundle. The planner returns proposed text when native plan mode or its assignment forbids writes; the lead persists the canonical artifact.

Record actual returned child ids in the pending set and reconcile terminal payloads by that identity. Never advance on the first reply alone while required lanes remain pending. Clarifications use actual returned ids, never logical perspective names as transport recipients. Use the model and native tool guidance for waiting and dispatch.
