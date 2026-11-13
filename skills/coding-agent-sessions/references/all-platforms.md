# Cross-Product Discovery Stores and Limits

MODIFIED COPY for OMP discovery-only use; see `../ATTRIBUTION.md` and `../LICENSE.md`. Resolve `SKILL_DIR` from `skill://coding-agent-sessions` before any command. Observe the scope/privacy rules in that skill: snippets may contain secrets; do not enumerate unrelated histories or print full transcripts.

## Registered platforms and roots

All upstream scanner keys are retained. These are the actual recognized layouts, not a promise to discover every version of each product. A nonexistent optional root is skipped. Extra `--root` values are **additive** to defaults and are supplied to every selected scanner; select the intended platform when searching an export.

| Platform key | Default store / recognized layout | Shape of an extra root |
| --- | --- | --- |
| `codex` | `$CODEX_HOME` and `~/.codex`: `state_*.sqlite`, `sessions/**/rollout-*.jsonl`, `archived_sessions/rollout-*.jsonl` | Codex data directory |
| `claude` | `~/.claude`, `$APPDATA/Claude`: `projects/*/*.jsonl`, `transcripts/*.jsonl`, `pre-compact-session-histories/*.jsonl`, project subagents | Claude data directory |
| `senpi` | `~/.omo/agent`, `~/.senpi/agent`, `~/.pi/agent`, matching profiles; explicit `$XDG_DATA_HOME/senpi` | Agent directory containing `sessions/` |
| `oh-my-pi` | `~/.omp/agent`, `~/.omp/profiles/*/agent`; explicit `$XDG_DATA_HOME/omp` | Agent directory containing `sessions/` |
| `gajae-code` | `~/.gjc/agent`, `~/.gjc/profiles/*/agent`; explicit `$XDG_DATA_HOME/gjc` | Agent directory containing `sessions/` |
| `opencode` | Existing CLI DB path / `~/.local/share/opencode/opencode.db` / `$APPDATA/opencode/opencode.db`, then CLI listing; file fallback at `$OPENCODE_HOME`, `~/.opencode`, `~/.local/share/opencode`, `$APPDATA/opencode` | File-store directory: `messages/ses_*/*.json` + `parts/<message-id>/*.json`, or `storage/session/*/ses_*.json`; supplying a root bypasses DB/CLI |
| `openclaw` | `~/.openclaw`: `agents/*/sessions/*.jsonl`, `sessions/*.jsonl`, `session-backups/*/*.jsonl`, `session-backups/*/sessions/*.jsonl` | Product directory or parent containing `.openclaw` |
| `droid` | `~/.factory/sessions/*/*.jsonl`, optional sibling `.settings.json` | Product directory or parent containing `.factory` |
| `amp` | `~/.local/share/amp/threads/T-*.json` | Product directory or parent containing `amp` / `.local/share/amp` |
| `gemini` | `~/.gemini/tmp/*/chats/*.json` | Product directory or parent containing `.gemini` |
| `kimi` | `~/.kimi/sessions/*/*/wire.jsonl` | Product directory or parent containing `.kimi` |
| `qwen` | `~/.qwen/projects/*/chats/*.jsonl` | Product directory or parent containing `.qwen` |
| `codebuff` | `~/.config/{manicode,manicode-dev,manicode-staging,codebuff}/projects/*/chats/*/chat-messages.json` | Product directory or parent containing `manicode` / `codebuff` |
| `roo-code` | VS Code `globalStorage/rooveterinaryinc.roo-cline/tasks/*/api_conversation_history.json` | Extension directory or parent containing that extension id |
| `kilo-code` | VS Code `globalStorage/kilocode.kilo-code/tasks/*/api_conversation_history.json` | Extension directory or parent containing that extension id |
| `cline` | VS Code `globalStorage/saoudrizwan.claude-dev/tasks/*/api_conversation_history.json` | Extension directory or parent containing that extension id |
| `kodu` | VS Code `globalStorage/kodu-ai.claude-dev-experimental/db/Azad.db` | Extension directory or parent containing that extension id |
| `cursor-cli` | `~/.cursor/chats/*/*/store.db` | Product directory or parent containing `.cursor`; no `prompt_history.json` scanner |
| `aider` | `.aider.chat.history.md` at `~/local-workspaces`, `~/indent`, or at most two directory levels below them | Workspace/product root, scanned to that same bounded depth |
| `kilo-cli` | `~/.local/share/kilo/kilo.db` | Directory containing `kilo.db` |
| `hermes` | `~/.hermes/state.db` | Directory containing `state.db` |
| `goose` | `~/.local/share/goose/sessions/sessions.db` or `~/Library/Application Support/goose/sessions/sessions.db` | Directory containing `sessions.db` |
| `crush` | `~/.local/share/crush/crush.db` | Directory containing `crush.db` |
| `zed` | `~/Library/Application Support/Zed/threads/threads.db` | Directory containing `threads.db` |
| `kiro` | `~/.kiro/sessions/cli/*.json` with paired `*.jsonl` Prompt events | Product directory or parent containing `.kiro` / `kiro` |
| `aside` | `~/.aside/u/*/sessions/<date>_<id>/messages.jsonl`, optional per-user `state.db` | `.aside` directory, parent containing `.aside`, or exported user directory containing `sessions/` |

