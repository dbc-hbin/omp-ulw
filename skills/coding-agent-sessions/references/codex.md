# Codex Session Discovery

MODIFIED COPY for OMP discovery-only use; see `../ATTRIBUTION.md` and `../LICENSE.md`. Resolve `SKILL_DIR` from `skill://coding-agent-sessions` and apply its scope/privacy rules.

The scanner considers `$CODEX_HOME`, `~/.codex`, and each additional `--root` directory:

- `state_*.sqlite`: read-only thread metadata, first prompt, model/provider/usage, and child linkage when supported by the DB schema.
- `sessions/**/rollout-*.jsonl`: shared JSONL user-prompt search and metadata parser.
- `archived_sessions/rollout-*.jsonl`: direct archived rollout files (not an arbitrary recursive archive search).

```bash
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" list --platform codex --from 7d --limit 10
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" search --query "deploy" --query "deployment failure" --platform codex --cwd my-project --workers 32
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" find "migration" --platform codex --include-subagents
```

`--root` is the Codex data directory, not a rollout file, and adds to defaults. The newest 2,000 rollout files by mtime are parsed before filters; thread DB metadata itself is not capped at 2,000 rows. Duplicate `(platform, id)` entries are merged, preferring recovered parent/agent linkage while retaining cached user prompts from the duplicate rollout when present. Thus middle-prompt search remains available when a DB row wins the metadata merge. Unsupported legacy schemas may produce fewer metadata fields or no DB rows.

Subagent threads are ordinary thread records with their own rollout files. Linkage comes from `thread_spawn_edges(child_thread_id, parent_thread_id)` or `source.subagent.thread_spawn.parent_thread_id`; the source may be in the DB or a rollout `session_meta.payload`. Agent nicknames/roles are combined into an `agent` label. A string source such as `{"subagent":"review"}` supplies a label but may not supply a parent id; not every side thread can be classified as a child.

Search results are metadata summaries with first/last prompt previews (up to 300 characters) and reason snippets (up to 160); these can contain secrets. No full events, assistant output, or transcript reconstruction API is provided. Report only authorized relevant discovery evidence, and never claim the task was completed merely because a prompt matched.
