# Visualization

A chart exists to answer a question at a glance. Build a self-contained browser artifact in
HTML with static markup/SVG through `skill://visualize`; its theme and width adapt to the
reader. Use installed matplotlib for standalone PNG charts in kernels, files or documents.
The chart-type, Figures and Quality bar sections apply to both; matplotlib calls apply only
to the PNG route. Probe the chosen engine/font first; do not auto-install libraries. Look
at the rendered artifact before delivering: a chart nobody inspected is not evidence.

## When to chart

Chart when the user asked for one, and default to charting when the answer is a shape prose
cannot carry: a trend over time, a distribution, a comparison across many categories, a
relationship between variables. Skip the chart when a number or a five-row table answers the
question — decoration dilutes the answer.

## Chart type follows the question

| Question shape | Chart |
| --- | --- |
| How did X change over time? | line, datetime x-axis |
| Which categories are biggest? | horizontal bar, sorted by value |
| How is X distributed? | histogram (tune bin count) or box plot per group |
| Is X related to Y? | scatter; add a trend line only when it aids the eye |
| Composition of a whole? | stacked or 100% bar — pie only for four or fewer slices |
| Many series over time? | small multiples over one spaghetti chart |

## Figures — every chart

- **Days start at the reader's midnight.** Unless the user or project specifies another
  reporting zone, cut daily, weekly and monthly buckets in the reader's time zone, and
  name that zone in the axis label or caption. Resolve an unknown zone before bucketing;
  do not silently substitute UTC or the execution machine's zone. Mark an unfinished
  bucket (today, this week or this month) as partial on its own bar with a lighter fill or
  hatch and a label, not only in a subtitle where it can read as a drop.
- **Cross-check one figure.** Recompute a headline number from a second source (another
  table, the system's own dashboard or a raw count). Name that source beside the chart,
  state whether it agrees, and quantify any difference. If a second source is unavailable,
  disclose that limitation and leave the cross-check unverified; never invent agreement.

## Quality bar — every chart

- Title states the finding ("Seoul overtook Busan in March"), not the dataset name.
- Axis labels carry units. Tick density stays readable: `fig.autofmt_xdate()` for dates,
  rotate or abbreviate long category names.
- Size for the medium: standalone kernel plots read well around `figsize=(10, 6)` at default dpi;
  documents want `dpi=150` or more at export.
- `tight_layout()` (or `constrained_layout=True`) before saving — clipped labels are the
  most common chart defect.
- Few series: label lines directly, or keep the legend inside empty plot space. Many
  series: gray the context, color only the series that answers the question.
- The default color cycle is fine; avoid rainbow palettes and 3D. Sort categorical bars by
  value, never alphabetically.

## CJK and other non-Latin text

Matplotlib's default font renders CJK as empty boxes (tofu). Set a fallback before plotting
whenever any label or title contains CJK:

```python
import platform
import matplotlib
cjk = {"Darwin": "AppleGothic", "Windows": "Malgun Gothic"}.get(platform.system(), "Noto Sans CJK KR")
matplotlib.rcParams["font.family"] = [cjk, "DejaVu Sans"]
matplotlib.rcParams["axes.unicode_minus"] = False   # keeps the minus sign rendering
```

## Output contract

1. For a browser artifact, hand the computed figures to `skill://visualize` for HTML and
   its four theme/viewport captures, actual browser display and clickable artifact link.
2. For a standalone file or document, save a PNG next to the work:
   `plt.savefig(path, dpi=150, bbox_inches="tight")`. Also display it when the kernel or
   other surface supports rich image output.
3. Report the path to the actual generated file together with the answer.

## Visual QA — mandatory

For HTML, follow the browser measurements and captures in `skill://visualize`. For PNG,
open the produced image — kernel display, or the harness's image-reading surface — and
check four things: labels readable and unclipped, no tofu or mojibake, nothing overlapping,
and the chart actually shows the finding the title claims. A failed check means fix and
re-render, not ship with a caveat. This one pass catches nearly every chart defect;
skipping it is how tofu titles reach users.

Source: [OMO chart correctness policy, `0472192d549b861abfc5c1d6f1c3f12caf6c12c8`](https://github.com/code-yeongyu/oh-my-openagent/commit/0472192d549b861abfc5c1d6f1c3f12caf6c12c8), reconciled with [pinned final visualization reference](https://github.com/code-yeongyu/oh-my-openagent/blob/adddd17004076e799c2de18ccfdee29e12525ace/packages/shared-skills/skills/data-scientist/references/visualization.md); adapted for actual OMP browser artifacts and installed engines.
