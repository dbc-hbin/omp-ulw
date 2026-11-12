---
name: visualize
description: "Build a self-contained HTML chart, table, diagram or dashboard and display the generated file through the actual browser tools, with a final artifact link."
---

# Visualize

Resolve relative reference paths from this skill's directory, not the project working directory; use `skill://visualize/<relative-path>` with `read`. Cross-skill reads use `skill://<name>`. Workflow labels such as `/visual-qa` name skills to load, not shell commands or guaranteed slash-command APIs.

A generated page is opened in the browser and linked from the reply, in a theme-aware style, and is read in a few seconds. It earns its place only by being clearer than the paragraph it replaces. This skill owns what is particular to such a page. The data work belongs to `skill://data-scientist` and the design work to `skill://frontend`: load those skills for their parts instead of improvising them here.

## The loop

Do these in order. Never show a page you have not looked at.

1. **Data: read `skill://data-scientist`.** Record input provenance, query/aggregation, grain, filters, counts, units and caveats. Compute every figure near its source at the grain the reader needs: SQL aggregation in its database, or an available verified engine over files (DuckDB/Polars when installed, exact stdlib for small data). Return only the aggregates the chart draws. Follow `skill://data-scientist/references/visualization.md` for chart selection, reader-time-zone buckets and the headline cross-check. Keep the query: every number on the page must trace back to it.
2. **Design: read `skill://frontend`.** Use it for hierarchy, type, spacing and states, including its simple-artifact exception for design-system, Lighthouse and research gates. The page brings no palette or fonts of its own and uses host-compatible semantic properties with standalone light/dark fallbacks (below). Explicit user and project requirements still apply.
3. **Build one self-contained page** under the constraints below and the draft guard in `skill://frontend`. Give each role its own CSS class, prefixed or scoped under its chart's parent selector; never share a short global class between unrelated roles such as KPI grids and bar segments.
4. **Lint before you render.** Run `bun "$FRONTEND_DIR/scripts/perfection/check-draft-guard.ts" <page file>`, where `FRONTEND_DIR` is the observed absolute directory of `skill://frontend` (OMP does not set it); write a page you built as a string to a file first. Exit 1 means a coloured edge bar, an accent outline, promotional filler copy, an emoji icon, a hype badge, or a hard-coded vanity stat is in the page: remove it and rerun. Nothing is previewed or shown until it exits 0.
5. **Preview and look.** Read `skill://browser`, follow active host routing and use the native Eval prelude to open the actual generated file: `const chartTab = await browser.open({name:"chart-preview",url:fileUrl,app:"chromium"})` when that public route is permitted. `app: "chromium"` selects managed Chromium; record the actual backend. Inspect actual screenshot files in dark and light at intended desktop width and 390 CSS px using `skill://visual-qa/references/browser-setup.md` for viewport/theme settings, semantic state and computed geometry. Read `await chartTab.console()` and `await chartTab.errors()`, record unavailable console access, fix defects and recapture. A native display via `skill://computer-use` is a legitimate selected display fallback, not an emulation substitute. OMP has no inline HTML preview/render tools. A permission/approval refusal is final: never change transport to reach the denied result. For a technical file-URL limitation (not a denial), use an available local static server through native async bash, record its handle/URL and close only that owned server after review; do not build a rendering engine.
   In each of those four views, measure every bar chart's largest bar's rendered height
   against `value / axisMax * plotHeight`, and compare each legend swatch's computed color
   with the actual series' computed color. Inspect the whole first and last axis labels for
   clipping. Record the measurements with the captures; draft lint cannot prove chart geometry
   or color agreement. Fix discrepancies and recapture the affected views before showing it.
6. **Show it.** Leave the generated file open in the actual browser or retained task-owned tab, report the file path as a clickable Markdown artifact link and include the actual capture paths/coverage. Then write only what the page does not say. Never claim it appeared inline in OMP or call absent HTML display APIs.

## Constraints of an inline page

- **No network.** Inline every script, style, font and image (`data:` URIs); the artifact must remain usable offline, so a CDN library leaves a blank chart. Draw with hand-written SVG when a library cannot be inlined.
- **Theme-compatible semantics.** OMP does not inject HTML theme values. Use `:root { color-scheme: light dark; }` and complete standalone fallbacks; external host values may override them. Color through custom properties: `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--card`, `--border`, `--primary`, `--accent`, `--destructive`, `--warning`, `--success`, the series colors `--chart-1` to `--chart-6`, and `--font-sans`, `--font-mono`, `--radius`. Do not assume those properties exist in a file browser. Supply fallbacks for every used color, font and radius, including both themes: `var(--chart-2, light-dark(#0d9488, #2dd4bf))`.
- **Compact artifact, not nested cards.** Fluid width, no outer padding, border or banner. Give charts fixed pixel heights, not heights that scale with the width. Draw bars as HTML elements in a fixed-height plot container, each sized as `value / axisMax * 100%` of that container. A fluid SVG stretched with `preserveAspectRatio="none"` stretches text and strokes too. Put axis labels in HTML, positioned by percentage: center inner labels on their ticks, align the first label's left edge and the last label's right edge with the chart edges.
- **Readable without scripts.** The initial paint must work with JavaScript disabled. Put the figure itself in markup or SVG, and use scripts only for interaction.
- **Traceable.** Show how the numbers were computed in a small, muted "How this was computed" block (the query or aggregation), and state caveats near the figure when they change how a number reads: dropped rows, a small sample or a partial window. Mark an unfinished bucket on its own bar with a lighter fill or hatch and a partial label, not only in a subtitle. Name the headline cross-check's second source near the chart and disclose agreement or the measured difference; disclose an unavailable source as unverified.
- **Designed empty and error states.** No data, or a failed query, is stated in the same visual language, never as a blank frame.
- **Links.** Use ordinary browser links with visible destination/context; do not claim a host confirmation intercept. Keep data out of link addresses.

## Before you show it

- The title states the finding, not the dataset name.
- Axis labels carry units, numbers use tabular figures and a sensible precision, and nothing clips at 390 px.
- The series colors separate in both themes, and the console is clean.

## Browser artifact contract

Include a meaningful document title, UTF-8 and viewport metadata, accessible SVG title/description or an equivalent data table, and static markup for the actual chart at first paint. Verify the rendered figure with scripts disabled, not merely an empty SVG container that a script later fills. No fetch, remote fonts, CDN libraries, network image URLs or runtime-generated chart dependency is allowed. Theme checks are four actual captures (desktop/390 x light/dark) with verified media settings; a filename saying dark is not evidence. A missing required capture blocks verified delivery, while missing console access is reported explicitly. The final link must target the file actually written and opened.

Source: upstream visualize workflow at revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe` (2026-10-08), with [chart correctness policy from `0472192d549b861abfc5c1d6f1c3f12caf6c12c8`](https://github.com/code-yeongyu/oh-my-openagent/commit/0472192d549b861abfc5c1d6f1c3f12caf6c12c8) reconciled with the [pinned final skill](https://github.com/code-yeongyu/oh-my-openagent/blob/adddd17004076e799c2de18ccfdee29e12525ace/packages/omo-senpi/skills/visualize/SKILL.md); modified for actual OMP browser display, package probing and standalone theme fallbacks.
