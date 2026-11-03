# Report gate glossary

These are the existing `contracts.mjs` defect codes; keep their spelling and severity compatible with report-tools output. They describe report validation, not general coding/QA policy. Invocation, applicability and outcome recording are in [deliverable-phase.md](deliverable-phase.md).

## Static and manifest codes

| Code | Severity | Meaning and correction |
| --- | --- | --- |
| `korean_no_keep_all` | major | Hangul wrapping lacks keep-all; use `word-break: keep-all; overflow-wrap: anywhere`. |
| `palette_off_token` | minor | Color is outside the design palette; use/add the actual design token. |
| `emoji_in_prose` | major | Report prose contains emoji; replace under the selected report style. |
| `em_dash_in_prose` | major | Report prose contains an em dash; rewrite under the report style. |
| `en_dash_in_prose` | minor | En dash outside a numeric range; use appropriate punctuation. |
| `heading_too_long` | minor | Heading exceeds the checker's width/word threshold; shorten. |
| `heading_generic` | minor | Heading conveys no specific finding; make its subject explicit. |
| `unsourced_number` | major, minor in section lineage | Cite or tag numeric lineage as `MEASURED`, `ASSUMED`, `DERIVED`. |
| `chart_without_figure` | major | Figure/caption wrapper absent; add a captioned figure. |
| `chart_svg_no_text` | major | SVG has no usable text; preserve real labels/title. |
| `chart_svg_missing_labels` | minor | Chart lacks title, numeric ticks or labels; add the missing text. Diagram labels are not chart ticks. |
| `report_without_visual` | major | A required visual is absent; supply material evidence or explicitly record justified `not_applicable`/`blocked_capability` via the supported flag. |
| `image_missing_alt` | minor | Add informative alt text; purely decorative images need empty alt plus `role="presentation"`/`none` or `aria-hidden="true"`. Decorative images do not count as evidence visuals. |
| `korean_serif_font` | major | Korean serif/brush font conflicts with the report style; use the selected sans font. |
| `section_without_citation` | major | A substantive section lacks attribution; attach its sources. |
| `missing_closing_section` | blocker, integrity | Add methodology/source/gate closure. |
| `missing_citation_section` | blocker, integrity | Add references/sources or recognized citation definitions. |
| `broken_asset_reference` | blocker, integrity | Restore a missing/unreadable referenced asset. |
| `missing_required_section` | blocker, integrity | Add the section required through `--require-section`. |
| `missing_promised_deliverable` | blocker, integrity | Resolve a promised outcome row with a real file or reasoned terminal status. Raised by manifest verification. |

## Layout codes

| Code | Severity | Meaning and correction |
| --- | --- | --- |
| `layout_overflow` | major | Element exceeds its container; constrain or reflow. |
| `layout_text_clipped` | major | Text is hidden/clipped; remove clipping or give it space. |
| `layout_scroll_container` | minor | Scroll content may print clipped; distinguish responsive HTML from paginated output. |
| `layout_image_distorted` | major | Image aspect ratio is distorted; contain-fit with preserved ratio. |
| `layout_sibling_overlap` | major | Adjacent blocks overlap; correct spacing/layout. |

Layout consumes the `layout-probe` result as `check --layout <boxes.json>`. Missing probe means `not_run`, not a passed layout review. PDF/PNG/HTML files are not probe JSON.

## Status and citation semantics

Stored gate statuses are exactly `pass`, `fail`, `not_run`. The CLI `check` top-level status/exit code fails only on blockers; major/minor defects remain in its `defects` array and counts. Review them rather than interpreting exit 0 as defect-free. Defect rows require known `code` and human-readable `message`; integrity defects cannot be waived by exhausted repair. Outcome verification checks promises/files, not gate success or research truth.

Report tools recognize source markers such as `[S1]` and `[Source 1]`. The design spec's `Lineage: inline|section` controls number-lineage checking, not whether claims need evidence. Use the same source ids in the synthesis, final report and source ledger, and preserve their claim association when editing.
