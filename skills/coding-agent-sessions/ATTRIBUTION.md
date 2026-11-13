# Source, license, and modifications

**MODIFIED COPY — OMP-native discovery-only adaptation (2026-11-13).**

Source: [code-yeongyu/oh-my-openagent, commit 793cb219586ff517762221aba0671bcf2d63ab86](https://github.com/code-yeongyu/oh-my-openagent/tree/793cb219586ff517762221aba0671bcf2d63ab86/packages/shared-skills/skills/coding-agent-sessions), under `packages/shared-skills/skills/coding-agent-sessions`.

The source repository's inspected root `LICENSE.md` assigns content not covered by a third-party license to the **Sustainable Use License, Version 1.0**. No different file-level license or third-party notice was present in the imported session skill/module files. The source license is copied verbatim to [LICENSE.md](LICENSE.md), including its acceptance, use/distribution limitations, modification-notice requirement, and disclaimers. This is not an MIT/Apache relicense; preserve that notice when distributing any part of this import.

## Imported source inventory

`find-agent-sessions.py` and every module below derive from the same pinned upstream `scripts/` path. The package uses Python's standard library only; no package install, bundled runtime, database, service, or config is added.

| Destination | Treatment |
| --- | --- |
| `SKILL.md` | Adapted discovery/search workflow, authorized scope, potentially sensitive excerpts, native archive/seance routing, installed path resolution and CLI contract |
| `references/all-platforms.md` | Adapted complete 26-platform root/coverage inventory and discovery limits; removed raw/detail consultation instructions |
| `references/claude.md` | Adapted main/child discovery coverage and limits |
| `references/codex.md` | Adapted thread/rollout discovery and spawn linkage |
| `references/opencode.md` | Adapted existing DB/CLI/file discovery lanes and their actual limits; no direct SQL or reconstruction workflow |
| `references/senpi.md` | Adapted pi-family roots and OMP-native archive/seance handoff; no credential/config inspection |
| `scripts/find-agent-sessions.py` | Launcher retained with `sys.dont_write_bytecode`, Python 3.11+ requirement and self-relative package path; detail example removed and runtime guidance limited to an existing compatible interpreter |
| `scripts/agent_sessions/__init__.py` | Unmodified package marker |
| `scripts/agent_sessions/aside_scanner.py` | Original Aside transcript/state join; read-only SQLite URI additionally escaped using `Path.as_uri()` |
| `scripts/agent_sessions/claude.py` | Unmodified Claude main/subagent scanner |
| `scripts/agent_sessions/cli.py` | Retained list/find/search, filters, query lanes, snippets and summary output; removed read/get aliases, detail/event/prompt reconstruction and detail hints; standard-library argparse validates the supported command/options before scanning |
| `scripts/agent_sessions/codex.py` | Original thread DB/rollout scanner, now using a read-only SQLite URI |
| `scripts/agent_sessions/file_scanners.py` | Unmodified OpenClaw, Droid, Amp, Gemini, Kimi, Qwen, Codebuff, Roo Code, Kilo Code, Cline and Aider scanners |
| `scripts/agent_sessions/jsonio.py` | Unmodified JSON and JSONL parsing/serialization helpers |
| `scripts/agent_sessions/kiro_scanner.py` | Unmodified Kiro state/paired Prompt-event scanner |
| `scripts/agent_sessions/opencode.py` | Original DB/CLI/file discovery lanes, now using a read-only SQLite URI |
| `scripts/agent_sessions/pi_family.py` | Unmodified separate Senpi, OMP and gajae-code discovery scanners |
| `scripts/agent_sessions/scanners.py` | Unmodified 26-platform registry, aliases, parallel scan and deduplication |
| `scripts/agent_sessions/sqlite_optional_scanners.py` | Original Kilo CLI, Hermes, Goose, Crush and Zed scanners, now using read-only SQLite URIs |
| `scripts/agent_sessions/sqlite_scanners.py` | Original Kodu and Cursor CLI scanners, now using read-only SQLite URIs |
| `scripts/agent_sessions/timeparse.py` | Unmodified date/timestamp helpers |
| `scripts/agent_sessions/transcript.py` | Unmodified shared parsing/search helpers; retained because scanner metadata and middle-prompt search depend on them, not a public transcript consultation API |
| `scripts/agent_sessions/types.py` | Unmodified session/options types and bounded summary serialization; full cached user prompts remain internal to search |
| `LICENSE.md` | Unmodified upstream root license notice |

No separate detail-only module existed upstream. Detail-only functions and imports were removed from `cli.py`; shared parsers still required by discovery/search were retained. Upstream `scripts/tests/`, fixtures, `agents/openai.yaml`, `AGENTS.md`, pyright configuration, package ignores and unrelated agent/config files were not imported. Root/slash-command integration and repository tests are maintained by the parent repository rather than copied from upstream.

This import does not claim that snippets are secret-free, that every version/store is supported, or that empty results establish historical absence. It emits bounded candidate summaries, never the upstream full-event read/get payload. Specific OMP historical consultation remains the installed native seance service with `sourceSession`; archive remains the native OMP project/history discovery surface.
