# OMP, gajae-code, OMO / Senpi / pi Discovery

MODIFIED COPY for OMP discovery-only use; see `../ATTRIBUTION.md` and `../LICENSE.md`. Resolve `SKILL_DIR` from `skill://coding-agent-sessions` and apply its scope/privacy rules. This shared format scanner is for candidate discovery, not an alternate OMP consultation API.

For **OMP-only** project history, prefer existing native Eval `archive` discovery after reading `xd://eval/archive`; preserve its current-project scope unless the user requests more. To consult a selected OMP session, use native `task` with the seance agent and **`sourceSession`**, following the advertised tool contract. Do not raw-read OMP JSONL, concatenate transcripts into a normal task, or use this script as a consultation workaround. If seance is unavailable or cannot resolve that session, report the limitation.

## Scanner keys and roots

| Platform key | Aliases | Default roots |
| --- | --- | --- |
| `senpi` | none | `~/.omo/agent`, `~/.senpi/agent`, `~/.pi/agent` |
| `oh-my-pi` | `omp`, `ohmypi`, `oh_my_pi` | `~/.omp/agent` |
| `gajae-code` | `gjc`, `gajae`, `gajaecode` | `~/.gjc/agent` |

Each also probes named `<config-root>/profiles/*/agent` directories. When `XDG_DATA_HOME` is explicitly set, the scanner probes `$XDG_DATA_HOME/<app>` and `<app>/profiles/*`, with app `senpi`, `omp`, or `gjc`; these XDG roots contain `sessions/` directly. It does not automatically substitute an unset variable with another XDG default.

Within each root the scanner considers `sessions/**/*.jsonl`, selecting the newest 2,000 files by mtime per platform before applying result filters. Session headers provide id/cwd/time; model changes/messages provide provider/model/usage; parsed user messages are retained in memory for search, including middle prompts. This is not a full assistant/tool-output search and does not reconstruct OMP delegation trees from tool calls.

For custom `PI_CONFIG_DIR`, `PI_CODING_AGENT_DIR`, or `GJC_CONFIG_DIR` installations, pass the **agent data directory containing `sessions/`** with `--root`. Those variables are not automatically honored by this finder. Extra roots add to defaults; they are not a sandbox. Explicitly select the intended platform for an export so the same generic JSONL is not scanned under several pi-family labels.

```bash
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" search --query "proxy retry" --query "connection reset" --platform senpi --from 7d
python3 -B "$SKILL_DIR/scripts/find-agent-sessions.py" list --platform gajae-code --cwd my-project --limit 10
```

An OMP cross-product lane can use `--platform oh-my-pi` alongside the other authorized platforms; a request already identifying a particular OMP session goes directly to seance instead. Returned ids/paths are candidate selectors, not permission to inspect unrelated histories.

The scanner reads session stores only. Do not open adjacent `auth.json`, model/config files, or credentials to enrich a result. Prompt previews and reason snippets can contain secrets; disclose only useful requested evidence, never full transcripts. Native archive recaps and discovery snippets are clues, not proof of the historical session's conclusions or completed verification.
