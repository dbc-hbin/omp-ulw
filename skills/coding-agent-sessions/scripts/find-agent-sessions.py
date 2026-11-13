#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# ///
# --- How to run ---
# python3 -B scripts/find-agent-sessions.py list --limit 20
# python3 -B scripts/find-agent-sessions.py search "commit" --from 7d
# Modified for OMP: discovery only; see ../ATTRIBUTION.md and ../LICENSE.md.
from __future__ import annotations

import sys

sys.dont_write_bytecode = True

import runpy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))


if __name__ == "__main__":
    if sys.version_info < (3, 11):
        found = ".".join(str(part) for part in sys.version_info[:3])
        _ = sys.stderr.write(f"find-agent-sessions requires Python 3.11 or newer (found {found}); use an existing python3.11+ executable.\n")
        raise SystemExit(2)
    _ = runpy.run_module("agent_sessions.cli", run_name="__main__")
