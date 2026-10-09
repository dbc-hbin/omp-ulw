# Native binary debugging - No trustworthy source

Coordinate [Ghidra](../tools/ghidra.md), [pwndbg](../tools/pwndbg.md), [pwntools](../tools/pwntools.md), [Frida](../tools/frida.md) and [OMP debug](../tools/dap.md). Read the matching references before their domain commands. Verify executable availability and architecture; missing Linux tooling on macOS is a capability gap, not an install mandate.

## Discriminate bundled apps first

file reports Mach-O/ELF/PE but not whether the payload is native code. Size over roughly 50 MB and Bun/node_modules/webpack/esbuild/deno/pkg/Electron/PyInstaller/nexe/NODE_SEA_FUSE/Tauri markers suggest a bundled runtime. Inspect marker evidence using grep on the discovered artifact or bounded binary bytes; open [bundled-js-binary.md](bundled-js-binary.md) when indicated. Tauri may need both references. Size/empty strings are heuristics, not conclusive classification.

## Ordered workflow

1. Triage: identity, architecture, linkage, symbols, security posture and input contract.
2. Dynamic tracing: actual syscalls/library calls, focused by the scenario.
3. Static analysis: Ghidra decompile the narrowed function and callers.
4. Dynamic debug: confirm its branch/value/address with native DAP or compatible debugger/Frida.
5. Scripted repro: lock exact input bytes with pwntools or repository owner test.
6. Minimal source fix or evidence-backed report/authorized binary remediation.

Do not start by decompiling the whole runtime. Triage and tracing choose the few functions to analyze.

## Triage and byte fidelity

Use file; on ELF readelf -h/-d, nm -D, objdump -T and the installed checksec; on Mach-O lipo -info, otool -h/-l/-L and codesign metadata. nm tells symbol availability. Treat ldd execution of an untrusted target as target execution; prefer static import inspection first. Record HEAD/build/hash, loaded library paths/version, NX/PIE/RELRO/canary/FORTIFY where applicable, interesting constants and the first hypothesis surface.

strings is fingerprinting only. Its minimum run length silently drops short interpolations such as dollar-brace-x (four bytes), short constants and error codes. For extraction read byte-precise offsets with the host read binary route or a bounded in-memory Bun byte query, not strings as the source of truth. Never issue file edits from byte-analysis code; write/edit owns saved output and patches. Do not infer template content from a filtered strings dump.

If source exists, use a task-owned build directory with -g -O1 -fsanitize=address,undefined for C/C++ and reproduce the same input. Do not make clean a shared user build. Sanitizers reveal invalid-access/allocation/free stacks; inspect installed compiler support before selecting flags.

## Dynamic tracing and platform constraints

Linux strace -f -e trace=network or trace=file narrows syscalls; ltrace -f -e 'str*+mem*' narrows libc calls. Start long captures through native async bash and journal exact output path/handle. macOS dtruss/dtrace may be blocked by SIP, hardened runtime and permissions; zero events are not proof no calls occurred. Do not disable SIP. Use task-owned unsigned debug builds when available, native debug/lldb, Frida if permitted, or documented app logs/unified logging. otool and codesign reveal Mach-O load commands, linked libs, flags/entitlements; signature state alone is not a universal attach rule.

Inspect unexpected config open, external connect, getenv NULL, repeated poll/epoll_wait without progress, swallowed signal and dlopen path/version. Each is a hypothesis to test, not a verdict.

DYLD_INSERT_LIBRARIES / LD_PRELOAD shims may observe the real call. Journal the shim and use absolute paths. Distinguish restricted/SIP processes stripping DYLD vars; hardened runtime library validation rejecting an unapproved signer; and Gatekeeper translocation breaking relative paths. Inspect __RESTRICT, codesign flags/entitlements and exact library-validation log. Do not re-sign user artifacts or loosen machine security without explicit scope. App-level logs are an alternative only if the app actually supports the documented settings; APP_DEBUG is not universal.

## Network capture ownership

Prefer a task-local proxy with command-scoped HTTPS_PROXY and CA paths. URLSession/system-network clients may ignore them. If system proxy/trust changes are explicitly authorized, map the default interface to its actual network service, capture the complete original HTTP/HTTPS proxy configuration and exact existing trust before mutation, use an owned proxy config/CA and fingerprint, and restore the prior configuration in finally. Turning proxy off or deleting a certificate by common name is not restoration. If authorization/capability is absent, use [partial evidence](../methodology/partial-runtime-evidence.md); never claim uncaptured wire bytes.

## Confirming static claims dynamically

Use Ghidra string/import xrefs to find the function, retype/rename only analysis annotations, record its static base and image offset. Read the actual loaded image slide and compute runtime addresses; a decompiler address is not necessarily a file offset. Native debug can disassemble/read_memory with bounded counts and set_instruction_breakpoint on that observed address. Watch the suspect buffer/field from allocation using data_breakpoint_info + set_data_breakpoint when supported; remove scarce hardware watchpoints when no longer needed. Refresh thread/stop state before mutations.

Concrete scenario: a malformed length crashes a parser. Capture the exact input and signal; sanitizer or Ghidra points to length arithmetic before memcpy. Stop before that copy, capture size/available bytes and allocation, then watch the affected region to catch the writer. Toggle the single suspected bound in an owned source hunk or task copy, reproduce success, and surgically undo it to reproduce failure. A crash disappearing under a debugger is not causal confirmation.

## Remediation choices

Prefer source patch/rebuild. A tiny binary patch requires explicit assigned scope, exact original bytes, verified virtual-to-file mapping and task-owned copy; use the host binary edit/write contract, never printf|dd on the live user binary. A scoped shim is another option when ABI/loader policy permits it. If no safe patch is feasible, produce the triage, exact reproducible input/script, narrowed decompilation/address, observed causal chain and recommended patch sketch. Do not send the upstream report externally without user authorization.

## Silent failure and cleanup

Inspect ignored read/write/malloc return codes, errno/GetLastError never read, signal handlers swallowing faults, setjmp/longjmp skipping cleanup, assertions compiled out and stale freed memory appearing valid. Cleanup owned debug handles, hooks/shims, scratch analysis and exact captures only; preserve requested evidence. Restore only owned temporary source hunks and approved prior settings. See [cleanup](../methodology/09-cleanup.md).
