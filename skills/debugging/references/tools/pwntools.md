# pwntools - Reproducible binary and network interactions

Source: https://docs.pwntools.com/en/stable/ and https://github.com/Gallopsled/pwntools. Probe the installed package in the project's Python environment; do not add global dependencies implicitly. Use when exact bytes, prompts, process signals, ELF offsets, crafted input, bounded fuzzing or exploit reproduction distinguish the hypothesis. For native inspection pair with [pwndbg](pwndbg.md) or [OMP debug](dap.md).

## Core idioms

process launches an exact local command; remote connects to the observed authorized host/port; ssh provides a remote process tube when credentials/access already exist. They share send/sendline, recv(n), recvuntil, recvline, sendafter/sendlineafter and close. interactive is manual exploration only, never the end of an automated reproduction. Bound every receive and capture bytes verbatim. recvuntil timeout may return empty bytes rather than throw; verify the expected delimiter and distinguish timeout, EOF and clean completion.

Set context.binary = ELF(actual_path) for ELF arch/OS/endianness. Mach-O and PE are not ELF; choose a compatible parser/native tool instead of asserting ELF works everywhere. ELF.symbols, plt, got, functions, search and address expose symbols/offsets; set the observed PIE slide before computing runtime addresses. Match the loaded libc version, not an assumed path. Packing helpers p32/p64/u32/u64 respect context. ROP builds gadget chains; treat a crafted exploit as a bounded reproducer against the assigned target, not an unrelated attack track.

cyclic(length) creates a De Bruijn pattern; cyclic_find(crash_bytes, n=...) finds the offset using the same word width/endian as the pattern. Record the exact signal/register bytes. Avoid globally disabling ASLR: obtain the runtime base/slide and map static offsets instead. gdb.debug/gdb.attach require a compatible installed debugger/terminal; native debug can attach to an observed task-owned PID while the tube drives the input.

## Concrete malformed-record scenario

A local ELF record parser should reject a negative count without crashing. Create this owned script via write after reading the actual command/prompt contract. The path below is an example to replace with the observed binary. Subscribe to the prompt before sending; the finite receive timeout is a bound, not a sleep.

```python
from pwn import process
p = process(["/absolute/project/bin/records"])
try:
    prompt = p.recvuntil(b"record> ", timeout=5)
    assert prompt.endswith(b"record> "), repr(prompt)
    p.sendline(b"count=-1")
    result = p.recvall(timeout=5)
    status = p.poll()
    assert status is not None, "parser did not finish the request"
    assert status == 0 and b"invalid count" in result, (status, result)
finally:
    p.close()
```

Capture pre-fix failure and post-fix success using identical bytes and installed artifact identity. EOF/nonzero signal is evidence; exit 0 alone is not success. Journal the exact script, process and result path before creation. Preserve the requested repro, close every tube in finally and stop only processes it launched.

## Bounded fuzzing and exploit probes

Use an explicit seed, iteration cap and input-size bound; journal raw crashing inputs and signal/status. No unseeded random-to-green or indefinite brute force. Print bounded summaries and return crash data to the lead for write, rather than writing via embedded shell/Python. context.log_level=debug reveals sent/received bytes but may leak credentials; scope it to the exact input. Milestone logs and a final result are useful, success prose without observed output is not.

For an exploit PoC, record target hash/build, exact leak/payload bytes, loaded library identity, address calculation and the observable failure/fixed rejection. Never claim a ROP chain worked because construction succeeded. Remove only exact journal-owned scratch scripts/core dumps; no pkill target-name, wildcard /tmp deletion or global ASLR mutation.
