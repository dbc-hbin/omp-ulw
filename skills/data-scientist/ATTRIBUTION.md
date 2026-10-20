# Source and port changes

Source basis: upstream data-science workflow. Practical placement, Polars, visualization and query-runner methodology is retained. OMP changes replace assumed resident packages and automatic cache/uv installers with package probes and explicit setup prerequisites, permit exact stdlib computation and static HTML/SVG charts, and invoke the query script through an already-prepared Python environment. No engine or plotting library is bundled.