VS Code defaults are `~/Library/Application Support/Code/User/globalStorage`, `~/.config/Code/User/globalStorage`, and `$APPDATA/Code/User/globalStorage` when set. Home-based paths use the current OS home directory; not every optional product has native Windows autodetection, so pass the correct extra root. No host-wide drive, arbitrary browser-profile, or home-wide recursive search is added. Aside's `agents/*/sessions` hardlink mirrors are deliberately not scanned.

Aliases: `cursor` → `cursor-cli`; `factory` → `droid`; `roo`, `roocode` → `roo-code`; `kilocode` → `kilo-code`; `kilo` → `kilo-cli`; `omp`, `ohmypi`, `oh_my_pi` → `oh-my-pi`; `gjc`, `gajae`, `gajaecode` → `gajae-code`; `aside-browser` → `aside`. Repeat `--platform` rather than using commas. Unknown platform names fail instead of silently widening the scan.

## Coverage is bounded

- Most file scanners select the newest **2,000 files by mtime** before parsing. Claude main and subagent files have separate caps; Aside applies its cap per user directory. A larger result limit does not remove these bounds.
- Codex also reads thread metadata from each matching DB; rollout duplicates are merged by `(platform, id)` and cached prompt search data is retained. The DB metadata query itself has no 2,000-row cap.
- OpenCode DB mode searches at most **50,000 non-archived sessions** by update time (legacy schema: 2,000); CLI fallback: **100**. These lanes search titles/metadata, not full messages. File mode has different coverage; see `opencode.md`.
- Full middle-user-prompt matching is retained for shared JSONL scanners (Codex rollouts, Claude mains, pi-family, OpenClaw, Qwen), Droid, Kimi, and Aside. Other scanners generally retain only first/last prompts, titles, or a first Aider prompt even if they parse a longer source. Claude child discovery uses its first delegated prompt and metadata. Assistant/tool responses are not query fields.
- Subagent linkage is format-dependent: Claude child directories/meta, Codex spawn edges/source, OpenCode parent metadata, Aside state metadata. Missing linkage can make a child look like a main session. Inline old Claude sidechains are not separate discovered children. `subagent_count` counts discovered immediate children, not a reconstructed tree.
- Missing optional DBs and unsupported SQLite schemas return empty results. Invalid/unreadable JSON is generally skipped. Other filesystem/parse failures can still report an error; there is no completeness guarantee.
- Filters do not turn a scan into an access sandbox. `--root` does not remove defaults, and a date filter does not prevent parsing older selected files. For strictly isolated exported data use an approved isolated environment, not live unrelated stores.

Usage-only Copilot OTEL, Mux usage buckets, Antigravity caches, Synthetic provider retagging, and Cursor IDE usage CSV are intentionally excluded: they do not supply an independent supported prompt/session source.

## Search and handoff

For an authorized multi-product request:

```bash
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" search --query "deployment failure" --query "deploy retry" --platform claude --platform codex --from 7d --limit 10
```

Add `--include-subagents` if the task may have been delegated. Each query is a separate lane with its own reasons; merge candidates using `(platform, id)`. Summaries include bounded prompt excerpts, not transcripts, and may contain secrets. Share only requested relevant evidence. For a selected **OMP** session, consult native seance through `task` with `sourceSession`; never read raw OMP logs as a substitute. This finder has no read/get command or consultation API for any product.
