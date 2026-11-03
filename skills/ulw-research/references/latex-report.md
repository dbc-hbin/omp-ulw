# ulw-research - LaTeX reports

Use this route for a requested `.tex`/LaTeX report or an agreed typeset PDF. Deliver the sources and compiled PDF; if compilation is unavailable, resolve the PDF promise as blocked/failed rather than calling sources a compiled deliverable. Report state, outcome rows and applicable gates remain defined in [deliverable-phase.md](deliverable-phase.md).

## Engine and compilation

Prefer `latexmk` for dependency-driven multipass compilation. Use XeLaTeX for CJK/heavy Unicode with an actual installed font; pdfLaTeX is suitable for other reports, and LuaLaTeX when needed. An available Tectonic toolchain is another compiler, not evidence that compilation already succeeded.

From the report root containing `main.tex`, use the applicable installed route:

```bash
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
latexmk -xelatex -interaction=nonstopmode -halt-on-error main.tex
```

Without latexmk, use the selected engine, then the bibliography backend when applicable, then enough engine passes to stabilize citations, contents and cross-references:

```bash
xelatex -interaction=nonstopmode -halt-on-error main.tex
bibtex main
xelatex -interaction=nonstopmode -halt-on-error main.tex
xelatex -interaction=nonstopmode -halt-on-error main.tex
```

The example uses XeLaTeX/BibTeX; substitute the actual selected engine/backend (`biber` for a matching biblatex setup) and omit bibliography commands for a manual bibliography. Fix the first `!` error before cascading failures. Unresolved citations/references and significant overfull boxes are report defects. Preserve useful logs and inspect the rendered PDF, not just successful exit status:

```bash
pdftoppm -png -r 110 main.pdf page
```

Check actual pages for missing figures, illegible text, overflowing tables/CJK, blank pages and bad pagination. Record actual page captures with `outcome render` when available.

## Source structure and citations

Create `main.tex` with `% STATUS: draft - <n> sections open` within its first five lines. Use `sections/*.tex` and `\input` for a long document when useful; this is a document structure, not a prescribed delegation topology. Fonts, palette and figure styling come from the report's design spec/reference.

A minimal preamble can start with:

```latex
\documentclass[11pt,a4paper]{article}
\usepackage{iftex}
\ifPDFTeX
  \usepackage[utf8]{inputenc}
  \usepackage[T1]{fontenc}
  \usepackage{lmodern}
\else
  \usepackage{fontspec}
  % Set the actual installed report-language font here.
\fi
\usepackage[a4paper,margin=1in]{geometry}
\usepackage{graphicx,booktabs,tabularx,longtable,xcolor}
\usepackage{hyperref}
\usepackage{xurl}
```

Map the cited synthesis into an executive answer, themed findings and analysis, comparisons where relevant, methodology/corrections, gaps and sources. Every factual claim remains attached to its evidence through `\cite{srcN}` or the agreed citation style.

Each bibliography entry must trace to a source actually retrieved and recorded in `sources-ledger.md`, with access date and stable URL/commit where applicable. Use BibTeX/biblatex when the matching backend exists or a manual `thebibliography` otherwise. Never invent an entry from memory. Sources cited in the report map to ledger entries; keep uncited background material distinct from the final bibliography.

A prose polish must preserve numbers, units, qualifiers, claim associations and citation attachment. Vary rhythm and remove filler without moving/removing a `\cite{...}` or strengthening an uncertain claim. Recheck affected claims against their sources after wording changes.

## Evidence exhibits

- Charts derive from retained cited CSV/JSON and computation; vector PDF is suitable for inclusion. Keep title, axes, units and values legible.
- Use `\includegraphics[width=0.9\textwidth,keepaspectratio]{...}` inside a captioned/labeled figure and reference it in the analysis. Render diagram sources before inclusion; raw Mermaid is not a TeX figure.
- Use `booktabs`, `tabularx`/`longtable` for tables; retain units and source/lineage in captions. Avoid shrinking tables below readable text size.
- Escape text-mode `_`, `&`, `%`, `#`; use URL-aware commands for long links. Avoid repeated forced page breaks or fixed float placement that hides broken layout.

The report gate CLI consumes HTML, not `.tex` or PDF; do not feed it the wrong format or fabricate an HTML conversion. Validate TeX references/citations and actual rendered pages directly, recording inapplicable checker gates as `not_run` with the reason. Retain the requested sources/PDF and account for each promise using the existing outcome schema.
