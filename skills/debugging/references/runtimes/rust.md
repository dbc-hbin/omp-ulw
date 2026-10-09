# Rust Debugging

## Concrete runtime probe and ownership

Scenario: a tokio job disappears without completing its public operation. Run the exact command with scoped RUST_LOG and RUST_BACKTRACE; inspect the JoinHandle result and Result-discarding branches. Use native debug/lldb for unsafe memory or FFI and tokio-console when existing instrumentation is available. Journal any added dbg!, span or console-subscriber config so only owned hunks are removed. All long-running commands use native async bash and collected completion handles. These recipes are alternatives selected for the hypothesis, not a mandatory sequence of installs or test reruns. Native DAP is preferred over text scraping. Keep terminal commands only as documented fallback for a verified missing adapter.


Covers `cargo`, `tokio`, panics, and the fact that you usually don't actually need a debugger — Rust's type system, `dbg!`, and logging cover 80% of sessions faster than gdb would.

---

## Environment detection (Phase 0)

Discover manifests with find/glob and read their actual launch scripts, dependencies, profile flags and source maps. Probe the selected runtime/adapter versions via bash. Check only the observed listener ports with lsof and identify existing owners; do not kill them. Use grep for source literals and LSP for symbol/caller inspection. Read [OMP DAP](../tools/dap.md) before launch/attach.

---

## The Rust debugging hierarchy (use in this order)

Rust's ecosystem has a specific order that's faster than reaching for gdb first:

1. **`dbg!(expr)` macro** — for a single value at a specific spot. Prints file:line + value, returns the value unchanged so you can inline it. Faster than a debugger for 60% of bugs.
2. **`RUST_LOG=trace` with `tracing` / `env_logger`** — for flow and state across an operation. Zero code change in dev-time.
3. **`RUST_BACKTRACE=1` / `=full`** — for crashes. Almost always sufficient; you rarely need a live debugger for a panic.
4. **`rust-gdb` / `rust-lldb`** — when you need to pause execution and inspect memory, especially for unsafe code or FFI.
5. **`tokio-console`** — for async deadlocks, stuck tasks, hot loops.
6. **`cargo-expand`** — when a macro is doing something weird.

Reach for the lightest tool that answers the hypothesis.

---

## `dbg!` — the underused macro

```rust
let x = 5;
let y = dbg!(x * 2);   // prints: [src/main.rs:2] x * 2 = 10
```

Inside a complex expression:
```rust
let total = items.iter().filter(|i| i.active).map(|i| dbg!(i.cost)).sum::<u64>();
```

Multiple values at once:
```rust
dbg!(&user, &request, elapsed.as_millis());
```

`dbg!` writes to stderr, so it won't corrupt stdout-based pipelines. **Journal each `dbg!` you add**; revert at Phase 9.

---

## `RUST_LOG` for flow-level debugging

If the codebase uses `tracing` or `env_logger`:

```bash
RUST_LOG=debug cargo run
RUST_LOG=trace cargo run                          # very verbose
RUST_LOG=my_crate=trace,hyper=info cargo run      # per-module level
RUST_LOG=debug,tokio=off cargo run                # silence noisy crates
```

For `tracing`-based apps, instrument with spans:
```rust
#[tracing::instrument]
fn handle_request(req: &Request) -> Response { ... }
```

This gives you structured per-call entry/exit logs with args and timing, zero additional code in the body.

---

## `RUST_BACKTRACE` for panics

```bash
RUST_BACKTRACE=1 cargo run       # backtrace on panic
RUST_BACKTRACE=full cargo run    # include libstd/tokio frames
```

The panic itself usually tells you the file:line. The backtrace tells you how it got there. Between the two, most crash bugs are solved without a debugger.

---

## rust-gdb / rust-lldb

### Launch

```bash
# Build with debug symbols (default dev profile)
cargo build

# Attach gdb wrapper (applies Rust type pretty-printers)
rust-gdb ./target/debug/my_binary
# Or lldb:
rust-lldb ./target/debug/my_binary

# With args
rust-gdb --args ./target/debug/my_binary arg1 arg2

# Attach to running process
rust-gdb -p <observed-pid>
```

### Breakpoints

Rust symbols are mangled. Use either:

```
(gdb) b main                                  # main function
(gdb) b my_crate::module::function            # canonical path
(gdb) b src/handler.rs:42                     # file:line
(gdb) info functions my_function              # find mangled name
```

### State inspection

