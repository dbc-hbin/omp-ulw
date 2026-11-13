# Connection, ownership and setup

Read `xd://eval/browser` first. Ordinary interaction does not require a relay. Pick the state the
task actually needs, inspect the backend returned by open and keep a short task-specific name.

## Managed and explicitly spawned browsers

The live contract determines selection. The native owned/headless WebKit (ABKit) backend was
already introduced in 18.19; it is not an 18.20-only feature. With no `app`, selection is the first
applicable route: enabled relay, configured `browser.cdpUrl`, Tern inside a Tern pane, cmux, then
OMP's own browser. The owned default uses installed headless WebKit, downloading it first when no
browser is installed, otherwise managed Chromium. `browser.webkit` or `PI_BROWSER_WEBKIT=0` can
disable that default WebKit choice. These selection rules do not authorize installing engines,
enabling the relay or changing persistent settings; follow the task's setup permissions.

`app: "auto"` skips only the relay. `app: "own"` also skips configured CDP, Tern and cmux, choosing
installed WebKit otherwise Chromium; it does not mean Chromium or an isolated profile.
`app: "chromium"` explicitly selects managed Chromium. Inspect the open result's backend and any
fallback before using a backend-specific recipe. `headed` requests visibility, not necessarily
Chromium: WebKit has a viewer on macOS; elsewhere a visible owned browser uses Chromium.

Managed Chromium installs on first use if needed and shares a project browser. A new name gives a
new page, not proof of a new profile. Do not clear shared state to manufacture a clean test. When
fresh profile isolation matters, use an observed, installed Chromium-family executable with
its path as `app` and a task-owned temporary `--user-data-dir` in `argv`. Create that directory through
the available file/process tools, record ownership and pass its actual path; never point it at the
user's live profile. Apply permissions/install rules before adding software. A separately spawned
application is not the same as attaching to the user's Chrome.

A CDP endpoint URL given as `app` attaches to an explicitly selected, reachable CDP discovery endpoint. Do not restart
a user's browser with debugging flags, change browser security settings or copy profiles as hidden
setup. A remote browser is still that browser's real account and network context.

## Owned WebKit (ABKit)

This is OMP's own browser, not Tern's WKWebView picture-in-picture and not the user's Chrome login.
The open result identifies `omp's headless WebKit browser` or `omp's WebKit browser (in a window)`.
An owned WebKit engine that cannot start can fall back to Chromium; record that result instead of
claiming WebKit coverage. `app: "webkit"` requires WebKit and can download a missing engine; it
fails if that download fails or if `headed: true` requests a viewer the platform does not ship.
Do not use this option as a hidden install or as a retry after a refusal.

WebKit is off screen unless shown. Where its viewer exists, opening a live named tab with `headed`
can show or hide it, and the user can interact with its window. It has no adoptable `target`; use
the explicit relay/CDP/Tern procedure for existing authenticated state. A visible WebKit page is
not proof of access to that state.

Normal observation, input and diagnostic/network capture come from the engine. Page-world changes
such as routes, some emulation, init scripts, React/vitals instrumentation and recording overlays
can still be detectable; this is not a fingerprint, security or challenge-bypass guarantee. Respect
the backend limits in [commands.md](commands.md) and [network.md](network.md), especially missing
wire response bodies, Chromium tracing and reduced-motion emulation. Switch an authorized public
scenario to Chromium only for an actual capability need, never to bypass denied access.

## Existing CDP pages

`browser.targets` supports only relay and Tern; it rejects CDP endpoints. `browser.tabs()` lists
OMP-managed handles, not every page in an attached browser.

For an approved HTTP CDP discovery base, use `read` on its `/json/list` endpoint. Inspect the
authorized `type: "page"` entry's `id`, `url` and `title`; keep unrelated tabs and debugger URLs
private. Select the exact observed page ID, then attach through that same approved base:

```js
const cdpTab = await browser.open({
  name: taskTabName,
  app: approvedCdpBase,
  target: selectedPageId,
});
console.log(await cdpTab.url());
```

