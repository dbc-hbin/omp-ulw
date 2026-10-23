# Strict round contracts and native dispatch

Read [the entry](../SKILL.md) and [OMP contract](../../ulw-loop/references/omp-contract.md). Include the appropriate JSON schema below in the task assignment as the required receipt shape; validate the actual terminal response yourself. Do not send outputSchema/schemaMode unless exposed by the current task schema. Every nested object disallows additional properties. Runtime completion status is distinct from workflow payload fields.

These schemas govern deliberative perspective rounds and planner synthesis, which use default workers for their reasoning/writing role, not to evade a specialist's native format. A separate independent review of an existing code diff uses `tasks[].agent = "reviewer"`, and repository vulnerability analysis uses `security-reviewer`; the parent retains that specialist's raw native response and normalizes the needed workflow receipt from observed evidence and verified task identity, without imposing these round schemas on it; if either specialist is unavailable for its target, record the capability gap instead of substituting a default worker. Plan review, plan gap analysis, claim verification, or an artifact assessment without a code diff is not code-diff or vulnerability work: omit `agent` and assign a fresh read-only default worker explicit no-edit scope plus the required receipt criteria (for plans, a fresh read-only plan-review worker), validating its ordinary report yourself. Missing coverage or verdicts remain unresolved, not fabricated PASS. Role compatibility is not a custom-JSON workaround, and a specialist is never dropped for a target its role does cover.

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

`completed` requires the approved artifact to exist, a complete readable plan in `report`, and no blocking questions. `questions` requires nonempty questions and no claim of completion. The lead reads the artifact and checks all constraints/mitigations/gates independently. Ask is main-session-only and blocking; no answer never grants approval.

## Dispatch construction

Construct each actual call from the current native task schema, not a copied upstream team snippet. For example, after the lead has resolved the scope and schema objects, a Round 1 wave uses this shape:

```js
// context, assignments and round1Schema are lead-owned values assembled
// from the actual request, discovered scope and the schema above.
await tool.task({
  context: sharedRequestAndReadOnlyConstraints,
  tasks: assignments.map(assignment => ({
    name: assignment.uniqueCamelCaseName,
    task: assignment.selfContainedRoundInstructions + "\nReturn JSON matching this receipt schema: " + JSON.stringify(round1Schema),
    solutionSpace: "Open evidence-based investigation; independently challenge assumptions from the assigned perspective."
  }))
});
```

Omitted `agent` selects the native default for these deliberative perspective assignments. Separate code-diff review follows the reviewer routing above, and repository vulnerability analysis the security-reviewer routing, with parent normalization; plan or artifact assessment without a code diff uses a fresh read-only default worker with explicit no-edit scope. Select only listed roles and preserve missing capabilities as gaps. The task text supplies exact allowed read paths, no-write scope, perspective instructions, finding id prefix, actual lead id if messaging is needed, and observable completion. Shared material belongs in top-level context, not solutionSpace. Later rounds replace the task instructions and schema with the relevant round contract and evidence bundle.

Record actual returned child ids before any further action. Native `wait({})` is first-wake: reconcile terminal payloads/messages, keep unfinished ids pending, and repeat only while the next step is blocked. Never advance on the first reply alone. Clarifications use `write` to `agent://<actual-id>` only after that id is returned; logical perspective names are never transport recipients. There is no team SDK or invented category/model field.
