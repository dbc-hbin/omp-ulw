# Frida — Hook a Live Process and See Real Values at Runtime

Use this specialist only when its capability exists and answers the current hypothesis. Probe its installed executable/version before commands; read [OMP DAP](dap.md) for structured debugging and [setup](../methodology/00-setup.md) for bounds/ownership. Long commands use native async bash. GUI operations require skill://cua-driver.


**https://frida.re**

Frida injects a JavaScript engine into a running process and lets you intercept function calls, read arguments, patch return values, and trace execution without touching the binary on disk. **When static analysis in Ghidra shows you *what* a function does, Frida shows you what it does *right now*, with real inputs.** The two compose naturally: use Ghidra to find the target function and its offset, then use Frida to hook it and watch live traffic.

Choose Frida over Ghidra when you need runtime values (actual arguments, return codes, heap contents) or when the binary's control flow is too obfuscated for static analysis to resolve.

---

## Install

```bash
pip install frida-tools            # Python 3 required
frida --version                    # verify
```

On macOS, attaching to another user's process needs root (`sudo frida ...`). SIP-protected system binaries (`/usr/bin/*`, `/usr/sbin/*`) are off-limits entirely. On Linux, you may need `ptrace` permissions: run as root or select an authorized task-owned target; do not change system-wide ptrace policy automatically.

---

## Target discovery with `frida-ps`

```bash
frida-ps                         # list local processes
frida-ps -U                      # USB-connected device (iOS/Android)
frida-ps                        # identify the exact observed process id
```

---

## `frida-trace` — zero-code entry point

`frida-trace` auto-generates JavaScript handler stubs for every matched function. You don't write any code to start.

```bash
frida-trace -p <pid> -i "recv*"                               # trace exported functions by glob
frida-trace -p <pid> -m "-[NSURLSession dataTaskWithRequest:*]"  # Objective-C method
frida-trace -U -p <pid> -j "com.example.App!login*"             # Java method (Android)
frida-trace -f ./target -i "open"                               # spawn + trace from start
```

Generated handler files land in `__handlers__/`. Each looks like:

```js
// __handlers__/libSystem.B.dylib/open.js
{
  onEnter(log, args, state) {
    // args[0] is the first argument (a pointer)
    log(`open("${args[0].readUtf8String()}")`);
  },
  onLeave(log, retval, state) {
    log(`  => ${retval}`);
  }
}
```

Edit that file, save, and `frida-trace` hot-reloads it. This is the fastest path from "I wonder what this function receives" to a concrete answer.

---

## The JS agent API

When `frida-trace` isn't enough, you write a JS agent and load it with `frida` or from a Python host script. These are the building blocks.

### Find a function

```js
// By exported symbol name
const openPtr = Module.getGlobalExportByName("open");  // null = any module
const sslWritePtr = Process.getModuleByName("libssl.so").getExportByName("SSL_write");

// By offset in a stripped binary (get the offset from Ghidra)
const base = Process.getModuleByName("target").base;
const funcPtr = base.add(0x1a3c);
```

### Intercept calls

```js
Interceptor.attach(openPtr, {
  onEnter(args) {
    // args[0], args[1], ... are NativePointer objects
    const path = args[0].readUtf8String();
    const flags = args[1].toInt32();
    send({ event: "open", path: path, flags: flags });
  },
  onLeave(retval) {
    // retval is the return value as a NativePointer
    send({ event: "open_ret", fd: retval.toInt32() });
  }
});
```

### Read memory

```js
args[0].readUtf8String()          // read a UTF-8 C string from a pointer
args[0].readCString()             // read a raw C string (stops at null)
args[1].readByteArray(len)        // read len raw bytes (returns ArrayBuffer)
```

### Replace / stub a function

```js
// Force a function to always return 0 (e.g. bypass a license check)
Interceptor.replace(checkLicensePtr, new NativeCallback(function () {
  return 0;
}, 'int', []));
```

Use `Interceptor.replace` sparingly. It changes program behavior, so always note in your journal that you patched something and why.

---

## Python host script

A host script lets you load a JS agent, receive `send()` messages, and post-process results from the Python side.

```python
import frida, sys

with open("agent.js") as f:
    agent_source = f.read()

def on_message(message, data):
    if message["type"] == "send":
        print(f"[*] {message['payload']}")
    else:
        print(f"[!] {message}")

session = frida.attach(int(sys.argv[1]))
script = session.create_script(agent_source)
script.on("message", on_message)
script.load()

try:
    sys.stdin.read()                 # block until Ctrl+C
except KeyboardInterrupt:
    pass
finally:
    script.unload()
    session.detach()
```

The agent runs inside the target; the host script stays in your terminal and prints structured output.

---

## Output-budget discipline

**Hooking a hot function (e.g. `malloc`, `read`) will flood your context with thousands of lines.** Don't print every call. Aggregate in the agent and report a summary.

```js
// Count calls, report every 1000
let callCount = 0;
Interceptor.attach(mallocPtr, {
  onEnter(args) {
    callCount++;
    if (callCount % 1000 === 0) {
      send({ event: "malloc_summary", total_calls: callCount });
    }
  }
});
```

Alternatives: filter by argument value, only log calls from a specific caller module, or batch a bounded array and send at the exact workload-completion signal.

---

## ⚠️ Gotchas

**Attach vs. spawn.** `frida -p <pid>` attaches to an already-running process. If you need to catch early initialization (constructors, `main` entry), spawn the process with `frida -f ./target`. Frida pauses it at startup. Resume with `%resume` in the REPL or by calling `device.resume(pid)` from Python.

**Stripped binaries have no symbol names.** Export lookup does not resolve non-exported internal functions. You must find the function offset in Ghidra, then compute the address at runtime:

```js
const addr = Process.getModuleByName("target").base.add(0x4a20);
Interceptor.attach(addr, { /* ... */ });
```

**A crashing target kills your session.** If the target segfaults or aborts, Frida's agent dies with it. Capture terminal crash evidence first; restart only a bounded task-owned reproduction if necessary.

**Thread safety.** `onEnter`/`onLeave` fire on multiple threads. Keep shared state to simple counters.

---

## Cleanup

Walk the journal: stop only the owned process/session, detach from attached user targets, revert only owned hooks/settings and remove only exact owned scratch project/script paths. Preserve requested artifacts. Verify actual session/process state and [cleanup receipts](../methodology/09-cleanup.md); no pkill-by-name or wildcard deletion.
