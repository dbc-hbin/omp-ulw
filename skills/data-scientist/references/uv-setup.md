# Optional environment setup

Analysis does not require uv if the needed engines already exist in the resident kernel or a project environment. Probe the interpreter and package availability first; do not run download/install scripts or assume engines exist. This port intentionally omits the upstream automatic setup/install scripts.

When a required engine is missing, report the package names, interpreter, desired isolated environment and why stdlib/existing tools cannot answer exactly. Installation requires an explicit setup request. Prefer the project's existing dependency manager and lockfile; never mutate an externally-managed system Python, globally install npm packages or secretly create a user cache.

A prepared uv project can run offline with `uv run --offline --no-sync`; verify the environment is already populated. uv itself and initial package resolution need network/cache if not installed. Its existence does not prove DuckDB, Polars, Arrow or matplotlib availability.
