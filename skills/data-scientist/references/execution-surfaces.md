# Execution surfaces on OMP

Choose the cheapest already-available engine and keep repeat work resident. Probe packages first; this port never automatically installs libraries, mutates interpreters or downloads uv.

## Python resident kernel

```python
import importlib.util
available = {name: importlib.util.find_spec(name) is not None
             for name in ("duckdb", "polars", "pyarrow", "numpy", "matplotlib")}
print(available)
```

Import only the needed installed packages. A DuckDB connection and cached tables persist across eval cells; direct CSV/Parquet/JSON queries avoid eager loads. Use `.fetchall()` for plain values; `.pl()` needs Polars and pyarrow. Prefer `.pl()`; use `.df()` only when pandas is installed and the user, project, or available-engine constraints require it. Polars scans stay lazy until collect. Save charts as artifacts and visually inspect the real output; this Python subprocess is not IPython, so no get_ipython, magic matplotlib or assumed rich figure display.

## JavaScript resident kernel

Use installed `@duckdb/node-api` only after checking its resolution in the active project/eval environment. Write a project script through the file tool, with static import, then load it through the documented eval loader. The connection can be reused across cells:

```js
import { DuckDBInstance } from "@duckdb/node-api";
const db = await DuckDBInstance.create(":memory:");
const conn = await db.connect();
const reader = await conn.runAndReadAll("SELECT category, SUM(v) AS total FROM 'data.csv' GROUP BY 1");
const rows = reader.getRowObjects();
```

COUNT/SUM may return BigInt; convert precisely to String or range-checked Number before JSON serialization. Node Polars is not a substitute for the current Python API. For small exact CSV/JSON tasks with no engines, Python csv/json/statistics is sufficient; choose stdlib before adding a dependency. Inspect input files with read, never shell cat.

## One-shots and isolation

An existing environment can run `python3 "$SKILL_DIR/scripts/quick-query.py" data.csv "SELECT ... FROM data"` after confirming all its imports. Batch related queries per process. A uv environment is optional isolation, not assumed installed: use `uv run --offline --no-sync` only with a prepared project environment, or run its interpreter directly. If a required package is absent, finish independent inspection and report the exact prerequisite; any install is an explicit setup decision, not an analysis side effect.

For heavy/remote inputs read [placement](placement.md); put memory-hungry work in native async bash. Results auto-deliver; call native wait() with no arguments only when blocked on a pending job you started. Do not repeat shell status polling or sleeps. Retain the query, file/input digest, grain, filters, null/duplicate handling, row counts and timing with output.
