# Browser capture on OMP

Read `skill://ego-browser` and its `references/api.md` before first use. Use one taskSpace per user goal, record its spaceId and resume that same space and page label across invocations. No Playwright imports, copied profiles, omowright or private browser engines are needed.

## Web matrix

The real Page API supports `goto`, `evaluate`, `cdp`, state-driving actions and `screenshot({path, fullPage, clip, scale, raw})`. Use documented CDP commands for capabilities absent from the small Page API:

```js
// Run via ego-browser nodejs -e, after reading its skill.
const space = await taskSpace("visual QA");
const page = space.page("p1");
console.log({spaceId: space.spaceId, page: page.label});
await page.cdp("Emulation.setDeviceMetricsOverride", {
  width: 390, height: 844, deviceScaleFactor: 3, mobile: true
});
await page.cdp("Emulation.setTouchEmulationEnabled", {enabled: true, maxTouchPoints: 5});
await page.cdp("Emulation.setEmulatedMedia", {features: [
  {name: "prefers-color-scheme", value: "dark"},
  {name: "prefers-reduced-motion", value: "no-preference"}
]});
await page.goto("http://localhost:3000");
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(Array.from(document.images, image => image.decode().catch(() => undefined)));
});
console.log(await page.evaluate(() => ({
  width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
  dark: matchMedia("(prefers-color-scheme: dark)").matches,
  touch: navigator.maxTouchPoints
})));
console.log(await page.screenshot({path: "doc/evidence/visual-qa/route-390-dark.png", scale: "css"}));
```

Resolve the real URL/path before using the recipe. Repeat at 390, 1440 and 1920 (page layouts), each theme; desktop metrics use deviceScaleFactor 1, mobile false and touch disabled. This is Chromium emulation, not an iPhone Safari test. CSS-normalized capture dimensions are 390 CSS px; preserve raw DPR captures separately if needed. Full-page captures supplement viewport shots, not replace them. Scroll the actual scroll owner to its end and screenshot after the rendered scroll state. Wait on exact application readiness, font/image readiness and actual state/animation events, never fixed sleeps or repeated shell polling. Subscribe to transition/animation completion before triggering it; active motion frames can use the documented CDP Animation domain/seekAnimations after recording animation ids. If the application has no deterministic motion control, record the missing coverage rather than fabricate a mid frame.

Record dimensions, DPR, theme, touch/mobile, URL/page/state, scroll position, input/build digest, timestamp and artifact signature in the capture manifest. Inspect every capture for wrong extension, chrome, blank/compositor regions, unexpected viewport or loading state. Enable Runtime/Log through documented CDP if console evidence is needed and read the real exception/log events through ego-browser supported event/receipt APIs; do not assume Playwright page.on exists. A clean text snapshot is not a clean console or screenshot.

## Native or unsupported browser

Read `skill://cua-driver`; target actual pid/window_id, refresh `get_window_state`, act with fresh element tokens, and verify actual state with a screenshot. Use `set_window_frame` and geometry readback for desktop widths; window frame is not web viewport emulation. Native chrome is part of app/terminal proof; browser web evidence must be page-only, using browser state screenshots or a validated content crop. Do not claim touch/DPR/theme emulation from a resized native window.

## Delivery and cleanup

Keep final HTML/evidence links and task-owned relevant tabs as required for review. Clear device/touch/media overrides and close only owned pages/processes after recording receipts. Never terminate a user browser, close unknown-origin tabs, change permission settings, or clone a live profile. Missing browser connection, GUI capture permission, renderer, emulation or image access is an explicit capability prerequisite, not PASS.
