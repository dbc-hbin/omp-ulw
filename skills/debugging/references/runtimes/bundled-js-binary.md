# Bundled JS and embedded source binaries

Bun SEA, Node SEA, Deno compile, pkg, nexe, Electron and PyInstaller can look like native executables while app logic lives in a recoverable bundle. Tauri has extractable frontend and native Rust core. Read [native-binary.md](native-binary.md) for that core, not the whole JS VM.

## Workflow and fingerprint

Identify bundler -> locate source archive/section -> extract with format-aware bounds -> source-level static analysis -> runtime verification -> fix/report. Inspect file/size and bounded markers via grep or byte queries. strings is fingerprinting, never extracted-source ground truth.

| Marker | Format and extraction boundary |
|---|---|
| @oven/bun-darwin, bun-lockfile-format-v, // @bun | Bun compiled runtime plus usually plaintext JS; verify markers and bundle boundaries |
| NODE_SEA_BLOB and activated NODE_SEA_FUSE suffix :1 | Node resource/segment/note; plaintext only without useCodeCache/useSnapshot |
| pkg/lib/bootstrap.js, pkg/prelude, PAYLOAD_POSITION | pkg payload/prelude metadata; may contain V8 cache rather than text |
| ESZIP_V2, denort, deno_runtime | Deno eszip; use a compatible parser, not plain strings |
| Electron, app.asar, chrome.dll, Squirrel.Mac | Electron resources app.asar; validate its Pickle/JSON header |
| PyInstaller, pyz, _MEIPASS, pyi-os-utils | Compressed .pyc archive; extraction then version-compatible decompilation |
| nexe-, nexe_compile, :::nexe:: | nexe app source appended to Node, bounded by package metadata |
| Tauri, tao, wry, tauri::generate_context | frontend resources plus native core; two analysis tracks |

Outer shell and inner bundler may both match. Large Bun files contain tens of MB of runtime/package-resolver names unrelated to the app; do not attribute every marker as an app dependency.

## Locate and extract

Bun: find byte offsets for source banners/use strict/shebang using byte-safe inspection, then confirm contiguous app-source boundaries. A marker-to-next-NUL carve is heuristic; verify tail and format before trusting it. Node SEA: inspect NODE_SEA segment/resource/note via format metadata, verify :1 activation (not :0), and parse the blob with a version-compatible implementation or supported embedded node:sea access. postject injection and node --build-sea/--experimental-sea-config generate resources; do not invent a reverse-extract command or assume a CLI can recover code-cache/snapshots.

Deno: locate ESZIP_V2 and parse with a compatible eszip crate or documented parser; deno info on a compiled executable is not an archive inspector. pkg: follow actual payload/prelude offsets rather than treating marker location as payload start. nexe: parse its trailer metadata. Electron: discover the actual Resources/app.asar; the host supports archive member read such as archive.asar:member. Use read/glob for members where supported. Embedded asar requires Pickle-aware validated header/JSON and member bounds; arbitrary four-byte matches are not evidence. PyInstaller: use an installed version-compatible extractor/decompiler only if its generated artifacts are within the owned scratch scope and allowed by host file policy; .pyc is not plaintext Python, and Python-bytecode versions constrain decompilation.

Create every saved extraction/helper through write/edit, never shell redirection or an inline Python filesystem writer. Format libraries may parse bytes in memory and return content for write. No upstream script is copied or assumed available. Record exact binary hash/version, offset range, format assumptions, extraction tool/version, source member identity and case-safe output path.

## Source extraction fidelity

Search the recovered source with grep for concrete behavior constants; use read ranges and source-level symbols rather than decompile runtime VM. Minified aliases require assignment tracing (var T = actual-name), and source maps may be absent. Do not assume tree-shaken/dead branches execute.

Template literal scanning must preserve escaped backticks, dollar-brace interpolation depth, nested braces/strings and nested template literals. Function-body extraction must parse the parameter list separately: destructured parameters contain braces that are not the body. Prefer a compatible parser/AST; if a byte scanner is needed, validate delimiters and complete spans, not a regex cut at the next backtick. Compare extracted spans against original bytes. Short interpolation runs are silently lost by strings thresholds; lowering -n reduces loss but remains unsuitable for exact extraction.

APFS/NTFS case-insensitivity: minified cVR and CVR collide as filenames. Use unique numeric/hash-qualified output names; merely changing a common prefix does not distinguish case. Preserve manifest mapping from original identifier to unique output path. Do not overwrite user extraction files. Keep vendor source private and out of git; requested findings should cite locations and bounded evidence, not publish an entire recovered bundle.

## Runtime verification

Concrete scenario: a compiled Bun app ignores a runtime endpoint override. Confirm version and loaded artifact first, recover the env-reading/request-building span, then run the exact minimal request through the actual binary with a documented diagnostic mode. Inspect endpoint at construction, not merely static assignment. If available BUN_CONFIG_VERBOSE_FETCH=curl or true captures actual HTTP/fetch request data; verify supported installed Bun behavior and redact secrets. Capture user-level result as a second independent observation.

Bun compiled inspector accepts --inspect=host:port/prefix or BUN_INSPECT=host:port/prefix (without --); runtime uses WebKit protocol and debug.bun.sh, not V8/CDP. Node SEA/pkg/nexe inspector support depends on packaging/flags: probe actual --help/launcher, do not assume every app forwards --inspect. Electron has main-process Node inspector and renderer remote-debugging endpoint; journal both owned ports and use installed browser tools for renderer behavior. Tauri Rust commands use native debugging independently of frontend state.

APP_DEBUG/APP_LOG_LEVEL/APP_LOG_FILE are examples of app-specific contracts, never guaranteed flags. Discover supported settings first. Long launches/captures are native async bash with exact completion signals/handles. If credentials/quota/network block the real call, gather [partial-runtime evidence](../methodology/partial-runtime-evidence.md) and bound the conclusion; no stubbed response proves vendor behavior.

## Gotchas, silent failures and cleanup

Compare installed binary/version with the vendor manifest before interpreting missing features; fetching version metadata is read-only, reinstall is a separate mutation. Check baked build-time process.env values, bun:// import.meta.url paths, unreachable bundle code, worker sub-bundles with diverging dependencies and minified case variants. App/source identity mismatch is a hypothesis, not permission to rerun an installer blindly.

If only V8 cache/snapshot/bytecode is available, use appropriate version-compatible tooling and native runtime tracing as necessary; do not claim readable source was extracted. Ghidra can aid native boundaries but is not a universal bytecode decompiler.

Journal exact recovered files/helper paths, inspector sessions, scoped env, source-byte captures and scratch directories. End only owned sessions, remove only owned extractions under the host deletion policy, preserve requested evidence privately, and surgically undo instrumentation. No /tmp/_MEI wildcard removal or deletion of another run's artifacts.
