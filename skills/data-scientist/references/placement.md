# Placement: where should this computation live?

Decide before touching the data. Wrong placement wastes minutes (re-scanning a file queried
ten times) or kills the machine (loading a dataset larger than RAM and swapping).

## The probe (run first, once)

Three facts, one cell or script:

```python
import os, shutil, subprocess, sys
size = os.path.getsize("data.csv")            # bytes on disk
disk_free = shutil.disk_usage(".").free       # spill headroom
if sys.platform == "darwin":
    physical_ram = int(subprocess.run(["sysctl", "-n", "hw.memsize"], capture_output=True, text=True).stdout)
else:
    physical_ram = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
# row estimate without loading (DuckDB streams the scan):
# duckdb.sql("SELECT count(*) FROM 'data.csv'")
```

The example reports physical RAM, not free RAM; check current available memory using the host's actual memory report before deciding residency. Never treat total memory as free capacity.

CSV typically expands 2-5x in memory (string columns dominate); Parquet expands less
predictably — compressed columns can inflate 10x. Estimate the working set from the
decompressed size of the columns the question actually touches, not the file size.

## In memory — load once, iterate

When the working set stays within roughly 25% of free RAM AND the session will run repeated
queries: load once (`CREATE TABLE t AS SELECT ...` in DuckDB, or a collected DataFrame),
then iterate. One scan up front converts every later query from a file re-scan into
milliseconds. Prune at load time — select only the needed columns, filter obvious dross —
so the resident table is the working set, not the raw file.

## In place / streaming — single pass, or bigger than RAM

- Single-pass questions: query the file directly (`FROM 'data.csv'`). Loading first is pure
  waste.
- Bigger than RAM, SQL-shaped: cap DuckDB and let it spill —

  ```sql
  SET memory_limit = '4GB';
  SET temp_directory = '/tmp/duckdb_spill';
  ```

  Aggregations, sorts, and window functions run out-of-core: slower, but bounded.
- Bigger than RAM, DataFrame-shaped: Polars streaming (`collect(engine="streaming")` on a
  lazy plan) in the resident kernel — or a uv one-shot on kernel-less harnesses.
- Manual chunked loops (read N rows, process, repeat) are the last resort — the engines'
  own out-of-core paths are faster and simpler than hand-rolled chunking.

## Remote, in place — move the query to the data

- Files behind http(s)/S3: DuckDB's httpfs extension reads Parquet and CSV remotely with
  projection and predicate pushdown —

  ```sql
  LOAD httpfs;   -- only if already installed; no automatic extension download
  SELECT region, SUM(amount) FROM 'https://example.com/sales.parquet'
  WHERE sale_date >= '2026-01-01' GROUP BY region;
  ```

  Parquet can push down projections/predicates and prune row groups; CSV generally requires scanning the stream. Confirm the actual format/protocol and preinstalled httpfs before claiming reduced network reads.
- Data on another machine you can execute on (a remote worker with more RAM, a box closer
  to the data): run the query there and return the aggregate. A group-by result is
  kilobytes; the source is gigabytes.
- Decision rule: result much smaller than data — move the query. Repeated local iteration
  on one slice — move a pruned copy of that slice once, then work locally in memory.

## Hardware notes

- Both engines parallelize across all cores by default; leave that alone except on shared
  machines (`SET threads = N` in DuckDB, `POLARS_MAX_THREADS` for Polars).
- Sustained swapping is the failure mode to avoid on memory-tight machines: when the probe
  says the working set is close to free RAM, choose streaming, not hope.
