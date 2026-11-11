# ulw-research - report visualization

Use visuals when they clarify material evidence or the user requests them. A text report is valid; numbers or a list alone do not require a chart, and a report needs neither a generated cover nor a separate visual workflow. Keep format promises and report gate records under [deliverable-phase.md](deliverable-phase.md).

## Evidence visuals

| Evidence | Suitable presentation |
| --- | --- |
| Trends, comparisons, distributions, shares | Chart computed from a cited CSV/JSON table; retain the table and computation. |
| Process, architecture, dependency, argument | Rendered diagram with labeled relations and cited scope. |
| Product/page behavior | Actual screenshot with source, access date and relevant state/version. |
| Video evidence | Link with timestamp; a captioned still for paginated reports. |
| Neural model layer shapes | TikZ/PlotNeuralNet only when the cited layer dimensions matter and that toolchain is available. |
| Concept illustration | Optional, labeled illustration; never fabricated data, labels or evidence. |

Save material assets under `$SESSION_DIR/assets/`, retain their source/data, and confirm referenced files exist and are non-empty. Caption every evidence figure with the conclusion and source/lineage. Preserve aspect ratio with contain-fit in its container; do not stretch or crop away evidence. Charts need readable title, axes, units, values and color-independent series labels. Match the report's design-spec fonts and palette. Alt text describes the information, not the filename; decorative images use `alt=""` with `role="presentation"` (or `none`/`aria-hidden="true"`) and do not count as evidence visuals.

## Render details that affect evidence

- Keep SVG chart labels as real text. For matplotlib, `matplotlib.rcParams["svg.fonttype"] = "none"` avoids converting labels to paths that the report gates cannot inspect.
- For Mermaid, disable `htmlLabels` so SVG labels do not depend on `foreignObject`; split dense diagrams instead of shrinking unreadable text. Preserve the `.mmd` source.
- Vector PDF is suitable for LaTeX; SVG is suitable for HTML. Use raster exports when a destination cannot preserve vectors. A source diagram is not a rendered figure.
- Cite the exact screenshot or video state relevant to the claim. Source media and generated illustrations have different evidentiary status.

For an existing Mermaid toolchain and configuration derived from `design-spec.md`:

```bash
mmdc -i "$SESSION_DIR/assets/flow.mmd" -o "$SESSION_DIR/assets/flow.svg" -c "$SESSION_DIR/assets/mermaid-config.json" -b transparent
```

If rendering is unavailable, retain the source, use a code block only where the destination actually renders it, and disclose the unavailable render. Do not claim that fetched text establishes a rendered-page observation.

### Reference compare — requested visual reproductions only

Apply this only when the requested deliverable reproduces a screenshot, video, 3D scene or figure, not merely when it cites one. The actual source and user's fidelity requirements govern the comparison.

1. Inspect the real reference and choose representative states/views needed to judge fidelity, without a fixed frame quota.
2. Capture the actual reproduction and pair source/render at the matching timestamp or state, camera/viewpoint, viewport and aspect ratio where applicable. Record identifiers and alignment limits.
3. Inspect pairs side-by-side for relevant geometry, framing, scale, layout, typography, color, lighting/materials, labels/data or motion. Record concrete gaps, corrections and fresh comparison evidence after relevant corrections.
4. Retain useful first/final pairs in the journal/report; disclose residual gaps or inaccessible source/render evidence. Unobserved fidelity remains unverified.

Comparison evidence belongs in the existing research report, not a new mandatory manifest. The report remains due alongside the reproduction.

## HTML handoff

Read [browser](../../browser/SKILL.md) for the native Eval route and [browser setup](../../visual-qa/references/browser-setup.md) for the applicable capture/media states, including on direct research skill invocation. Browser-dependent delegated figure/reproduction work follows the browser skill's [assignment contract](../../browser/SKILL.md#delegated-page-work), with source/state and capture evidence returned to the research owner.

When HTML is selected, open and inspect the actual report, not only its embedded demo, and provide a clickable artifact link to that same file. Leave it available in the browser or a retained report tab when supported. If display is unavailable, link the file and disclose the limitation without claiming a preview. This does not convert requested chat/Markdown reports to HTML.

## Gate compatibility

The existing checker accepts `--visual-requirement auto|required|not_applicable|blocked_capability`. Use `required` for a material promised visual, `not_applicable` for an intentionally text-only report, and `blocked_capability` for an unavailable required render; record the basis. Its automatic detector is heuristic, not a research conclusion.

| Evidence property | Gate code/check |
| --- | --- |
| Required evidence visual absent | `report_without_visual` |
| Figure/caption missing | `chart_without_figure` |
| SVG text/title/labels missing | `chart_svg_no_text`, `chart_svg_missing_labels` (diagrams do not require chart ticks) |
| Image alternative missing | `image_missing_alt` |
| Referenced asset unavailable | `broken_asset_reference` |
| Off-spec color | `palette_off_token` |
| Distorted or overflowing figure | `layout_image_distorted`, `layout_overflow` |
| Correct evidence, legibility, source/render match | Inspection of the actual output; cannot be established by source markup alone |
