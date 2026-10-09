---
name: visualize
description: "Build a self-contained HTML chart, table, diagram or dashboard and display the generated file through the actual browser tools, with a final artifact link."
---

# Visualize

A generated page is opened in the browser and linked from the reply, in a theme-aware style, and is read in a few seconds. It earns its place only by being clearer than the paragraph it replaces. This skill owns what is particular to such a page. The data work belongs to `../data-scientist/SKILL.md` and the design work to `../frontend/SKILL.md`: load those skills for their parts instead of improvising them here.

## The loop

Do these in order. Never show a page you have not looked at.

1. **Data: read `../data-scientist/SKILL.md`.** Record input provenance, query/aggregation, grain, filters, counts, units and caveats. Compute every figure with an available verified engine (DuckDB/Polars when installed, exact stdlib for small data), at the grain the reader needs, and follow `../data-scientist/references/visualization.md` for which chart answers which question. Keep the query: every number on the page must trace back to it.
2. **Design: read `../frontend/SKILL.md`.** Use it for hierarchy, type, spacing and states. This page's constraints replace its design-system gate: the page brings no palette or fonts of its own and uses host-compatible semantic properties with standalone light/dark fallbacks (below).
3. **Build one self-contained page** under the constraints below.
4. **Preview and look.** Read `skill://ego-browser`, open the actual generated file with `page.goto` using its resolved `file://` URL, and inspect screenshots in dark and light at intended desktop width and at 390 CSS px. Use `../visual-qa/references/browser-setup.md` for real viewport/theme emulation. Inspect actual browser exception/log evidence when available, record missing console access, fix observed defects and recapture. A native browser via `skill://cua-driver` is an actual display fallback, not an emulation substitute. OMP has no inline HTML preview/render tools. If file navigation is refused, use an already available local static server as native async bash, record its handle and URL, and close only that owned server after review; do not build a rendering engine.
5. **Show it.** Leave the generated file open in the actual browser or retained task-owned tab, report the file path as a clickable Markdown artifact link and include the actual capture paths/coverage. Then write only what the page does not say. Never claim it appeared inline in OMP or call absent HTML display APIs.

## Constraints of an inline page

- **No network.** Inline every script, style, font and image (`data:` URIs); the artifact must remain usable offline, so a CDN library leaves a blank chart. Draw with hand-written SVG when a library cannot be inlined.
- **Theme-compatible semantics.** OMP does not inject HTML theme values. Use `:root { color-scheme: light dark; }` and complete standalone fallbacks; external host values may override them. Color through custom properties: `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--card`, `--border`, `--primary`, `--accent`, `--destructive`, `--warning`, `--success`, the series colors `--chart-1` to `--chart-6`, and `--font-sans`, `--font-mono`, `--radius`. Do not assume those properties exist in a file browser. Supply fallbacks for every used color, font and radius, including both themes: `var(--chart-2, light-dark(#0d9488, #2dd4bf))`.
- **Compact artifact, not nested cards.** Fluid width, no outer padding, border or banner. Give charts fixed pixel heights, not heights that scale with the width. A fluid SVG stretched with `preserveAspectRatio="none"` stretches its text too, so put axis labels in HTML beside it, positioned by percentage.
- **Readable without scripts.** The initial paint must work with JavaScript disabled. Put the figure itself in markup or SVG, and use scripts only for interaction.
- **Traceable.** Show how the numbers were computed in a small, muted "How this was computed" block (the query or aggregation), and state caveats near the figure when they change how a number reads: dropped rows, a partial window, a small sample.
- **Designed empty and error states.** No data, or a failed query, is stated in the same visual language, never as a blank frame.
- **Links.** Use ordinary browser links with visible destination/context; do not claim a host confirmation intercept. Keep data out of link addresses.

## Before you show it

- The title states the finding, not the dataset name.
- Axis labels carry units, numbers use tabular figures and a sensible precision, and nothing clips at 390 px.
- The series colors separate in both themes, and the console is clean.

## Browser artifact contract

Include a meaningful document title, UTF-8 and viewport metadata, accessible SVG title/description or an equivalent data table, and static markup for the actual chart at first paint. Verify the rendered figure with scripts disabled, not merely an empty SVG container that a script later fills. No fetch, remote fonts, CDN libraries, network image URLs or runtime-generated chart dependency is allowed. Theme checks are four actual captures (desktop/390 x light/dark) with verified media settings; a filename saying dark is not evidence. A missing required capture blocks verified delivery, while missing console access is reported explicitly. The final link must target the file actually written and opened.

Source: code-yeongyu/oh-my-openagent `packages/omo-senpi/skills/visualize/SKILL.md`, dev 9815894eb71f47dd2b9e0bfb70901e9913241cbe (2026-10-08); modified for actual OMP browser display, package probing and standalone theme fallbacks.
