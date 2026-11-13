# OpenCode Session Discovery

MODIFIED COPY for OMP discovery-only use; see `../ATTRIBUTION.md` and `../LICENSE.md`. Resolve `SKILL_DIR` from `skill://coding-agent-sessions` and apply its scope/privacy rules. Use the bundled finder rather than hand-written DB queries or raw transcript reconstruction.

```bash
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" list --platform opencode --from 7d --limit 10
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" search --query "proxy failure" --query "connection reset" --platform opencode --include-subagents
```

## Normal fast path (no extra root)

1. If an already installed `opencode` is on PATH, the scanner calls `opencode db path` (8-second timeout). It also considers `~/.local/share/opencode/opencode.db` and `$APPDATA/opencode/opencode.db`.
2. The existing database is opened **read-only** and its `session` table queried. Modern mode considers up to 50,000 non-archived sessions by update time; the legacy-column fallback considers 2,000. Prompt-preview/search text in this lane is the **session title**, not actual message content. Metadata includes cwd, model, usage, and parent/agent when those columns exist.
3. If DB discovery yields no sessions, the scanner may call the existing `opencode session list --format json --max-count 100` (8-second timeout). That fallback is also title/metadata-only and does not recover parent/agent fields.
4. If those yield no sessions, file fallback is used.

Do not install or update OpenCode to make the scan work. Invoking its CLI can have product-owned startup behavior; if executing that binary is outside the authorized scope, do not use the normal fast path. An explicitly approved file export with `--root` bypasses DB/CLI discovery, but still adds the ordinary file roots; it is not strict scope isolation by itself.

## File-store fallback

Supplying **any `--root` forces file-store mode**, even if a DB/CLI is available. File roots are `$OPENCODE_HOME`, `~/.opencode`, `~/.local/share/opencode`, `$APPDATA/opencode`, plus the explicit roots.

Recognized layouts:

- `messages/ses_*/*.json`: message metadata. The scanner joins user message ids to `parts/<message-id>/*.json` text and recovers first/last prompts, timestamps, cwd, model/provider. It does not retain all middle prompts for search in this lane.
- `storage/session/<project-hash>/ses_*.json`: session info/title/parentID/agent metadata. The scanner does **not** join this layout's sibling singular `storage/message` or `storage/part` directories; those sessions are title-only discoveries.

These are the implemented legacy/export layouts, not blanket support for every historical OpenCode store. Normal DB/CLI mode intentionally avoids heavy message/part joins. File mode has no fixed 2,000-file cap, unlike most other file scanners, and can be expensive; narrow the authorized source rather than passing a whole home directory.

Recognized children use DB `parent_id` / `agent` or info-file `parentID` / `agent`. Message-directory records alone do not recover that linkage; duplicate records are merged preferring the linked metadata. `--include-subagents` includes recognized children as standalone candidates; parent results show discovered immediate `subagent_count`.

All output remains bounded discovery summaries: titles/prompt previews may contain secrets, and matching snippets are not proof of what an agent concluded. There is no read/get API, raw SQL workflow, event dump, or source-session reconstruction in this skill.