The variables above come from the task and observed discovery response. Omit `url` while attaching
to preserve the page's navigation. Native Chromium selection matches an exact page ID first,
otherwise a URL/title substring; avoid ambiguous substrings. Verify the current page identity
before acting. If the transport does not expose authorized discovery metadata, obtain that
prerequisite rather than guessing a target or enabling a debugging port on the user's browser.

## User Chrome through the relay

Explicit OMP-native relay connection:

```js
const relayTab = await browser.open({
  name: "authorized-account-task",
  app: "relay",
});
console.log(await relayTab.observe({ compact: true }));
```

Without `target`, this opens an OMP-owned background tab in the connected Chrome. Navigate only to
the task's authorized URL. Existing login state may be available, but tab-bound applications can
still require the original tab. Discover before adopting:

```js
const targets = await browser.targets({ app: "relay", timeout: 10 });
console.log(targets.map(({ target, title, url }) => ({ target, title, url })));
```

Use the exact selected result as the top-level `target` on a new managed name. Omit `url` while adopting so
opening does not navigate that page. A target listing is not user consent to manipulate every tab.
Do not print unrelated private tab details in reports. Borrowing is not BrowserSkill's prompted
`tabBorrow` protocol; required authorization must already exist.

Relay actions run in the user's real session and sites attribute them to the user. Do not navigate
an unrelated visible tab, submit external writes or make consequential changes without applicable
authorization. Avoid focus-stealing window actions. Native host focus protections are not a promise
that every popup, platform or browser version leaves focus unchanged.

## Relay setup when actually required

Use `omp browser-relay --help` for the installed version. With explicit install authorization,
`omp browser-relay install` writes the Chrome extension and prints the current setup steps. The
user or an authorized GUI flow loads the printed directory in Chrome's extension manager. Do not
use enterprise force-install policy, hidden profile edits or unrelated extension installers.

The browser prelude starts the relay on demand. `app: "relay"` selects it per open, so a
persistent configuration change is unnecessary for one task. Changing `browser.relay` globally is a
separate user preference; obtain authorization before saving it. A connection timeout is missing
connectivity, not proof that the extension is installed, enabled or connected. Verify a real new
relay tab and its backend before declaring setup successful. Do not repeatedly launch daemons or
retry denied browser access.

## Tern and cmux

Tern is native WKWebView in a visible picture-in-picture, not Chromium. `app: "tern"` requires it; `app: "own"` skips it. Adopting a Tern block releases rather than closes the user's block.
Tern fetch/XHR/navigation capture is useful, but it does not prove complete subresource traffic,
Chromium trace/profiling, transformed-frame input, reduced-motion or full device fidelity. cmux is
also a native-webview backend. Check each documented capability and retain an exact gap instead of
claiming the Chromium example worked there.

## Remote access

OMP supports explicit CDP attachment and a configured relay; it does not expose BrowserSkill pairing,
`BSK_HOME`, named-pipe discovery or its remote connection protocol. Use only the actual host's
advertised remote transport and authentication. Keep CDP endpoints and relay tokens on authorized
local/private routes; do not expose unauthenticated debugging ports to the network. If the remote
browser or secure transport is unavailable, report that prerequisite rather than substituting a
local browser for a remote authenticated criterion.

## Reuse and cleanup

One named tab permits one active operation/run. Serialize dependent calls; place event waits and
triggers inside one `tab.run`. Reopening with initialization/download/UA options can recycle a tab;
re-read state afterward. A timeout or renderer recovery can invalidate handles or reload the page;
inspect current state before repeating input that may already have landed.

Owned managed tabs may freeze when a turn settles and idle-close later. `persist: true` opts out;
use it only when required. Relay tabs are not auto-frozen. On a relay tab OMP opened, persist can
also leave it in Chrome after the session, so do not set it merely for convenience.

Close the exact owned handle in a finally path. Connected pages, borrowed relay tabs and adopted
Tern blocks are released, not closed. Spawned applications are killed only when explicitly requested
with `kill: true` and actually owned by the process; shared/reused browsers survive. Remove only
recorded task-owned profile directories after their process has stopped. Never delete user profiles,
clear shared storage or terminate Chrome as general cleanup. Preserve requested evidence tabs and
report their names/ownership instead of silently closing them.
