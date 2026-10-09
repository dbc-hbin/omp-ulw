# OMP debug - Drive DAP, not debugger text

Upstream dap.mjs was modeled on oh-my-pi's structured debug tool (github.com/can1357/oh-my-pi). This port uses the actual OMP debug tool; no copied DAP client, wrapper REPL, fixture adapter or STOP-prefix watcher is needed. Read the exposed schema before selecting an adapter. It supplies launch/attach, breakpoints, execution control, bounded stack/variables/memory, structured errors and session state.

## Interface choice and adapters

Use debug for DAP-capable source/native debugging. Browser runtime uses installed browser tools; Bun uses WebKit inspector, not V8/js-debug. No-source binaries combine Ghidra/static offsets with native debug or Frida/runtime values. If no compatible adapter exists, report that capability and use a supported targeted CLI/profiler, rather than install implicitly or fabricate a working adapter.

Probe installed adapter executables and versions first: Python debugpy; Go dlv (DAP differs from JSON-RPC); native/Rust/Swift/Zig lldb-dap or codelldb; GDB only if that installed build exposes DAP; JS/TS js-debug when supported by host discovery. Optional ecosystems include netcoredbg, rdbg, Kotlin/PHP/Bash adapters, Dart SDK adapter and Elixir LS; none is guaranteed installed. dlv dap is TCP with --listen, not an assumed stdio server. Do not claim Xcode always ships lldb-dap; inspect.

## Concrete Python scenario

Scenario: the repository's invoice script returns a zero total despite nonempty items. Discover its actual source path, line and launcher first. Substitute those observed paths below; the numbers illustrate the schema, not real evidence.

```js
await tool.debug({action:"launch",program:"/absolute/project/invoice.py",adapter:"debugpy",cwd:"/absolute/project"});
await tool.debug({action:"sessions"});
await tool.debug({action:"set_breakpoint",file:"/absolute/project/invoice.py",line:42});
await tool.debug({action:"continue",timeout:15000});
await tool.debug({action:"threads"});
await tool.debug({action:"stack_trace",levels:8});
```

Read the returned frame_id, then scopes using that frame_id, then variables using the returned variable_ref and count/offset. Evaluate only the distinguishing expression in that stopped frame. ids are from this session, never guessed; old scopes expire after continue. Request count:20 or bounded levels/memory instruction_count. Read output if a stop/exit/error needs clarification.

Before EACH breakpoint mutation, step/continue, side-effecting evaluate, memory write or termination, refresh sessions/threads and stop reason. A launch transport success or accepted breakpoint is not proof it bound or stopped. Pending breakpoint: inspect loaded_sources/path mapping and symbols. Missing stop: pause and inspect once, do not repeatedly poll. Adapter failed: verify binary/config; attach denied: inspect exact PID/permissions; terminated: preserve exit/crash evidence before restart.

Data watchpoints: data_breakpoint_info for the observed variable/frame, then set_data_breakpoint with its returned data_id and read/write access_type. Native inspection uses disassemble with an observed instruction_reference and bounded instruction_count, and read_memory with observed memory_reference and count. custom_request only for an adapter-supported documented command with actual arguments; no fictional wait_for_stop action.

## Cleanup and protocol quirks

Journal the debug session, target ownership, source/env changes and listeners. After receipt capture, refresh state and terminate only a launched task-owned target; detach an attached target through the documented adapter disconnect contract when supported. Inspect sessions and process/port ownership after cleanup. If safe detach is unavailable, name that blocker rather than kill the user process.

debugpy launch configurations require a compatible adapter id/console setup; let the host tool own that handshake. lldb adapters can emit a stopped event despite a confusing launch flag or thread 0: inspect actual events/state. Never copy the upstream client's assumptions about hard caps, TSV, 15-second defaults or permissive flags into the host tool contract.
