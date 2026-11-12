# Browser capture on OMP

Read `skill://browser` and its lifecycle/commands references, then use the native `browser` prelude in Eval when active. Follow host routing, approvals and denial-final rules; an installed browser skill's explicit-tool exception still applies. Use `read` for static URLs and `skill://cua-driver` for native surfaces or a legitimate user-selected fallback. Do not install a second runtime or automatically enable/install the optional relay.

Public QA can select `browser.open({name:"visual-qa",url:appUrl,app:"chromium"})` when permitted. `app: "chromium"` selects managed Chromium; record the actual backend. Managed Chromium is project-shared, not a guaranteed clean profile. Authenticated rows require an authorized real-session relay/CDP route from the lifecycle reference; never copy a live profile, extract cookies or erase user state. An unavailable authenticated route blocks that row, even if the public page renders.

## Applicable web matrix

The calling skill owns scope: use 390/1440/1920, light/dark, top/end and motion variants only when its acceptance matrix requires them. A small unrelated UI fix does not acquire a full matrix from this recipe. Each required page/state gets matching source and actual captures where a reference exists.

This JS Eval example uses raw Puppeteer controls through documented `tab.run`. `appUrl`, `readySelector` and the matrix rows come from the actual task. Derive a fresh task-owned `row.tabName` from the applicable row and retain only the requested final tabs. This raw-controls tab must never have received `tab.emulate` overrides: OMP reapplies stored overrides before every run. The explicit viewport sets both mobile and desktop flags:

```js
// For each applicable row, after choosing its width/height/mobile/theme/motion:
const qa = await browser.open({name:row.tabName,app:"chromium"});
await qa.run(async ({page}, row) => {
  await page.setViewport({
    width:row.width, height:row.height, deviceScaleFactor:row.mobile ? 3 : 1,
    isMobile:row.mobile, hasTouch:row.mobile,
  });
  await page.emulateMediaFeatures([
    {name:"prefers-color-scheme",value:row.theme},
    {name:"prefers-reduced-motion",value:row.reducedMotion ? "reduce" : "no-preference"},
  ]);
}, {args:[row]});
await qa.goto(appUrl);
await qa.waitForSelector(readySelector, {timeout:10000});
console.log(await qa.evaluate(async () => {
  await document.fonts.ready;
  const images = await Promise.all([...document.images].map(async image => {
    try { await image.decode(); return {src:image.currentSrc, decoded:true}; }
    catch { return {src:image.currentSrc, decoded:false}; }
  }));
  return {
    width:innerWidth, height:innerHeight, dpr:devicePixelRatio,
    dark:matchMedia("(prefers-color-scheme: dark)").matches,
    reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,
    touch:navigator.maxTouchPoints, images,
  };
}));
const topPath = await qa.screenshot({format:"png"});
console.log(topPath);
console.log(await qa.console(), await qa.errors());
```

`row.mobile` above proves a mobile viewport/touch/DPR configuration, not an iPhone UA. For a coordinated device preset, use a separate task-owned mobile tab with `await mobileTab.emulate({device:"iPhone 14"})`; its native `emulate` also configures media. Do not mix native presets with the raw-controls matrix handle above. Device emulation merges settings and can reload the document: re-establish the scenario afterwards. There is no `device:null` reset; raw Puppeteer changes are overwritten by the stored preset on the next run. Use a separate task-owned desktop tab after a mobile preset. Chromium emulation is not an iPhone Safari test.

Capture top and end as viewport screenshots; full-page images supplement them. Scroll the actual owner (document or observed nested container) through `evaluate`, wait for the page's real lazy-load/settled signal, read back its scroll position and screenshot the rendered end. Do not use fixed sleeps or shell polling. Subscribe to animation/transition completion before triggering it. For required motion evidence capture rest, a driven midpoint and settled state, then reduced-motion and interruption variants. Inspect animations with `document.getAnimations()` through `evaluate` and, when needed, use raw Puppeteer/CDP within `tab.run`; never substitute an arbitrary delayed still for motion proof.

Use `await qa.frames()` and `qa.frame(observedSelectorOrNameOrUrl)` for iframe content; capture the relevant frame and inspect its semantic state. Use frame evaluation for computed styles when the component lives there. Browser ids/refs expire after navigation/re-render; re-observe before acting.

Record URL/page/state, CSS viewport, screenshot pixel dimensions, DPR, theme, touch/mobile/UA settings, scroll owner/position, input/build digest, timestamp and artifact signature in the manifest. Inspect each returned image file for extension/signature, wrong dimensions, browser chrome, blank/compositor regions and loading state. Screenshot previews alone may be stale; read the actual returned PNG path. `screenshot` returns its saved path and does not accept a destination path; retain that returned artifact. Keep raw DPR captures; never resize them to force a comparison pass. `image-diff` reports dimensions and pixels, not semantic correctness.

## Console, network and action evidence

Collect `await qa.console()`, `await qa.errors()` and `await qa.requests({filter:relevantUrlPattern})` around the changed scenario. Use `qa.request(id)` for needed captured bodies and record truncation. For a required HAR use `await qa.harStart({content:"text"})` before navigation/action and `await qa.harStop({path:harPath})` afterwards. `qa.traceStart({screenshots:true})` / `qa.traceStop({path:tracePath})` produce Chromium tracing evidence; retain the scenario/action journal separately. See `skill://browser/references/network.md` and the response-before-click example in `skill://debugging/references/tools/browser-qa.md`. Store auth-bearing evidence privately. Missing log/emulation/frame access on the selected backend is a named capability gap; a clean DOM snapshot cannot establish a clean console or screenshot.

## Native or unsupported browser

Read `skill://cua-driver`; target actual pid/window_id, refresh `get_window_state`, act with fresh element tokens, and verify actual state with a screenshot. Use `set_window_frame` and geometry readback for desktop widths; window frame is not web viewport emulation. Native chrome belongs in app/terminal proof; web evidence must be page-only, through browser screenshots or a validated content crop. Do not claim touch/DPR/theme emulation from window resizing.

## Delivery and cleanup

Keep final HTML/evidence links and required relevant tabs for review. Stop captures and task-owned fixture servers even after a failure. Clear overrides you changed on borrowed tabs according to the lifecycle contract, preserving unrelated user settings; close only owned pages/processes after receipts. Never terminate the user's browser, close unknown tabs, alter browser permissions or clone a live profile. Missing connection, GUI permission, renderer, emulation or image access is a capability prerequisite, never PASS.

Source: OMO `42d5746e72bfcfb782db6b5182b70a3e9c55f1cc`, `packages/shared-skills/skills/visual-qa/references/browser-setup.md`; capture/state/media/auth lifecycle re-ported to native OMP rather than the upstream OmOWright engines.
