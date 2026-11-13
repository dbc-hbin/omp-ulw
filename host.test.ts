import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { adaptResearchRouting, replaceHostBehavior } from "./host";
import { projectHostGuidance } from "./host-guidance";
import { renderPreset } from "./presets";

const base = `<system-conventions>Host message conventions</system-conventions>
§ Role
Original role
# Engineering
Original coding guidance
§ Runtime
<skills>available skill</skills>
# Internal URLs
agent:// and xd://
§ Tool Policy
# General
Original delegation preference
# Tool I/O
Call tools by their exposed names
# Specialized Tools
Edit using the active editing tool
# Delegation
Original fan-out preference
§ Workflow
Original workflow
§ Delivery
Original reporting
§ Memory
Original memory
§ Completion
Original completion
§ Critical
Original critical`;

test("behavior replacement preserves host capabilities, project instructions, and specialized agent assignment", () => {
  const project = "<repo-rules>Never modify customer data</repo-rules>";
  const agent = "Review only; report security findings without edits";
  const result = replaceHostBehavior([base, project, agent], "<omp-model-preset>Chosen model behavior</omp-model-preset>");
  expect(result).toBeDefined();
  expect(result?.blocks.slice(1)).toEqual([project, agent]);
  const first = result?.blocks[0] ?? "";
  expect(first).toContain("<skills>available skill</skills>");
  expect(first).toContain("Original delegation preference");
  expect(first).toContain("Call tools by their exposed names");
  expect(first).toContain("Original workflow");
  expect(first).toContain("Original reporting");
  expect(first).toContain("Original memory");
  expect(first).toContain("Original completion");
  expect(first).toContain("Original critical");
  expect(first).toContain("Chosen model behavior");
  expect(first).not.toContain("Original role");
  expect(result?.originalBehavior).toContain("Original role");
  expect(result?.originalBehavior).not.toContain("<skills>");
});

test.each(["§", "⁂"])("OMP %s system template replaces only the role block", (marker) => {
  const ompTemplate = readFileSync(new URL("./tests/fixtures/omp-system-prompt.md", import.meta.url), "utf8").replaceAll("§", marker);
  const project = "<repo-rules>Keep the existing task contract</repo-rules>";
  const agent = "Review only; do not edit outside the assigned paths";
  const replacement = "<omp-model-preset>Model-specific role</omp-model-preset>";
  const result = replaceHostBehavior([ompTemplate, project, agent], replacement);

  expect(result).toBeDefined();
  expect(result?.blocks.slice(1)).toEqual([project, agent]);
  const first = result?.blocks[0] ?? "";
  expect(first).toContain(replacement);
  expect(first).not.toContain("You are omp's trusted coding assistant.");
  for (const retained of [
    `${marker} Runtime`,
    `${marker} Scratchpad`,
    `${marker} Tool Policy`,
    `${marker} Workflow`,
    `${marker} Delivery`,
    `${marker} Critical`,
    "skill://<name>",
    "native `task` schema",
  ]) {
    expect(first).toContain(retained);
  }
  expect(result?.originalBehavior).toContain("You are omp's trusted coding assistant.");
  expect(result?.originalBehavior).not.toContain(`${marker} Runtime`);
});

test("project and global context in block zero survive replacement", () => {
  const context = "<project-context>Use the repository's existing adapter</project-context>";
  const result = replaceHostBehavior([`${context}\n${base}`], "replacement");
  expect(result?.blocks[0]).toContain(context);
  expect(result?.blocks[0]).toContain("replacement");
});

