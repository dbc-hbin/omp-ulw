# React Perf Tooling for Lighthouse 100

You are auditing or optimizing a React app for Lighthouse 100. The native browser route in [runtime.md](../runtime.md) and `skill://browser` owns page interaction and evidence. The project's installed Lighthouse runner owns its metrics. Two development tools can identify React-specific issues that Lighthouse does not diagnose by component:

| Tool | Surface | What it gives you |
|---|---|---|
| **react-scan** (`react-scan/lite`) | Runtime instrumentation, headless | Per-fiber `commit` events with `changeDescription` — "this component re-rendered because <prop / state / context / parent / hook> changed". Correlates with `long-animation-frame` to attribute LoAF to specific components. |
| **react-doctor** | Static scan, CI-friendly | Deterministic findings across state/effects, perf (memoization, list keys, expensive children), architecture, security, a11y. One-shot `npx react-doctor@latest` produces a JSON report. From the Million.dev team. |

Use both. They are complementary: `react-scan` tells you *what's slow right now*; `react-doctor` tells you *what's structurally wrong*. Both are dev-only and free.

Inspect the project's installed versions, instrumentation and event schema first. For an authorized setup, read `../design/react-dev-tooling-skill.md`; missing packages or browser bundles remain audit prerequisites, not permission to install unrelated tooling automatically.

## Lighthouse run + react-scan/lite

Load `react-scan/lite` before React mounts using an existing browser-ready project bundle and the installed package's actual initialization API. A bare `import("react-scan/lite")` in a page is not Node package resolution. Inspect the bundle's readiness signal, event sink and classification fields; do not invent an event schema or count an empty/uninitialized sink as a clean render result.

For a task-owned Chromium tab, native `browser.open({ name, url, app, init_scripts: [observedBundlePath] })` can install the observed document-start source before navigation. The variables come from the actual project and authorized connection; read `xd://eval/browser` for the active signature. Readiness and event collection still require the project's instrumentation contract. An asynchronous initializer must establish that instrumentation is ready before React mounts; document-start scheduling alone does not prove that ordering.

Drive the required route through the native browser and read its real event evidence using `tab.evaluate` or raw Puppeteer inside `tab.run`. Use the installed Lighthouse runner's supported connection to the authorized Chrome session; obtain its actual endpoint rather than guessing a port. A runner that accepts Playwright pages cannot take the native Puppeteer page without an explicitly supported adapter. Missing integration or events stay unverified; do not launch another runtime, copy login state or fabricate zero renders.

Run the requested profiles (normally mobile + desktop), preserve measurement overhead and report the synthetic scores alongside actual component evidence within the stated iteration bound. Release only the tab, init scripts or listeners this task owns.

## react-doctor — static perf gate

Before the browser audit, run the project's installed static scanner. It needs no browser, so put it earlier in the pipeline. The commands below describe the package CLI; use the project's actual installed/pinned invocation and obtain any required installation authorization before running an `@latest` command.

```bash
npx react-doctor@latest --json > .react-doctor-report.json
```

Parse `.react-doctor-report.json` for perf-category findings. Treat any perf finding as a blocker for the same reason you treat a Lighthouse score < 100 as a blocker — these are deterministic issues that *will* show up in Lighthouse eventually under throttling.

Wire it into CI as a separate job (cheap, fast, no browser needed):

```yaml
- name: React Doctor static perf scan
  uses: millionco/react-doctor@main
```

Or run inline with a fail filter:

```yaml
- name: React Doctor static perf scan
  run: npx react-doctor@latest --json --fail-on perf
```

## When to load which during an audit

Run them in this order, stop at the first failure:

1. **`react-doctor`** — cheapest. Catches missing memoization, broken list keys, unstable callback refs, expensive children that re-render unnecessarily. Fix everything it reports BEFORE running Lighthouse — half the perf score wins live here.
2. **`react-scan` interactive in dev** — load the page in real Chrome with `npx react-scan@latest init` already wired (see the dev-tooling reference). Walk the LCP route, the most-clicked CTA, and any animation-heavy view. The toolbar shows render counts; the overlay highlights unnecessary renders in gray. Fix until clean.
3. **`react-scan/lite` in the Lighthouse run** — once interactive is clean, use the native browser instrumentation and supported project audit runner above. This catches issues observed only under throttling or on first paint.
4. **Lighthouse project runner** — use the real-Chrome workflow in `README.md`. Report its scores and the independently observed render evidence; unavailable measurements remain unverified.

## React-specific perf root causes (extends `README.md` ROOT-CAUSE CHECKLIST)

These are the failures `react-scan` and `react-doctor` surface that base Lighthouse won't directly name:

- **Context value identity churn.** A provider value `useMemo` was forgotten; every consumer re-renders on every render of the provider's parent. → `useMemo` the value, or split contexts so high-churn fields don't sit next to stable ones.
- **Inline object/array/callback props on memoized children.** `<Child config={{ a: 1 }} />` breaks `React.memo` every render. → Hoist, `useMemo`, or `useCallback`.
- **List keys = array index.** Reordering shreds the reconciler. → Use a stable id from the data.
- **Expensive components rendered unconditionally above the fold.** → `lazy()` + `Suspense`, or move below the LCP, or pre-render server-side.
- **Effects that fire on every render.** Missing dependency arrays or unstable deps. → Stabilize deps, or split state, or extract to `useEvent`-style ref.
- **Spreading the entire context value into props.** Couples every consumer to every field. → Destructure only the fields used.
- **Hydration mismatches.** SSR markup doesn't equal client first-render. → react-doctor flags structurally; fix the source of the divergence (Date.now, locale, randomness, browser-only APIs).

`react-doctor` finds these statically. `react-scan` confirms the symptom in the running app. Both must come clean before Lighthouse 100 is meaningful.

## Anti-patterns specific to this workflow

- **Instrumenting only after React mounts.** A later `evaluate` misses initial-render events. Use a verified document-start bundle and readiness contract; asynchronous setup can otherwise lose the same events.
- **`react-scan` non-lite during a Lighthouse run.** The full UI (toolbar, canvas overlay) adds overhead and skews the score. Use `react-scan/lite` ONLY for measurement; the full version is for interactive dev.
- **Reporting Lighthouse 100 with `react-scan` showing 30+ unnecessary renders per route.** The score is meaningless if the React layer is thrashing — INP and CLS will degrade under real load even if the synthetic run passed. Both gates must clear.
- **Treating `trackUnnecessaryRenders` as free.** It has measurable overhead; in a Lighthouse run it can drag the perf score by 2-3 points. Use it for interactive diagnosis, not for the audit run.
- **Skipping react-doctor because "it's just a linter".** It's not. It detects React-specific defects (missing keys, broken memo, unstable refs, hydration mismatches) that ESLint plugins miss because they require fiber-level reasoning.

## Mantra

> **Lighthouse 100 + react-doctor clean + zero unnecessary renders from react-scan. All three or it is not done.**
