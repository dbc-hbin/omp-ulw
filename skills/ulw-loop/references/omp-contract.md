# ULW and OMP responsibility boundary

ULW skills define specialised deliverables and durable artifact formats. Current OMP instructions and exposed tool schemas own execution, delegation and model selection, tool use, asynchronous work, verification, approvals, git operations and reporting. Do not copy an older runtime contract from a skill or impose another generic verification loop. The extension's native keyword connection supplies execution mechanics without changing the specialised workflow's scope or artifact semantics.

## Activation and ownership

Names and entry points are stable: `ulw`, `ulw-plan`, `ulw-execute`, `ulw-loop`, `ulw-research` and `mass-ulw`. Only an explicit request selects a specialised workflow; reading or discussing one does not. A pointer locates its installed skill, not an additional execution mode.

For leading specialised invocations in interactive/RPC `prompt` input and registered slash-command handlers, the extension inserts a native trigger before user arguments: `ulw-plan` -> `ultrathink`, `ulw-execute`/`ulw-loop` -> `orchestrate`, `ulw-research`/`mass-ulw` -> `workflowz`. Existing keyword aliases use the same mapping. A user-supplied native word suppresses this default, even when quoted or negated; OMP decides whether that word activates. The extension does not copy native notice text or bypass disabled keyword settings, missing tools, child isolation, or `--omo-ulw-workflows-disabled`. Plain ULW and ordinary follow-ups add no trigger; `jevify` is never automatically selected.

OMP 18.16's separate RPC `steer` and `follow_up` requests bypass native keyword processing. Clients needing queued native activation use RPC `prompt` with `streamingBehavior: "steer"` or `"followUp"`. The input hook does not expose the request kind; it must not resubmit inputs and silently change queue semantics or attachments. Initial CLI bare text and direct `/skill:` invocations also need explicit native words rather than assuming this extension's command bridge ran.

Plain ULW uses OMP-native goal continuation. The extension routes interactive `/ulw` and standalone `ulw`/`ultrawork` input through `/goal` before command dispatch, unless a goal is active. RPC and programmatic activation only arm the policy; clients create goals through the native goal API. `sendUserMessage()` does not expand a `/goal` command.

Durable workflows retain one owner for each kind of state:

| Workflow | Owned state |
|---|---|
| `ulw-plan` | `doc/drafts/` and `doc/plans/`: decisions, plan and plan-review status |
| `ulw-execute` | `doc/boulder.json` and `doc/ulw-execute/ledger.jsonl`: plan selection, session ownership and checkpoints |
| `ulw-loop` | `doc/ulw-loop/<run-id>/`: aggregate objective, goals and evidence checkpoints |
| `mass-ulw` | `doc/mass-ulw/<run-id>/graph.json` and `ledger.jsonl`: dependency nodes, handoffs and recovery |
| `ulw-research` | Research directory for claims, observations and deliverables; standalone continuation uses session-owned `doc/ulw-loop/<session-id>/` goals referencing those records |

The lead owns shared workflow state. A nested graph uses the enclosing loop or execution objective rather than registering another goal. Planning does not authorize implementation; workflow flags do not bypass OMP approval boundaries.

## Continuation and evidence

The installed extension can resume active loop or Boulder work owned by the current session. It checks pending state, respects terminal/blocked state and stops repeating an unchanged fingerprint. A hook notification is not proof of completion; update state from the actual outcome.

Use the selected workflow's artifact schema and existing verifier where it has one. A checkpoint ties its criterion to the input identity, observed result and evidence location. Changed inputs invalidate dependent evidence, not unrelated completed work. Generic testing, real-surface QA and resource cleanup follow OMP; these records document those results rather than requiring a second pass.

Load linked references only when their artifact or state contract is needed. Tool documentation, not this file, specifies native task, workpool, wait, browser or memory APIs.