```
(gdb) p x                        # print value (uses Rust pretty-printer for Vec, Option, HashMap, etc.)
(gdb) p *ptr                     # deref
(gdb) info locals                # all locals in current frame
(gdb) info args                  # function args
(gdb) bt                         # backtrace
(gdb) frame <n>                  # switch to stack frame n
(gdb) watch my_var               # stop when my_var changes
(gdb) rbreak regex               # breakpoint all functions matching regex
```

**Pair with pwndbg** for better layout on native bugs — see [tools/pwndbg.md](../tools/pwndbg.md). Pwndbg works with rust-gdb too.

---

## Sanitizers — memory and race bugs

Nightly Rust exposes LLVM sanitizers through `-Z sanitizer`. Use them when a crash,
data race, or leak is otherwise too timing- or state-dependent to explain from a
backtrace; they replace guesswork with a report at the invalid operation.

```bash
# AddressSanitizer: out-of-bounds accesses and use-after-free
RUSTFLAGS="-Zsanitizer=address" cargo +nightly run --target <supported-target-triple>

# ThreadSanitizer: data races between threads
RUSTFLAGS="-Zsanitizer=thread" cargo +nightly test --target <supported-target-triple>

# LeakSanitizer: leaked allocations at process exit (not merely all reachable memory)
RUSTFLAGS="-Zsanitizer=leak" cargo +nightly run --target <supported-target-triple>
```

`address` catches invalid memory access and use-after-free, `thread` catches unsynchronized
concurrent accesses, and `leak` reports memory that was allocated but not released. Run
the invocation that matches the suspected class; sanitizer diagnostics are especially
useful before attaching a debugger to optimized or timing-sensitive code.

---

## rr — time-travel debugging

On supported Linux systems, record the failure once, then replay it deterministically and
run backwards from the failure with `reverse-continue` or `reverse-step`:

```bash
rr record ./target/debug/my_binary
rr replay
# (rr) reverse-continue
# (rr) reverse-step
```

Check rr's supported Linux CPU/kernel contract; it does not run on macOS, including Apple Silicon;
use `rust-lldb` or a sanitizer there instead.

---

## tokio-console — async task debugging

For tokio-based async apps, this is essential when tasks are stuck or leaking.

```bash
# Add tokio-console instrumentation to the target binary
# In Cargo.toml:
#   [dependencies]
#   console-subscriber = "0.2"

# In main.rs:
#   console_subscriber::init();

# Build with tokio_unstable:
RUSTFLAGS="--cfg tokio_unstable" cargo run

# In another terminal:
tokio-console                     # connects to default port 6669
```

Shows live tasks, their state, wake counts, poll durations, parent tasks. The single fastest way to find "why is my async thing stuck".

---

## cargo-expand — when a macro is suspect

```bash
cargo expand --version   # probe an existing installation; install only if separately authorized
cargo expand                      # expand all macros in the crate
cargo expand my::module::path     # scope to one item
```

If you suspect a macro (especially `#[derive]`, `#[tokio::main]`, `#[async_trait]`) is generating code that doesn't match your mental model, this shows you exactly what the compiler sees.

---

## Release-build gotcha

```bash
cargo build --release                        # no debug symbols by default
```

If the bug only shows up in `--release`:

```toml
# Cargo.toml
[profile.release]
debug = true                                 # add symbols, keep optimizations
```

Now `rust-gdb ./target/release/my_binary` works on release builds. This is required when optimization-enabled codegen bugs (inlining, LLVM folding) are suspected.

---

## Silent-failure patterns in Rust

| Pattern | Why it's silent |
|---|---|
| `.unwrap_or_default()` | Masks errors as the zero value |
| `.unwrap_or(fallback)` | Same, with a specific fallback |
| `let _ = fallible_operation()` | Explicitly discards the Result, no compiler warning |
| `if let Ok(x) = ... { use(x); } // no else` | Silent on Err |
| `.ok()` chaining | Converts Result to Option, throwing the error away |
| Panic inside a tokio task not `.await`ed | Task dies silently; runtime usually logs but it's quiet if logs are off |
| `eprintln!` that goes to a redirected-null stderr | Looks like nothing happened |
| `Drop` impl that panics under specific condition | Double-panic aborts process silently if no logging configured |

---

## Phase 9 cleanup specifics

Terminate only task-owned native debug sessions and async process handles. Read and surgically remove only your journaled instrumentation hunks; preserve user edits. Restore command-scoped env to prior values; remove exact owned profiler/debug output paths after preserving requested evidence. Inspect the exact listener owner and debug session state. See [cleanup](../methodology/09-cleanup.md).
