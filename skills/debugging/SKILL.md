---
name: debugging
description: "Diagnose runtime failures, test hypotheses, and verify scoped fixes."
---

# Debugging

Start with the reported failure, existing code and logs, and the smallest safe reproduction. An investigation-only request produces findings, not edits. Preserve unrelated user changes and require the applicable authorization for destructive actions, external writes, and commits.

## Working loop

1. Identify the actual launcher, runtime, inputs and expected behavior. Inspect existing tests and logs before adding instrumentation.
2. Form competing hypotheses and choose the observation that distinguishes them. Use bounded runtime values, timings, errors and state; code reading alone does not prove a cause.
3. Run the smallest relevant experiment. Batch independent reads; serialize debuggee mutations. Re-observe process identity and stopped/running state before debugger actions.
4. When fixes are authorized, change the root cause and use the repository's regression coverage. Capture the failing reproduction before editing, then verify the same scenario and relevant checks after the fix. Never weaken a failing test or suppress errors.
5. Remove only owned instrumentation and resources. Report observed evidence, remaining uncertainty and anything that could not be verified. Stop when the requested outcome and checks hold.

Keep a record of temporary files, processes, ports, scoped environment overrides and instrumentation before creating them; preserve requested evidence and verify cleanup. Ordinary code/log inspection and CLI timing probes do not require a separate debug bootstrap, journal file, debugger, specialist tool or phase-reference read.

## Load references only when needed

Activation is not a document-loading phase. Start the investigation immediately from the loop above. Reuse relevant instructions already read in this session; do not reread them on each turn or load adjacent workflows. Consult the [OMP contract](../ulw-loop/references/omp-contract.md) only for native dispatch, result handling or workflow-state semantics not resolved by the current tool schemas and host instructions.

This conditional OMP-contract loading and same-session reuse policy applies throughout this workflow, including all referenced documents, and supersedes their unconditional OMP-contract read directives. Operation-specific reference requirements remain binding.

Read the matching runtime reference **before attaching a debugger or instrumenting that runtime**, not merely because code uses that language:

Static operations have separate triggers: read [native binary](references/runtimes/native-binary.md) before analyzing a binary without trustworthy source, and read [bundled JS binary](references/runtimes/bundled-js-binary.md) before extracting source from a bundled application, even without debugger attachment or instrumentation. Ordinary source/log inspection and CLI timing probes do not trigger these reads.

| Runtime | Reference |
|---|---|
| Python | [python](references/runtimes/python.md) |
| Node.js, tsx, Bun or Deno | [node](references/runtimes/node.md) |
| Rust | [rust](references/runtimes/rust.md) |
| Go | [go](references/runtimes/go.md) |
| Native binary without source | [native binary](references/runtimes/native-binary.md) |
| Bundled application source extraction | [bundled JS binary](references/runtimes/bundled-js-binary.md) |

Read a specialist's reference only after choosing that tool for a concrete hypothesis; tool availability is not a reason to install or invoke it:

- Structured debugger launch/attach: [DAP](references/tools/dap.md).
- Browser reproduction or browser QA: [browser QA](references/tools/browser-qa.md); use the actual installed browser skills and real rendered surface.
- Native decompilation, debugging, crafted interactions or live instrumentation: [Ghidra](references/tools/ghidra.md), [pwndbg](references/tools/pwndbg.md), [pwntools](references/tools/pwntools.md), or [Frida](references/tools/frida.md), respectively. An unavailable tool is a capability gap, not evidence or a mandatory installation.

Use methodology references when the working loop cannot resolve that specific step, rather than reading one before every phase:

| Need | Reference |
|---|---|
| Complex environment or instrumentation ownership | [setup](references/methodology/00-setup.md) |
| Hypothesis design or parallel investigation contracts | [investigation](references/methodology/02-investigate.md) |
| Intermittent failure | [flaky triage](references/methodology/03-flaky-triage.md) |
| Two inconclusive investigation rounds | [oracle triple](references/methodology/04-oracle-triple.md), then [escalation](references/methodology/05-escalate.md) if still unresolved |
| Regression proof or fix verification is unclear | [fix](references/methodology/06-fix.md) |
| Real-surface QA procedure is unclear | [QA](references/methodology/08-qa.md) |
| Cleanup ownership or final evidence is unclear | [cleanup](references/methodology/09-cleanup.md) |
| Runtime access is blocked or an extraction needs an independent verification oracle | [partial runtime evidence](references/methodology/partial-runtime-evidence.md) |

## Source

Adapted from omo 5.1.19 `plugin/skills/debugging` and `packages/shared-skills/skills/debugging/SKILL.md`, checked 2026-10-08. Runtime and specialist references retain their operational safeguards; the entry provides an immediate working loop and loads detailed guidance only for the operation that needs it.