test("research routing changes only the host policy region, never project or runtime text", () => {
  const directive = "Map unknown code via `task`, not reading file after file yourself.";
  const routing = adaptResearchRouting(directive);
  expect(routing).not.toBe(directive);
  for (const contract of ["`scout`", "`sonic`", "`reviewer`", "`security-reviewer`", "`seance`", "`sourceSession`", "`solutionSpace`"]) {
    expect(routing).toContain(contract);
  }
  expect(adaptResearchRouting(routing)).toBe(routing);
  const taskDirective = "Read-only research MUST use `scout` only when files unknown.";
  const inputs = "# Inputs\n- `agent`: most specific.\n";
  const agents = "\n# Available Agents\nAgent descriptions and permission contracts";
  expect(adaptResearchRouting(inputs + taskDirective + agents)).toBe(inputs + routing + agents);
  const context = `<project-context>${directive}</project-context>`;
  const runtime = `<skills>${directive}</skills>`;
  const template = `${context}\n${base.replace("<skills>available skill</skills>", runtime).replace("Original fan-out preference", directive)}`;
  const project = `<repo-rules>${directive}</repo-rules>`;
  const result = replaceHostBehavior([template, project], "<omp-model-preset>role</omp-model-preset>")!;
  const policy = template.slice(template.indexOf("\n§ Tool Policy\n"), template.indexOf("\n§ Workflow\n"));
  expect(adaptResearchRouting(policy)).not.toBe(policy);
  expect(result.blocks[0].slice(0, result.blocks[0].indexOf("\n§ Role\n"))).toBe(template.slice(0, template.indexOf("\n§ Role\n")));
  expect(result.blocks[0].slice(result.blocks[0].indexOf("\n§ Runtime\n"), result.blocks[0].indexOf("\n§ Tool Policy\n"))).toBe(template.slice(template.indexOf("\n§ Runtime\n"), template.indexOf("\n§ Tool Policy\n")));
  expect(result.blocks[0].slice(result.blocks[0].indexOf("\n§ Tool Policy\n"), result.blocks[0].indexOf("\n§ Workflow\n"))).toBe(adaptResearchRouting(policy));
  expect(result.blocks[0].slice(result.blocks[0].indexOf("\n§ Workflow\n"))).toBe(template.slice(template.indexOf("\n§ Workflow\n")));
  expect(result.blocks[1]).toBe(project);
  const source = result.blocks[0];
  expect(projectHostGuidance(source, source, true)).not.toContain(routing);
  expect(projectHostGuidance(source, source, false)).toContain(routing);
});

test.each([
  "You are a read-only reviewer",
  base.replace("§ Runtime", "Host capabilities"),
  base.replace("§ Runtime", "⁂ Runtime"),
  base.replaceAll("§", "⁂").replace("⁂ Workflow", "§ Workflow"),
])("custom, incomplete and mixed-marker prompts are preserved (%#)", (template) => {
  expect(replaceHostBehavior([template], "replacement")).toBeUndefined();
});

test("an already-owned profile cannot be nested by a second installation", () => {
  for (const prefix of ["omp", "omo"]) {
    const first = replaceHostBehavior([base], `<${prefix}-model-preset>profile</${prefix}-model-preset>`);
    expect(replaceHostBehavior(first?.blocks ?? [], "<omp-model-preset>other</omp-model-preset>")).toBeUndefined();
  }
});

test("model guidance owns behavioral sections while native capability and permission regions survive", () => {
  const template = base.replace("Original workflow", "# 1. Before Editing\nNATIVE_SCOPE\n# 4. Implement\nPERMISSION_BOUNDARY\n# 2. Verify\nNATIVE_CHECKS\n# 3. Cleanup\nNATIVE_CLEANUP");
  const prepared = replaceHostBehavior([template], "<omp-model-preset>MODEL_BEHAVIOR</omp-model-preset>");
  if (!prepared) throw new Error("Expected recognized host template");
  const source = prepared.blocks[0];
  const result = projectHostGuidance(source, source, true);
  const policyAt = source.indexOf("\n§ Tool Policy\n");
  expect(result.slice(0, result.indexOf("\n§ Tool Policy\n"))).toBe(source.slice(0, policyAt));
  expect(result.slice(result.indexOf("\n§ Delivery\n"))).toBe(source.slice(source.indexOf("\n§ Delivery\n")));
  // These headings are keys consumed by the host-section parser.
  for (const section of ["# General\n", "# Delegation\n", "# 2. Verify\n", "# 3. Cleanup\n"]) {
    expect(result.includes(section)).toBe(false);
  }
  // Pre-delivery permission text in Before Editing stays native; model guidance does not own it.
  expect(result.includes("# 1. Before Editing\nNATIVE_SCOPE")).toBe(true);
  expect(result.includes("# Tool I/O\n")).toBe(true);
  expect(result.includes("# Specialized Tools\n")).toBe(true);
  expect(result.includes("# 4. Implement\nPERMISSION_BOUNDARY")).toBe(true);
});

test("native fallback restores its original policy without replacing the current profile or appended context", () => {
  const prepared = replaceHostBehavior([base], "<omp-model-preset>FALLBACK_ROLE</omp-model-preset>");
  if (!prepared) throw new Error("Expected recognized host template");
  const source = prepared.blocks[0];
  const policyRemoved = source.replace("# General\nOriginal delegation preference\n", "");
  const context = "\n<project-context>Do not change project ownership</project-context>";
  expect(projectHostGuidance(policyRemoved + context, source, false)).toBe(source + context);
});

