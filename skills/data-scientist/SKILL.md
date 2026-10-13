---
name: data-scientist
description: "Processes and analyzes data with resident-kernel engines (DuckDB, Polars) and one-shot tools. Use for CSV/parquet/JSON analysis, group-by/join/aggregation, time series, distributions, cleaning, or plotting a dataset."
---

# Data Scientist: Hybrid-Engine Data Processing

Resolve relative reference paths from this skill's directory, not the project working directory; use `skill://data-scientist/<relative-path>` with `read`. Cross-skill reads use `skill://<name>`. Workflow labels such as `/visual-qa` name skills to load, not shell commands or guaranteed slash-command APIs.

Answer data questions through the cheapest engine and surface that can prove the answer, and
decide where the computation should live before touching the data.

## Execution surfaces: resident kernel first

A persistent REPL/eval kernel (many harnesses expose one for JavaScript and Python) is the
default surface. Reason: each one-shot process pays roughly a second of spawn-plus-import
overhead and re-scans the input file, while a resident connection amortizes both — after a
one-time load, repeat queries return in milliseconds. Exploration is repeat queries, so this
difference dominates the session.

1. **JavaScript kernel (Bun):** probe whether `@duckdb/node-api` is already installed/resolvable. Use static imports in a project script loaded into eval; keep the connection across cells. Do not run an installer automatically.
2. **Python kernel:** probe duckdb, polars, pyarrow, numpy and matplotlib availability before importing the needed engines; never assume they are resident. Use the installed subset, or stdlib csv/json/statistics for small exact tasks.
3. **Isolated one-shot:** use an existing Python/uv environment for memory-heavy or crash-prone work; dependency resolution/install requires a separate explicitly authorized setup step.
4. **No kernel:** batch questions through already-installed engine CLIs or a Python script.

Per-surface patterns and pitfalls: read `references/execution-surfaces.md` before first use.

## Engine selection

- **DuckDB** for SQL-shaped work: direct file queries, joins, aggregation, subqueries,
  window functions. It queries CSV/Parquet/JSON in place without loading, spills to disk
  past its memory limit, and reads remote files with the same syntax.
- **Polars** when the pipeline is DataFrame-shaped: expression-chain transforms, reshapes,
  streaming datasets past RAM — resident in the Python kernel when already installed.
  Read `references/polars-lane.md` — the current 1.x API differs from widely-memorized
  older spellings.
- **numpy** when numeric work goes beyond SQL/DataFrame aggregation: statistical tests,
  linear algebra, FFT, random sampling.
- **matplotlib** for standalone charts when installed; static SVG/HTML via `skill://visualize` for self-contained browser artifacts — read `references/visualization.md` first; it carries the
  quality bar and a mandatory visual check.

Performance folklore ("X is Nx faster at filtering") varies with data shape, cardinality,
and hardware. When the engine choice materially matters, measure on the actual data instead
of trusting remembered multipliers.

## Placement: decide where the computation lives

Probe before you compute — one cell: file size, free RAM, and (when unclear) a row count via
a direct scan. Then place the work:

- **Load into memory** when the working set stays within roughly a quarter of free RAM AND
  the session will run repeated queries: `CREATE TABLE t AS SELECT ...` (or a collected
  DataFrame) once, then iterate. One scan up front converts every later query from a file
  re-scan into milliseconds.
- **Query in place / stream** when the question is single-pass, or the data exceeds RAM:
  DuckDB reads files directly (`FROM 'data.csv'`); past RAM, cap DuckDB's memory and let it
  spill, or use Polars' streaming engine in the Python kernel. NEVER load a larger-than-RAM
  dataset fully into memory — swapping stalls the whole machine, while streaming merely
  takes longer.
- **Query remotely, in place** when the data lives elsewhere: DuckDB reads http(s)/S3
  Parquet with projection/predicate pushdown when supported; CSV usually requires scanning
  the stream. Query only the needed data and report actual network behavior. When data sits on another machine you can execute
  on, ship the query to the data and return the small result. Rule: result much smaller
  than data — move the query; repeated local iteration planned — move a pruned copy of the
  data once.

Sizing heuristics and recipes: `references/placement.md`.

## Hard rules

- **NEVER use pandas.** DuckDB and Polars beat it decisively on every workload this skill
  covers, and the environments this skill assumes do not ship it — `.df()` on a DuckDB
  result raises unless pandas is installed; convert with `.pl()` via Arrow instead.
- Excel files are not read directly: export to CSV or Parquet first.

## Output contract

Answer the question; report row counts and timing for anything heavy; then stop — no bonus
charts, no extra exploration passes beyond what the question needed. Chart when asked, or
when the answer is a shape (trend, distribution, comparison) that prose cannot carry — then
follow `references/visualization.md` including its visual QA step.

## References

| Read | When |
| --- | --- |
| `references/execution-surfaces.md` | before the first query on any surface: kernel patterns, one-shot recipes, escalation rules |
| `references/polars-lane.md` | DataFrame-shaped pipeline or data past RAM: current API, Arrow handoff, package sets |
| `references/placement.md` | before heavy or remote work: sizing probe, memory limits, remote reads |
| `references/visualization.md` | before any chart: type selection, quality bar, CJK fonts, visual QA |
| `references/uv-setup.md` | uv missing or broken on this machine |

## CLI fallback

Set `SKILL_DIR` to the observed absolute directory containing this skill's `SKILL.md`, resolved with `read` on `skill://data-scientist`; OMP does not set this shell variable automatically.

When no kernel exists, `python3 "$SKILL_DIR/scripts/quick-query.py" <file> [SQL]` (`--filter <polars-sql-expr>`, `--describe`) is a one-shot fallback only after Python 3.11+, duckdb, polars, pyarrow, typer and rich are confirmed installed. No automatic uv dependency resolution is required. Supports CSV, Parquet, JSON and NDJSON. Read its argument parsing before invoking; record query, grain, row counts, exclusions and elapsed time. Missing engines do not justify approximate or invented results.
