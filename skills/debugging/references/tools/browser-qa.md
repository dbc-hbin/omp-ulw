# Browser QA - ego-browser and cua-driver

Read skill://ego-browser and skill://cua-driver before driving browser/desktop tools. A UI bug requires a rendered browser; curl cannot prove cookies, service workers, client-side JS or responsive layout. Use actual tools and fresh refs, not upstream omowright engines.

## Concrete scenario: signed-in submit fails silently

Identify the actual browser/tab with browser_prepare and get_browser_state. Use the existing signed-in session only when that state is required; never clone profiles, read credentials through evaluation or clear user cookies/storage. For public-page isolation select a task-owned profile using the exposed browser_prepare schema. Journal session/tab/profile ownership first.

OMP cua-driver calls (ids/ref come from the preceding real result):
- mcp__cua_driver_browser_prepare({session:"SubmitDebug",profile:{mode:"isolated_new"}}) for a fresh public repro.
- get_browser_state with the returned tab_id/target_id, include_screenshot:true; inspect the actual image and semantic state.
- browser_navigate to the observed app URL; refresh state.
- browser_type on the returned input ref with the exact failing value; browser_click on the returned submit ref.
- get_browser_state again; assert the exact submitted/error/success semantic state and inspect the rendered screenshot. Write the action log and returned evidence paths through write.

For authenticated repro, prepare the existing browser route as documented by the installed skill instead of creating a fresh profile. A screenshot alone does not prove submission. Read saved result/state and, when available, actual console/network evidence. If the active tools do not expose a network subscription, capture the matching server request log and browser semantic state, and label wire inspection unavailable; do not invent snoop, trace or waitForURL methods. With an installed browser API that exposes events, subscribe to the exact response BEFORE clicking and await with bounded timeout. No fixed sleeps or generic network-idle claims.

## Viewports and modes

Exercise desktop and mobile widths for user-visible layout changes using the installed skill's documented viewport/window route; capture and look at both. Window size is not a claim of device emulation: record CSS viewport, scale, touch/UA settings actually available. Check every rendered page for pagination. If mobile emulation, HAR, console capture or a rendered terminal is unavailable, record that gap. For headed-only failures use actual headed browser state and permissions; headless proof does not cover window behavior.

Refs expire after navigation/new snapshots. Refresh before acting; transport success is not postcondition success. Retain exact original before/after scenario, action log, screenshot and semantic assertion with content identity. End only task-owned sessions/profile/resources, preserving the user's tabs/login and requested evidence. Do not kill the entire browser to clean an attached session.
