# Phase 0 + 1 - Environment assessment and journal setup

Runtime truth starts with identifying the actual process, launcher and working inputs. Discover and read the manifest (Python pyproject/requirements/lock, JS package.json/tsconfig, Rust Cargo/toolchain, Go go.mod, native build configuration), then read the matching runtime reference before attaching. Use find/glob/read for discovery and inspection, grep for literals, and LSP for definitions/callers.

## Phase 0 - Map the ground truth

Record runtime version, interpreter/binary path and launch command; debug/app ports and existing instances; source maps/DWARF and loaded source paths; required config/env/auth; existing failing test or exact reproduction; watchers and supervisors. Do not stop an existing user process to make room. Use an owned port/profile or attach to the identified process with the authorized scope. Disable only task-owned watchers that would invalidate the session.

Bound every observation: stack levels, variable offset/count, byte count, disassembly instruction count, targeted log ranges. Page more only when necessary. An uncertain process identity, missing config, or pending breakpoint is not readiness to investigate the app.

## Phase 1 - One lead-owned journal

Read any existing journal first. Reuse only when it belongs to this bug/session; otherwise create a uniquely named local:// journal or task-owned scratch file using write. Do not overwrite another journal or modify git ignore files by default. The lead is its sole writer; children return evidence.

Journal BEFORE making each instrumentation edit, starting a process, binding a listener, setting an env override, creating a fixture, changing debugger state, or extracting bytes. Record exact ownership and recovery, not a whole-file git restore.


debug journal fields:
- Goal, original bug scenario and observable stop criteria.
- Environment: runtime/version/launcher, process PID and ownership, ports, loaded paths, required config, HEAD and current dirty/untracked inputs, references read.
- Hypotheses: claim, orthogonal axis, exact distinguishing observation and query, if-true fix cost, status.
- Consecutive failed rounds and Oracle Triple synthesis.
- Artifacts: exact path/process/session, pre-edit bytes or owned hunk, reason, cleanup action, cleanup receipt or evidence retention reason.
- Timestamped findings: raw value, source file:line/address/command, interpretation, H number.
- Root mechanism, toggle proof, failing reproduction, minimal fix, final checks, real-surface QA, follow-ups.

Example artifact: src/handler.py - insert breakpoint at observed line; cleanup uses edit to remove only that insertion against current contents. Do not checkout the file. Example listener: task-owned debugpy PID and 127.0.0.1:5678; terminate its debug session and inspect the port owner, never pkill by name.

A single journal survives compaction and allows deterministic cleanup. Preserve requested diagnostic evidence separately; remove only journal-owned temporary resources after receipts are recorded.
