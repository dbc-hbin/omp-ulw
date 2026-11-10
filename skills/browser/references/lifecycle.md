# Connection, ownership and setup

Read `xd://eval/browser` first. Ordinary interaction does not require a relay. Pick the state the
task actually needs, inspect the backend returned by open and keep a short task-specific name.

## Managed and explicitly spawned browsers

Without explicit app options, OMP may choose configured relay, configured CDP, Tern, cmux or managed
Chromium. `app: { relay: false, tern: false }` skips those two automatic modes only. It does not
override a configured CDP endpoint or cmux. `headed` changes visibility, not backend identity.

Managed Chromium installs on first use if needed and shares a project browser. A new name gives a
new page, not proof of a new profile. Do not clear shared state to manufacture a clean test. When
fresh profile isolation matters, use an observed, installed Chromium-family executable with
`app.path` and a task-owned temporary `--user-data-dir` in `app.args`. Create that directory through
the available file/process tools, record ownership and pass its actual path; never point it at the
user's live profile. Apply permissions/install rules before adding software. A separately spawned
application is not the same as attaching to the user's Chrome.

`app.cdp_url` attaches to an explicitly selected, reachable CDP discovery endpoint. Do not restart
a user's browser with debugging flags, change browser security settings or copy profiles as hidden
setup. A remote browser is still that browser's real account and network context.

## Existing CDP pages

`browser.targets` supports only relay and Tern; it rejects `app.cdp_url`. `browser.tabs()` lists
OMP-managed handles, not every page in an attached browser.

For an approved HTTP CDP discovery base, use `read` on its `/json/list` endpoint. Inspect the
authorized `type: "page"` entry's `id`, `url` and `title`; keep unrelated tabs and debugger URLs
private. Select the exact observed page ID, then attach through that same approved base:

```js
const cdpTab = await browser.open({
  name: taskTabName,
  app: { cdp_url: approvedCdpBase, target: selectedPageId },
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
  app: { relay: true },
});
console.log(await relayTab.observe({ compact: true }));
```

Without `target`, this opens an OMP-owned background tab in the connected Chrome. Navigate only to
the task's authorized URL. Existing login state may be available, but tab-bound applications can
still require the original tab. Discover before adopting:

```js
const targets = await browser.targets({ app: { relay: true }, timeout: 10 });
console.log(targets.map(({ target, title, url }) => ({ target, title, url })));
```

Use the exact selected result as `app.target` on a new managed name. Omit `url` while adopting so
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

The browser prelude starts the relay on demand. `app: { relay: true }` selects it per open, so a
persistent configuration change is unnecessary for one task. Changing `browser.relay` globally is a
separate user preference; obtain authorization before saving it. A connection timeout is missing
connectivity, not proof that the extension is installed, enabled or connected. Verify a real new
relay tab and its backend before declaring setup successful. Do not repeatedly launch daemons or
retry denied browser access.

## Tern and cmux

Tern is native WKWebView in a visible picture-in-picture, not Chromium. `app.tern: true` requires
it; `app.tern: false` skips it. Adopting a Tern block releases rather than closes the user's block.
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
