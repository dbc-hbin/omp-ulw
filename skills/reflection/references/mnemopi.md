# Native Mnemopi operations and report contract

Read [reflection](../SKILL.md). Source: omo 5.1.19 `plugin/extensions/reflection-persona.md`, translated to tool-backed Mnemopi rather than memory Git/filesystem tiers.

## Known exposed operations

These are the actual tool shapes exposed during this port. Check the live schema again at activation because a host can expose a different set.

```js
recall({ query: qualifiedTopicQuery });
reflect({ query: historySynthesisQuestion, context: relevantReviewContext });
retain({ items: [{ content: supportedDurableFact, context: sourceAndScope }] });
memory_edit({ op: "update", id: retrievedMemoryId, content: correctedSupportedFact });
```

`reflect` context is optional. `retain` items support content/context and, when available, scope; do not guess scope semantics beyond the exposed contract. `memory_edit` has `op: "update" | "forget" | "invalidate"`, actual `id`, optional `content`, `importance` and `replacement_id`. Use replacement_id only when a successfully stored replacement returned that actual id. Tool output is authoritative; do not assume retain's result format or derive ids from text paths.

Recall before retaining or editing. Qualify queries by project/user/topic so another project's similarly named fact does not become a correction target. Store explicit statements with provenance and uncertainty; an episode is not a rewritten system instruction. No raw database, memory filesystem, git tree, `system/` tier, or `$MEMORY_DIR` operation is needed or permitted.

## Capability-gated learning and managed skills

The main OMP host exposes `learn` and `manage_skill`; delegated roles may
have a smaller tool set. Read the live schema and establish ownership
before using either. Current main-host forms are:

```js
learn({ memory: durableEvidence, context: provenance, scope: "project" });
learn({ memory: workflowEvidence, skill: {
  action: "create", name: workflowName, description: trigger, body: procedure
} });
manage_skill({ action: "update", name: existingManagedName,
  description: trigger, body: correctedProcedure });
```

`learn.skill.action` supports create/update. `manage_skill.action` supports
create/update/delete. Extension means update; deprecation and split are
not separate API actions. Do not invent them. Managed skills belong only
in the host-owned managed store; read their actual definitions first and
never edit user-authored/project/installed skills. Check the receipt and
discovery result rather than assuming a write succeeded.

- If learn is exposed, provide the supported evidence/workflow fields required by that live schema and check whether it persists or only proposes a learning. A proposal is not a write receipt.
- If manage_skill is exposed, inspect the existing skill and establish it is agent-owned learned memory before modification. Use only supported operations/fields. The labels update/extend/deprecate/split/create are workflow decisions, not guaranteed method or argument names.
- If ownership, persistence, or a required operation cannot be established, return a concrete proposal/capability gap. Do not patch an installed or user-authored SKILL.md, edit system prompts, invent a manager, or start a memory daemon.
- If useful, retain the supported durable workflow lesson as ordinary memory when managed-skill persistence is unavailable. Clearly report that this is a memory episode, not an installed executable skill.

Prefer one surgical update/extension over a new near duplicate. Deprecation/splitting must preserve actual supported crosslinks and cannot remove a user-authored skill. A new learned procedure needs trigger, repeatable steps, real command/tool contracts, verification and pitfalls. Only promise reusable assets when the native managed store actually created and exposes them.

## Strict reflection outputSchema

```json
{
  "type": "object",
  "properties": {
    "summary": {"type": "string"},
    "coverage": {
      "type": "object",
      "properties": {
        "reviewed": {"type": "string"},
        "partial": {"type": "boolean"},
        "unreviewed": {"type": "string"}
      },
      "required": ["reviewed", "partial", "unreviewed"], "additionalProperties": false
    },
    "memoryChanges": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "operation": {"type": "string", "enum": ["retain", "update", "invalidate", "forget"]},
          "memoryId": {"type": ["string", "null"]},
          "reason": {"type": "string"},
          "receipt": {"type": "string"}
        },
        "required": ["operation", "memoryId", "reason", "receipt"], "additionalProperties": false
      }
    },
    "skillChanges": {
      "type": "object",
      "properties": {
        "operation": {"type": "string", "enum": ["update", "extend", "deprecate", "split", "create", "none"]},
        "targets": {"type": "array", "items": {"type": "string"}},
        "receipts": {"type": "array", "items": {"type": "string"}}
      },
      "required": ["operation", "targets", "receipts"], "additionalProperties": false
    },
    "skipped": {"type": "array", "items": {"type": "string"}},
    "issues": {"type": "array", "items": {"type": "string"}},
    "commit": {"type": "string", "enum": ["no commit"]}
  },
  "required": ["summary", "coverage", "memoryChanges", "skillChanges", "skipped", "issues", "commit"],
  "additionalProperties": false
}
```

Only successful observed writes belong in memoryChanges/skillChanges. Record failed or unavailable operations in issues; intended changes are not completed ones. An unavailable returned memory id is null and the actual success receipt explains that limitation. A no-op has empty changes, skill operation none, skipped reasons, and no commit.

## Native task example

These values are assembled by the lead from approved transcript coverage, real schemas, and allowed native persistence scope.

```js
task({
  context: boundedEvidenceAndPersistenceScope,
  tasks: [{
    name: "DurableReflection",
    task: selfContainedReflectionAssignment,
    solutionSpace: "Assess which corrections, facts and procedures generalize; no persistence is valid when evidence is ephemeral or already captured.",
    outputSchema: reflectionReportSchema,
    schemaMode: "strict"
  }]
});
```

The assignment includes the actual skill path, transcript coverage, no-question child contract, no further delegation, no system/user-skill edits, required API schemas and stop condition. Omit agent for default; select only listed actual roles. Record returned child ids and collect via first-wake `wait({})`, never a fake wave barrier or automatic second process. Reconcile every terminal output by actual id and validate the strict payload before the lead claims persistence.
