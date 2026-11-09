# ULW and OMP responsibility boundary

ULW skills define specialised deliverables, durable artifact formats and evidence gates. The extension's selected model guidance owns ordinary work style, including investigation, delegation, asynchronous work and verification choices; these skills do not add a generic execution policy. Actual tool schemas, permissions, approvals, explicit native modes, project rules and specialist completion contracts remain binding. For unsupported/custom profiles, use OMP's native fallback guidance. Native keyword connections select execution modes without granting additional permissions or changing workflow ownership.

## Activation and ownership

Names and entry points are stable: `ulw`, `ulw-plan`, `ulw-execute`, `ulw-loop`, `ulw-research` and `mass-ulw`. Only an explicit request selects a specialised workflow; reading or discussing one does not. A pointer locates its installed skill, not an additional execution mode.

For leading specialised invocations in interactive/RPC `prompt` input and registered slash-command handlers, the extension inserts a native trigger before user arguments: `ulw-plan` -> `ultrathink`, `ulw-execute`/`ulw-loop` -> `orchestrate`, `ulw-research`/`mass-ulw` -> `workflowz`. Existing keyword aliases use the same mapping. A user-supplied native word suppresses this default, even when quoted or negated; OMP decides whether that word activates. The extension does not copy native notice text or bypass disabled keyword settings, missing tools, child isolation, or `--omo-ulw-workflows-disabled`. Plain ULW and ordinary follow-ups add no trigger; `jevify` is never automatically selected.

OMP 18.16's separate RPC `steer` and `follow_up` requests bypass native keyword processing. Clients needing queued native activation use RPC `prompt` with `streamingBehavior: "steer"` or `"followUp"`. The input hook does not expose the request kind; it must not resubmit inputs and silently change queue semantics or attachments. Initial CLI bare text and direct `/skill:` invocations also need explicit native words rather than assuming this extension's command bridge ran.

Plain ULW uses OMP-native goal continuation. The extension routes explicit interactive `/ulw` and leading `ulw`/`ultrawork` invocations through `/goal` before command dispatch when native goal ownership permits. RPC and programmatic activation only arm the policy; clients create goals through the native goal API. `sendUserMessage()` does not expand a `/goal` command.

Durable workflows retain one owner for each kind of state:

| Workflow | Owned state |
|---|---|
| `ulw-plan` | Decisions, plan and plan-review status: `doc/drafts/` and `doc/plans/` ordinarily; lead-written `local://<slug>-draft.md` and canonical `local://<slug>-plan.md` in native plan mode |
| `ulw-execute` | `doc/boulder.json` and `doc/ulw-execute/ledger.jsonl`: plan selection, session ownership and checkpoints |
| `ulw-loop` | `doc/ulw-loop/<run-id>/`: aggregate objective, goals and evidence checkpoints |
| `mass-ulw` | `doc/mass-ulw/<run-id>/graph.json` and `ledger.jsonl`: dependency nodes, handoffs and recovery |
| `ulw-research` | Research directory for claims, observations and deliverables; standalone continuation uses session-owned `doc/ulw-loop/<session-id>/` goals referencing those records |

The lead owns shared workflow state. A nested graph uses the enclosing loop or execution objective rather than registering another goal. Native plan-mode children return proposed content without writing artifacts; the lead submits the canonical local plan through `xd://propose`, never ask/chat approval. Planning does not authorize implementation; workflow flags do not bypass OMP approval boundaries.

## Continuation and evidence

The installed extension can resume active loop-format or Boulder work owned by the current session. Resume the workflow identified by its brief and linked records: standalone research remains research when it reuses loop-format continuation state. The hook checks pending state, respects terminal/blocked state and stops repeating an unchanged fingerprint. A hook notification is not proof of completion; update state from the actual outcome.

Use the selected workflow's artifact schema and existing verifier where it has one. A checkpoint ties its criterion to the input identity, observed result and evidence location. Changed inputs invalidate dependent evidence, not unrelated completed work. Record the checks selected under model guidance, applicable native modes and project requirements rather than imposing a second generic verification pass.

Load linked references only when their artifact or state contract is needed. Tool documentation, not this file, specifies native task, workpool, wait, browser or memory APIs.
