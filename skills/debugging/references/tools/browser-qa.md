# Browser QA - native Eval browser

Read `skill://browser` for routing and `skill://browser/references/network.md` for evidence. Use `read` for static URLs. A UI bug requires a rendered browser; curl cannot prove cookies, service workers, client-side JS or responsive layout. The `browser` prelude exists only with active Eval/browser settings; it is not an AgentTool. Follow active host routing (including an installed browser skill's explicit-tool exception), approvals and denial-final rules. Use `skill://cua-driver` for native surfaces or a legitimate user-selected fallback.

## Choose the state the bug requires

Public QA may use `browser.open({name:"submit-debug", url:appUrl, app:"chromium"})` when the host permits that route. Managed Chromium is project-shared, not a guaranteed fresh profile; record the actual backend and state. Do not clear shared data to manufacture isolation. Use the documented lifecycle reference when true isolation is required.

An authenticated criterion requires an authorized real-session relay or CDP connection. For an authorized relay use `browser.open({name:"submit-auth", app:"relay"})`; navigate only within the authorized task. The top-level `target` borrows an existing tab, so its navigation needs authorization too. No profile/cookie extraction, credential evaluation, or wiping user cookies/storage. An unavailable signed-in connection leaves the authenticated criterion blocked; managed-page success cannot prove it. Relay installation/enabling is optional and requires applicable authorization, never an automatic first step.

## Reproduce and subscribe before clicking

In a JS Eval cell, with `tab` from the selected route, `inputId`/`submitSelector` from a fresh observation, and a task-owned HAR path:

```js
console.log(await tab.observe());
// Select the actual input id and submit selector from this result before acting.
await tab.id(inputId).fill(failingValue);
await tab.harStart({content:"text"});
try {
  const response = await tab.run(async ({page}, selector) => {
    const hit = page.waitForResponse(
      response => new URL(response.url()).pathname === "/api/submit"
        && response.request().method() === "POST",
      {timeout:10000},
    );
    const [reply] = await Promise.all([hit, page.click(selector)]);
    return {url:reply.url(), status:reply.status(), body:await reply.text()};
  }, {args:[submitSelector]});
  console.log(response);
  await tab.waitForText(expectedResult, {timeout:10000});
  console.log(await tab.observe());
  console.log(await tab.console(), await tab.errors());
  console.log(await tab.requests({filter:"/api/submit", method:"POST"}));
  const pngPath = await tab.screenshot({format:"png"});
  console.log(pngPath);
} finally {
  await tab.harStop({path:harPath});
}
```

The response wait and triggering click belong in the same `tab.run`; awaiting the response first would prevent the click. `tab.run` closures do not capture outer variables: pass them through `args`. Read the response body and assert the exact persisted/error/success semantic state; HTTP 200 or a screenshot alone does not prove submission. Record expected and raw observed values, action log and evidence paths in the journal. Inspect the returned PNG itself; `screenshot` does not accept an output path. If Chromium tracing is required, start `tab.traceStart({screenshots:true})` before the scenario and stop that successfully started recording with `tab.traceStop({path:tracePath})` in its own finally path. Native trace output is a Chromium trace, not OmOWright's step journal: retain the action log separately. HAR/trace can contain customer/auth data; keep requested evidence private. `tab.request(id)` retrieves a captured response body when needed; inspect truncation and content type before interpreting it.

Use `tab.route(pattern,{abort:true})` then `tab.unroute(pattern)` only for an authorized deliberate request-failure scenario; never silently mock a real success. See the network reference for full routing options. Wait for the exact URL, selector, response or visible postcondition, never a fixed sleep or generic idleness claim.

## Viewports, frames and modes

For user-visible layout changes capture the affected desktop/mobile states; a full visual matrix applies only when the task requires it. `await tab.emulate({device:"iPhone 14"})` sets viewport/DPR/touch/UA together and may reload: re-establish the failing scenario afterwards. For desktop after a mobile preset use a separate task-owned tab. Raw Puppeteer viewport/UA changes cannot reset the stored preset because OMP reapplies it before each run. Read actual CSS viewport, DPR and touch/media state; window size alone is not device emulation. See `skill://visual-qa/references/browser-setup.md` for capture recipes.

`await tab.frames()` identifies embedded documents; use `tab.frame(observedSelectorOrNameOrUrl)` for scoped observation/actions, or raw `page.frames()` within `tab.run` where needed. Re-observe frame contents after navigation. Computed styles come from `tab.evaluate` or frame evaluation, not guessed stylesheet values. Use actual headed mode for headed-only failures; headless proof cannot cover browser permissions or window behavior.

Navigation and re-renders invalidate observed ids/refs. Re-observe, then act in the same cell. Transport success is not postcondition success. Preserve the exact before/after scenario, content identity and screenshot plus semantic assertion. Close only task-owned tabs/resources after evidence is retained; release borrowed sessions according to `skill://browser/references/lifecycle.md`, preserving user tabs/login. Never kill the entire attached browser.

Source: OMO `42d5746e72bfcfb782db6b5182b70a3e9c55f1cc`, `packages/shared-skills/skills/debugging/references/tools/browser-qa.md`. Re-ports the flight evidence, response-before-click, authenticated reproduction and device/headed guidance to OMP's native Eval browser; no OmOWright runtime or BrowserSkill installer is imported.
