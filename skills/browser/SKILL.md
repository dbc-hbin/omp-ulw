---
name: browser
description: "Drive interactive pages through OMP's native eval browser prelude: forms, clicks, JavaScript-rendered content, screenshots, web QA, frames and network evidence. Use when native OMP browser work is requested or permitted by host routing; use read for static URLs and web_search for discovery."
---

# Browser on OMP

Invoke `/web-browser` for this workflow, or use native `/skill:browser` when skill discovery is
enabled. OMP's own `/browser` remains its headless/visible mode command and is not replaced.

Read `xd://eval/browser` before the first browser operation in a session. Use the actual global
`browser` inside JavaScript or Python `eval`; it is not a standalone tool, package import or MCP
server. If the prelude is unavailable, report the missing eval/browser capability. Do not install a
second browser runtime to substitute for it.

Honor the user's chosen browser and host skill routing. An installed Aside-first rule still applies
unless the user selects OMP or that rule permits a fallback. Native desktop chrome and unsupported
app surfaces use the installed `cua-driver` skill, with its own permissions. This skill does not
change tools, approval requirements, project rules or native modes.

## Choose the connection from the required state

| Task requires | OMP path |
| --- | --- |
| Static text, an official API or an ordinary source URL | `read`; discover sources with `web_search` |
| Public interactive page, rendering or headless QA | A named native tab; inspect the backend returned by `browser.open` |
| The user's existing Chrome login | Explicit relay `app: "relay"`; open a dedicated tab when the login is not tab-bound |
| An existing relay or Tern tab, including tab-bound application state | Inspect `browser.targets({ app })`, then adopt the exact returned `target`; omit `url` to avoid navigating it |
| An existing CDP browser or Electron page | Read its authorized CDP discovery metadata, then use the CDP endpoint as `app` and the selected page ID as `target`; see [lifecycle.md](references/lifecycle.md#existing-cdp-pages) |
| An explicitly requested separate browser or Electron process | An observed executable path as `app`, with `argv` for its arguments; do not treat this as the user's existing session |
| Visible native Tern web content | The advertised Tern backend; respect its capability limits |
| A blocked host, archive or platform-specific reader | [ultimate-browsing](../ultimate-browsing/SKILL.md) |

A relay is optional. Managed Chromium handles public interaction without it. Default backend selection
can choose configured relay/CDP, Tern or cmux; it does not guarantee a fresh profile. For a public
probe that should use managed Chromium, pass `app: "chromium"` and inspect the reported backend.
Managed Chromium is project-shared. For a criterion
requiring truly fresh profile state, use a separately authorized, task-owned browser profile as
explained in [lifecycle.md](references/lifecycle.md), not a claim of isolation from a new tab name.

Never replace an authenticated criterion with a headless browser that has no relevant login. Never
clone, export or clear a user's live profile, cookies or storage to obtain authentication. A new tab
can still lack a login held only by an existing tab; preserve that tab and follow
[human-handoff.md](references/human-handoff.md).

## Observe, act, verify

Open one short, task-named tab and retain the handle across cells. This example opens a public page;
choose an actual task URL rather than treating the example as the user's target.

```js
const tab = await browser.open({
  name: "public-inspection",
  url: "https://example.com",
  app: "chromium",
});
console.log(await tab.observe({ compact: true }));
```

`observe()` returns numeric IDs for `tab.id(id)`; `ariaSnapshot()` returns ARIA refs for
`tab.ref("eN")`. Use IDs or refs from the current observation in the same cell, never guessed values.
Navigation, rerendering and another snapshot can invalidate them. Read again after a state-changing
action and verify the semantic postcondition; successful transport is not proof that a submit worked.
Prefer `fill` for replacing text and `select` for `<select>` elements.

Use direct helpers for ordinary work and `tab.run` when several dependent actions must share one
worker call, including subscribing to a response before the click that triggers it. A run receives
`{ tab, page, browser, wait, assert }`; `page` is Puppeteer on Chromium backends. Functions cannot
capture outer eval-cell variables: pass explicit `args`. A page `evaluate` executes in the page;
`tab.run` executes in the worker with Bun/Node and tool access, not a security sandbox.

Use state waits with bounded deadlines, never fixed sleeps. Diagnose a failed selector from fresh
state. Repeating the same failed action is not recovery; change the selector, frame or hypothesis
only after evidence identifies the cause. A user or permission refusal is final for that operation,
not a reason to switch engine, account or tool.

## Delegated page work

A child does not inherit this loaded skill, the lead's ULW policy, tab handle or authorization.
Put this skill's actual path or `skill://browser` in the assignment, plus the relevant source URL,
required account/page state, allowed actions, backend prerequisites and expected evidence.
Include `skill://ultimate-browsing` for blocked/incomplete or platform-specific source reading,
and the network/interaction references when the task depends on responses, pagination or frames.
Choose only a worker whose advertised tools and role permit that work; an unavailable Eval/browser
capability remains a gap or an observation for the lead, not permission to bypass role restrictions.
Use distinct task/worker tab names and preserve borrowed pages and other workers' state. Return
observed source/state and artifact paths, redact secrets, and release only the worker's owned
handles. Reading these references does not activate another ULW workflow.

## Evidence and cleanup

Use screenshots to inspect actual pixels alongside DOM/state and, where relevant, response/server
evidence. `tab.screenshot()` returns a saved path and emits an image. Read the saved image when a
preview disagrees with current state. Record CSS viewport, DPR, device/touch settings, theme, URL and
scenario; a screenshot's image pixels may differ from CSS coordinates. Emulation can reload the
page, so apply it before setting up the scenario and re-observe afterward.

Close the exact task tab with `await tab.close()` when finished, including on failure. Closing a
borrowed relay/CDP page releases it rather than closing the user's page. Do not use global close or
kill a shared browser as cleanup. Preserve explicitly requested deliverable tabs and record their
ownership instead. Keep evidence only to the requested scope and redact auth headers, tokens and
private payloads before sharing it.

## References

| Need | Read |
| --- | --- |
| Actual helper signatures, selectors, run/evaluate, capture and backend limits | [commands.md](references/commands.md) |
| Managed/relay/CDP/native choice, isolation, install, remote connection and ownership | [lifecycle.md](references/lifecycle.md) |
| Fresh refs, overlays, frames/shadow DOM, pixel coordinates and challenge widgets | [interaction.md](references/interaction.md) |
| Passive JSON, response waits, scroll collection, routes, HAR and trace evidence | [network.md](references/network.md) |
| Login, OTP, human takeover, dialog decisions and shared-tab limits | [human-handoff.md](references/human-handoff.md) |
| Authorized reading of an already-unlocked 1Password tab | [recipes/1password.md](references/recipes/1password.md) |
| Source coverage and unsupported upstream-only features | [ATTRIBUTION.md](ATTRIBUTION.md) |