test("native rules follow active profile coverage while permissions and fallback survive", () => {
  const profile = renderPreset({ id: "gpt-6.1-sol" }, { surface: "terminal", toolNames: ["todo", "bash", "ask", "wait"] });
  if (!profile) throw new Error("Expected supported model profile");
  const beforeEditing = [
    "# 1. Before Editing",
    "- Read relevant skills and rules first.",
    "- Reuse existing patterns; NEVER add a second convention.",
    "- Exported symbol changes: MUST run `lsp` references first.",
    "- Tool failed or file changed underneath? Re-read first.",
    "- Update todos; skip trivial requests.",
    "- Ask before destructive commands or deleting unrelated code you didn't write; code your change makes obsolete is in scope.",
    "# 2. Hand-off",
    "- NEVER run builds, tests, linters, formatters or smoke runs unless your assignment says to; the main agent verifies once all subagents land.",
  ].join("\n");
  const delivery = [
    "- NEVER fabricate output; unobserved claims = `[INFERENCE]`; report only verification you ran.",
    '- Solve the real ask: no extra scope (retries, validation, abstraction "while you\'re at it"), no symptom fixes (suppressed errors, special-cased input).',
    "- Clean cutover: migrate every caller; remove obsolete code, comments, aliases, re-exports; no shims.",
    '- Done = every requested behavior, end to end. NEVER stubs, placeholders, mocks, no-ops, fake fallbacks, `TODO`s, "follow-up"/"MVP" deferrals, narrowed tests, or silently narrowed scope; shrink only with explicit user approval.',
    "- Blocked only when tools can't reach the info; a failed check is not a blocker. Finish reachable work, then state what's missing and what you tried. NEVER ask for info tools can find.",
    "- Match the requested output format.",
    "- Project-specific delivery rule remains authoritative.",
  ].join("\n");
  const template = base
    .replace("<skills>available skill</skills>", "Matching skill → MUST read skill://<name> first.\n<skills>available skill</skills>")
    .replace("Original workflow", beforeEditing)
    .replace("Original reporting", delivery);
  const marked = `<omp-model-preset>${profile.prompt}</omp-model-preset>`;
  const prepared = replaceHostBehavior([template], marked);
  if (!prepared) throw new Error("Expected recognized host template");
  const source = prepared.blocks[0];
  const reduced = projectHostGuidance(source, source, true);
  for (const covered of [
    "- Read relevant skills and rules first.",
    "- Reuse existing patterns; NEVER add a second convention.",
    "- Update todos; skip trivial requests.",
  ]) expect(reduced).not.toContain(covered);
  expect(reduced).toContain("- Read relevant rules first.");
  expect(reduced).toContain(delivery);
  for (const retained of [
    "Matching skill → MUST read skill://<name> first.",
    "- Exported symbol changes:",
    "- Tool failed or file changed underneath? Re-read first.",
    "- Ask before destructive commands",
    "# 2. Hand-off",
    "- NEVER run builds, tests, linters, formatters or smoke runs unless your assignment says to;",
    "unobserved claims = `[INFERENCE]`",
    "- Clean cutover:",
    "- Match the requested output format.",
    "- Project-specific delivery rule remains authoritative.",
  ]) expect(reduced).toContain(retained);
  const otherProfile = "<omp-model-preset>Different working methods without equivalent rules</omp-model-preset>";
  const switched = reduced.replace(marked, otherProfile);
  const context = "\n<project-context>Keep this caller-owned context</project-context>";
  const uncovered = projectHostGuidance(switched + context, source, true);
  // Runtime still owns skill loading; profile-dependent rules must return.
  expect(uncovered).toContain(beforeEditing.replace("skills and rules first.", "rules first."));
  expect(uncovered).toContain(delivery);
  expect(projectHostGuidance(switched + context, source, false)).toBe(source.replace(marked, otherProfile) + context);
});

test.each(["§", "⁂"])("live %s Delivery constraints survive supported and fallback projections", marker => {
  const template = base.replaceAll("§", marker);
  const prepared = replaceHostBehavior([template], "<omp-model-preset>Model behavior</omp-model-preset>");
  if (!prepared) throw new Error("Expected recognized host template");
  const source = prepared.blocks[0];
  const originalDelivery = `${marker} Delivery\nOriginal reporting\n`;
  const liveDelivery = `${marker} Delivery\n- Do not publish customer data.\n- Report only redacted evidence, replacing the prior reporting requirement.\n`;
  let current = source.replace(originalDelivery, liveDelivery);
  for (const modelGuidance of [true, false, true]) {
    current = projectHostGuidance(current, source, modelGuidance);
    const start = current.indexOf(`${marker} Delivery\n`);
    const end = current.indexOf(`${marker} Memory\n`, start);
    expect(current.slice(start, end)).toBe(liveDelivery);
    expect(current).not.toContain(originalDelivery);
  }
});
