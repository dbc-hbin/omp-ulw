# Native map/reduce node contracts

Read [init-deep](../SKILL.md); consult the [OMP compatibility contract](../../ulw-loop/references/omp-contract.md) only for unresolved native tool semantics, reusing it within the session. Use explicit dependency waves: map -> subtree reductions -> optional digest reductions -> root -> verification. A real documented native workpool may implement these same dependencies; no invented DAG SDK, configuration knob, category/model selector, context-window constant or retry API is part of this port.

Read the actual native task schema first. Use `context` for shared repository root, exclusion rules, preservation policy and report formats; use `tasks` for self-contained assignments with exact read/write paths and observable completion. `solutionSpace` describes uncertainty. Include the required JSON receipt schema in the assignment and validate the returned payload; do not pass unsupported `outputSchema` or `schemaMode` arguments. Omit `agent` for default workers; select only listed suitable roles. A read-only scout cannot write reports: either use a writer-capable default worker for the map contract below, or have an explicitly assigned reducer consume its validated report payload and persist it. Do not grant imaginary tools through an arbitrary allowlist.

## Scanner receipt schema

The scanner writes one report with every numbered section from the entry and source citations, then returns this bounded receipt. The verifier/reducer reads the report; the lead need not ingest it.

```json
{
  "type": "object",
  "properties": {
    "nodeId": {"type": "string"},
    "reportPath": {"type": "string"},
    "sourceDirectories": {"type": "array", "minItems": 1, "items": {"type": "string"}},
    "measurementGaps": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["nodeId", "reportPath", "sourceDirectories", "measurementGaps"],
  "additionalProperties": false
}
```

Assignments require TASK: extract facts for the named directories; DELIVERABLE: exactly one named report; SCOPE: read assigned directories plus named covering guidance and write only the report; VERIFY: read it back, required sections/citations exist; STOP WHEN: receipt and report are complete. No AGENTS.md writes, location decisions, unrelated code edits or command execution guessed from manifests.

## Reducer/root receipt schema

```json
{
  "type": "object",
  "properties": {
    "nodeId": {"type": "string"},
    "digestPath": {"type": "string"},
    "locations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "action": {"type": "string", "enum": ["created", "updated", "unchanged"]},
          "score": {"type": ["integer", "null"]},
          "reason": {"type": "string"}
        },
        "required": ["path", "action", "score", "reason"], "additionalProperties": false
      }
    },
    "issues": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["nodeId", "digestPath", "locations", "issues"],
  "additionalProperties": false
}
```

A subtree reducer reads named successful reports plus relevant existing docs, spot-checks evidence, applies the scoring/template reference, writes only its owned guidance/digest, and verifies those artifacts. Root is out of subtree scope. A digest-only intermediate reducer writes no guidance and returns an empty locations array plus its bounded digest. A root writer reads successful final digests plus root guidance and owns root AGENTS.md only (plus its digest). Root score is null because root is mandatory, not measured selection.

The lead establishes inherited parent content before descendant writers where necessary. No ancestor and descendant concurrently edit the same file. User rules always survive; issues concerning uncertain user intent block dependent edits, not unrelated successful reductions.

## Verifier JSON receipt schema

```json
{
  "type": "object",
  "properties": {
    "verdict": {"type": "string", "enum": ["PASS", "FAIL"]},
    "files": {
      "type": "array", "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "path": {"type": "string"},
          "verdict": {"type": "string", "enum": ["PASS", "FAIL"]},
          "issues": {"type": "array", "items": {"type": "string"}},
          "evidence": {"type": "array", "minItems": 1, "items": {"type": "string"}}
        },
        "required": ["path", "verdict", "issues", "evidence"], "additionalProperties": false
      }
    },
    "unrunCommands": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["verdict", "files", "unrunCommands"],
  "additionalProperties": false
}
```

Every digest-declared location and changed guidance path must appear exactly once. Overall PASS requires all files PASS and no unresolved preservation/link/command defect. Evidence names actual inspected sources and checks, not a claim that a build ran. The lead checks coverage and reads back final changed artifacts as required by the host; it does not absorb every scanner report just to repair a writer.

## Dispatch example

The lead resolves directories and task-owned report paths before making this call; values below are already assembled from discovery, not transport placeholders.

```js
await tool.task({
  context: repositoryAndPreservationContract,
  tasks: chunks.map(chunk => ({
    name: chunk.uniqueCamelCaseName,
    task: chunk.numberedExtractionAssignment + "\nReturn JSON matching: " + JSON.stringify(scannerReceiptSchema),
    solutionSpace: "Investigate the actual layout and conventions; do not assume framework defaults or undocumented boundaries."
  }))
});
```

For reducers, solutionSpace is open where evidence conflicts or location choice is unresolved; writing an already-approved wording correction is fixed mechanical work. Do not encode file scope or report size as solutionSpace. Every node gets the required skill/reference paths in its task because children start blank.

Immediately bind logical node ids to returned actual agent ids and record pending children. `wait({})` is a first-wake operation. Reconcile each terminal receipt and injected result by actual id, remove only terminal ids, and retain unfinished siblings. A message or runtime preview never satisfies a dependency. Invalid required structured payloads fail the node. Retry only terminal failures; preserve unchanged successful outputs and invalidate changed descendants. Send steering only to `agent://<actual-id>`. Final delivery requires no pending children.
