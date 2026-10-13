# Browser capture on OMP

Use the browser tools exposed by the current session and read their actual schemas. Record the returned session, tab and target ids, then reuse that context for this goal. If using cua-driver, read `skill://cua-driver` first; use its browser preparation, navigation, state, interaction and screenshot tools. Do not assume a separate browser SDK, page object or shell runner, and do not copy login profiles.

## Web matrix

Use the selected tool's documented viewport, device and media controls. If it exposes CDP, the Chromium commands below provide the corresponding settings; they are protocol commands, not standalone OMP tools. A project-installed browser test runner may supply equivalent controls. Do not install another browser skill to obtain them.

| Capability | Chromium CDP command and parameters |
|---|---|
| Phone viewport | `Emulation.setDeviceMetricsOverride`: width 390, height 844, deviceScaleFactor 3, mobile true |
| Touch | `Emulation.setTouchEmulationEnabled`: enabled true, maxTouchPoints 5 |
| Theme and motion | `Emulation.setEmulatedMedia`: features `prefers-color-scheme` = light or dark, `prefers-reduced-motion` = no-preference or reduce |
| Desktop viewport | `Emulation.setDeviceMetricsOverride`: width 1440 or 1920, chosen height, deviceScaleFactor 1, mobile false; disable touch |

Navigate to the observed real URL. Through the exposed page-JavaScript route, await `document.fonts.ready`, inspect image decode results and application readiness, then read back viewport and media state before capturing. This expression reports state but does not configure it:

```js
({
  width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
  dark: matchMedia("(prefers-color-scheme: dark)").matches,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  touch: navigator.maxTouchPoints
})
```

Capture 390, 1440 and 1920 (page layouts), each theme, using the tool's documented screenshot operation. Record whether output dimensions are CSS pixels or device pixels; preserve raw DPR captures separately when needed. Chromium emulation is not an iPhone Safari test. Full-page captures supplement viewport shots, not replace them. Scroll the actual scroll owner to its end and screenshot the rendered state. Await exact application, font/image and state/animation events, never fixed sleeps or shell polling. Subscribe to transition/animation completion before triggering it; inspect active motion with supported animation controls or frame captures. A final still alone does not prove motion quality.

Record dimensions, DPR, theme, touch/mobile, URL/page/state, scroll position, input/build digest, timestamp and artifact signature in the capture manifest. Inspect every capture for wrong extension, chrome, blank/compositor regions, unexpected viewport or loading state. Read real exception/log events through the exposed browser interface or the installed runner; use CDP Runtime/Log only if that transport is available. A clean text snapshot is not a clean console or screenshot. Missing emulation, page JavaScript or log access is a specific evidence gap, not permission to invent an API or claim PASS.

## Native or unsupported browser

Read `skill://cua-driver`; target actual pid/window_id, refresh `get_window_state`, act with fresh element tokens, and verify actual state with a screenshot. Use `set_window_frame` and geometry readback for desktop widths; window frame is not web viewport emulation. Native chrome is part of app/terminal proof; browser web evidence must be page-only, using browser state screenshots or a validated content crop. Do not claim touch/DPR/theme emulation from a resized native window.

## Delivery and cleanup

Keep final HTML/evidence links and task-owned relevant tabs as required for review. Clear device/touch/media overrides and close only owned pages/processes after recording receipts. Never terminate a user browser, close unknown-origin tabs, change permission settings, or clone a live profile. Missing browser connection, GUI capture permission, renderer, emulation or image access is an explicit capability prerequisite, not PASS.
