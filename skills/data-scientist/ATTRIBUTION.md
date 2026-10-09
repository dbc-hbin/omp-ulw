# Source and port changes

Source: omo 5.1.19 installed plugin `skills/data-scientist` from code-yeongyu/oh-my-openagent. Practical placement, Polars, visualization and query-runner methodology is retained. OMP port changes replace assumed resident packages and automatic cache/uv installers with package probes and explicit setup prerequisites, permit exact stdlib computation and static HTML/SVG charts, and invoke the query script through an already-prepared Python environment. No engine or plotting library is bundled.
