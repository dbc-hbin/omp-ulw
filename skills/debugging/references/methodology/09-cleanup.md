# Phase 9 + 10 - Cleanup and final verification

The session delta must contain only the real fix, its owner regression where appropriate, and requested retained evidence. The pre-existing dirty tree is not yours to clean.

## Phase 9 - Walk the ownership journal

Read the journal and current contents before every cleanup. Remove only instrumentation hunks you inserted via edit. Never git checkout/restore/reset a whole shared file, never wildcard-delete scratch files, never pkill by command name. For a saved original hunk, match its current context and apply the smallest owned reversal; if user edits overlap, preserve them and resolve the conflict explicitly.

Terminate the native debug session; stop only task-owned async process handles. Attached user processes stay alive unless termination was explicitly authorized. Inspect session state/process identity and the exact listener port after cleanup. End only task-owned browser/GUI sessions and profiles without clearing signed-in user data. Restore scoped env overrides to prior values; prefer command-scoped env so restoration is automatic. Remove exact journal-owned fixtures, scratch Ghidra projects, extracted bundles, hooks/shims and core dumps only after ownership confirmation and under host file-deletion policy. Never remove existing global caches, user traces, or certificates by common name.

For authorized proxy/system changes, restore the entire captured original service configuration (host, port, auth/bypass and enabled state), not merely proxy-off. Remove only the exact certificate fingerprint you installed. Record whether hook replacement was reverted and Frida detached. Failed cleanup blocks completion; requested retained evidence receives a path, privacy status and retention receipt.

Inspect git status --short and git diff --stat, then actual owned diffs against the pre-session snapshot, including untracked inputs. Scan owned edits for debugger;, breakpoint(), dbg!, DEBUG prints, temporary marker comments, commented trial code and unrelated formatting. Pre-existing instances are findings, not deletions. Copy required evidence out of the disposable journal before removing it; do not erase proof needed by the final report.

## Phase 10 - Four evidence gates

1. Red-to-green toggle: exact original reproduction, pre-fix failure and post-fix success, linked artifacts. A causal toggle must toggle the bug; otherwise mark mechanism unconfirmed.
2. Related/package and repository-required final checks: invocation and observed summary, not invented counts. Explain unavailable checks and pre-existing failures. No phrase-pinning tests for pure prose; regressions live where the repository tests the behavior.
3. Real-surface QA: exact original scenario, expected and raw observed result. Partial evidence remains partial and names the unavailable operation.
4. Artifact cleanup: journal resource receipts and session-delta inspection preserve user work and requested evidence; only owned fix/test/evidence remains.

Final report: mechanism and source pointer; minimal fix; failing/passing proof; final checks; real QA; cleanup/evidence paths; out-of-scope follow-ups. Keep unverified claims explicit. Never declare a blocked gate passed or commit without a separate user request.
