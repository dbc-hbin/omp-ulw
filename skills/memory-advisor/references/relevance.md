# Relevance contract

Source: prior memory-advisor guidance, translated to finite native tasks and Mnemopi. Read [the entry](../SKILL.md).

## JSON receipt schema

```json
{
  "type": "object",
  "properties": {
    "status": {"type": "string", "enum": ["relevant", "none"]},
    "delivery": {"type": "string", "enum": ["task", "message"]},
    "note": {
      "anyOf": [
        {"type": "null"},
        {
          "type": "object",
          "properties": {
            "memoryId": {"type": ["string", "null"]},
            "provenance": {"type": "string"},
            "hint": {"type": "string", "maxLength": 200},
            "changesNextActionBecause": {"type": "string"}
          },
          "required": ["memoryId", "provenance", "hint", "changesNextActionBecause"],
          "additionalProperties": false
        }
      ]
    },
    "limitations": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["status", "delivery", "note", "limitations"],
  "additionalProperties": false
}
```

Semantic validation: `none` has null note and task delivery; no message or user output. `relevant` has a non-null note, actual retrieved provenance, and a specific effect on the named next action. An unavailable memory id is null, never invented. Hint is a single observational sentence in the user's language, not an imperative. `message` means the exact same note was already sent once to the supplied actual lead id; completion receipt still must be collected.

## Task construction

Read the current native schema. This example uses values already prepared from the actual decision and retrieved schema; it does not assume any named role or transport id.

```js
await tool.task({
  context: leadGoalKnownFactsAndNextAction,
  tasks: [{
    name: "MemoryRelevance",
    task: readOnlyRelevanceAssignmentWithActualLeadId + "\nReturn JSON matching: " + JSON.stringify(relevanceSchema),
    solutionSpace: "Determine whether existing recalled evidence changes the concrete next action; no relevant note is a valid result.",

  }]
});
```

The assignment instructs the child to read this skill, use `recall({query})` and optionally `reflect({query, context})`, perform only bounded relevant source reads, and make no memory/file/project mutations. No persistence, shell, daemon, injection, or memory filesystem operations belong in this advisor. Its only write capability used is an explicitly needed structured note to the actual lead's agent URI.

Record the returned actual child id. Wait through first wakes, keeping the child pending until terminal structured output arrives. An urgent message is advisory evidence, not a terminal completion. Do not spawn a second advisor to watch the first.

## Relevance examples

Relevant: the next action is rebasing a worktree while a child writes there; a retrieved observation records corruption from this same race. Hint: "The stored note records that rebasing while a child wrote to the worktree corrupted its edits."

Relevant: the lead is about to ask a formatting preference; a recalled explicit user statement already supplies that preference. Cite that statement's actual provenance and explain that it answers the pending question.

Not relevant: a git conventions memory shares the topic with a rebase but contains no fact that changes the action. Return none.

Not relevant: the lead already has the same observation, or the current user explicitly chose a different approach. Do not repeat or overrule the request.

Missing durable knowledge: the advisor suspects a memory should exist, but recall finds none. Return none or a capability limitation; persistence belongs to the lead/reflection, never the advisor.
