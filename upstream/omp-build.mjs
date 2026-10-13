import { buildHandoffSection } from "./handoff.ts";
import { buildIdentitySection } from "./identity.ts";
import { buildIntentGate } from "./intent-gate.ts";
import { buildPoliciesSection } from "./policies.ts";
import { buildStyleSection } from "./style.ts";
import { categorizeTools } from "./tool-categorization.ts";
import { buildVerificationSection } from "./verification.ts";
import { buildWorkingTaskSection } from "./working-task.ts";
export { terminalOrApp } from "./types.ts";

// OMP already supplies tools, context, skills and workstation instructions.
export function buildDynamicSystemPrompt(options) {
  const tools = categorizeTools(options.selectedTools);
  const surface = options.surface ?? "terminal";
  const sections = options.corePrompt
    ? [options.corePrompt({ tools, toolSection: "", surface, appName: "omp" })]
    : [buildIdentitySection("omp"), "", buildIntentGate({ tools, surface }), "", buildWorkingTaskSection(), "", buildVerificationSection({ surface }), "", buildPoliciesSection(), "", buildHandoffSection({ surface }), "", buildStyleSection({ surface })];
  const tuning = options.tuningSection?.trim();
  if (tuning) sections.push("", tuning);
  return sections.join("\n");
}
