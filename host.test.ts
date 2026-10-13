import { expect, test } from "bun:test";
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
Original reporting`;

test("behavior replacement preserves host capabilities, project instructions, and specialized agent assignment", () => {
  const project = "<repo-rules>Never modify customer data</repo-rules>";
  const agent = "Review only; report security findings without edits";
  const result = replaceHostBehavior([base, project, agent], "<omp-model-preset>Chosen model behavior</omp-model-preset>");
  expect(result).toBeDefined();
  expect(result?.blocks.slice(1)).toEqual([project, agent]);
  const first = result?.blocks[0] ?? "";
  expect(first).toContain("<skills>available skill</skills>");
  expect(first).toContain("Call tools by their exposed names");
  expect(first).toContain("Chosen model behavior");
  expect(first).not.toContain("Original role");
  expect(first).not.toContain("Original fan-out preference");
  expect(result?.originalBehavior).toContain("Original fan-out preference");
  expect(result?.originalBehavior).not.toContain("<skills>");
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
