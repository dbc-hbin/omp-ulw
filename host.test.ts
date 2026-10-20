import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { replaceHostBehavior } from "./host";

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

test("current OMP system template replaces only the role block", () => {
  const ompTemplate = readFileSync(new URL("./tests/fixtures/omp-system-prompt.md", import.meta.url), "utf8");
  const project = "<repo-rules>Keep the existing task contract</repo-rules>";
  const agent = "Review only; do not edit outside the assigned paths";
  const replacement = "<omp-model-preset>Model-specific role</omp-model-preset>";
  const result = replaceHostBehavior([ompTemplate, project, agent], replacement);

  expect(result).toBeDefined();
  expect(result?.blocks.slice(1)).toEqual([project, agent]);
  const first = result?.blocks[0] ?? "";
  expect(first).toContain(replacement);
  expect(first).not.toContain("You are omp's trusted coding assistant.");
  for (const marker of [
    "§ Runtime",
    "§ Scratchpad",
    "§ Tool Policy",
    "§ Workflow",
    "§ Delivery",
    "§ Critical",
    "skill://<name>",
    "native `task` schema",
  ]) {
    expect(first).toContain(marker);
  }
  expect(result?.originalBehavior).toContain("You are omp's trusted coding assistant.");
  expect(result?.originalBehavior).not.toContain("§ Runtime");
});

test("project and global context in block zero survive replacement", () => {
  const context = "<project-context>Use the repository's existing adapter</project-context>";
  const result = replaceHostBehavior([`${context}\n${base}`], "replacement");
  expect(result?.blocks[0]).toContain(context);
  expect(result?.blocks[0]).toContain("replacement");
});

test("custom and unfamiliar prompts are never replaced", () => {
  expect(replaceHostBehavior(["You are a read-only reviewer"], "replacement")).toBeUndefined();
  expect(replaceHostBehavior([base.replace("§ Runtime", "Host capabilities")], "replacement")).toBeUndefined();
});

test("an already-owned profile cannot be nested by a second installation", () => {
  for (const prefix of ["omp", "omo"]) {
    const first = replaceHostBehavior([base], `<${prefix}-model-preset>profile</${prefix}-model-preset>`);
    expect(replaceHostBehavior(first?.blocks ?? [], "<omp-model-preset>other</omp-model-preset>")).toBeUndefined();
  }
});
