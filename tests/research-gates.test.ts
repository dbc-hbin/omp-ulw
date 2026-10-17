import { describe, expect, test } from "bun:test";
import { checkStatic } from "../skills/ulw-research/scripts/gates-static.mjs";
import { parseHtml } from "../skills/ulw-research/scripts/html-lite.mjs";

const report = (body: string) => `<!doctype html><html><body>${body}</body></html>`;
const defectCodes = (source: string) => new Set(checkStatic(parseHtml(report(source))).defects.map(({ code }) => code));

describe("research report visual gates", () => {
  test("classifies visuals, image alternatives, dimensions, Mermaid diagrams, and charts deterministically", () => {
    const cases: Array<{ name: string; body: string; include: string[]; exclude?: string[] }> = [
      {
        name: "report without a visual",
        body: "<p>Finding [S1].</p>",
        include: ["report_without_visual"],
      },
      {
        name: "image with missing alt",
        body: '<figure><img src="chart.png" width="600" height="400"><figcaption>Chart [S1].</figcaption></figure>',
        include: ["image_missing_alt"],
        exclude: ["report_without_visual"],
      },
      {
        name: "image with empty alt",
        body: '<figure><img src="chart.png" alt="" width="600" height="400"><figcaption>Chart [S1].</figcaption></figure>',
        include: ["image_missing_alt"],
        exclude: ["report_without_visual"],
      },
      {
        name: "explicitly decorative image",
        body: '<figure><img src="ornament.png" alt="" role="presentation" width="600" height="400"><figcaption>Decoration [S1].</figcaption></figure>',
        include: ["report_without_visual"],
        exclude: ["image_missing_alt"],
      },
      {
        name: "aria-hidden decorative image",
        body: '<figure><img src="ornament.png" alt="" aria-hidden="true" width="600" height="400"><figcaption>Decoration [S1].</figcaption></figure>',
        include: ["report_without_visual"],
        exclude: ["image_missing_alt"],
      },
      {
        name: "inline style zero overrides nonzero attributes",
        body: '<figure><img src="chart.png" alt="Chart" width="600" height="400" style="width: 0px"><figcaption>Chart [S1].</figcaption></figure>',
        include: ["report_without_visual"],
      },
      {
        name: "inline style nonzero overrides zero attribute",
        body: '<figure><img src="chart.png" alt="Chart" width="0" height="400" style="width: 600px"><figcaption>Chart [S1].</figcaption></figure>',
        include: [],
        exclude: ["report_without_visual"],
      },
      {
        name: "zero dimension attribute is not a visual",
        body: '<figure><img src="chart.png" alt="Chart" width="0" height="400"><figcaption>Chart [S1].</figcaption></figure>',
        include: ["report_without_visual"],
      },
      {
        name: "zero dimension viewBox is not a visual",
        body: '<figure><svg viewBox="0 0 0 400" aria-roledescription="flowchart-v2"><text>Start</text></svg><figcaption>Flow [S1].</figcaption></figure>',
        include: ["report_without_visual"],
      },
      {
        name: "Mermaid diagram uses labels instead of numeric ticks",
        body: '<figure><svg width="600" height="400" aria-roledescription="flowchart-v2"><text>Start</text><text>Finish</text></svg><figcaption>Flow [S1].</figcaption></figure>',
        include: [],
        exclude: ["report_without_visual", "chart_svg_missing_labels", "chart_svg_no_text"],
      },
      {
        name: "ordinary chart still requires numeric ticks",
        body: '<figure><svg width="600" height="400"><title>Sales trend</title><text>1</text><text>2</text><text>Revenue</text></svg><figcaption>Sales [S1].</figcaption></figure>',
        include: ["chart_svg_missing_labels"],
        exclude: ["report_without_visual", "chart_svg_no_text"],
      },
    ];

    for (const { name, body, include, exclude = [] } of cases) {
      const codes = defectCodes(body);
      for (const code of include) expect(codes.has(code), `${name}: expected ${code}`).toBe(true);
      for (const code of exclude) expect(codes.has(code), `${name}: did not expect ${code}`).toBe(false);
    }
  });
});
