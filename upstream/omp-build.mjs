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
  const sharedSections = options.sharedSections ?? "diet";
  const sections = options.corePrompt
    ? [options.corePrompt({ tools, toolSection: "", surface, appName: "omp", sharedSections })]
    : [buildIdentitySection("omp", sharedSections), "", buildIntentGate({ tools, surface, sharedSections }), "", buildWorkingTaskSection({ sharedSections }), "", buildVerificationSection({ surface, sharedSections }), "", buildPoliciesSection({ sharedSections }), "", buildHandoffSection({ surface, sharedSections }), "", buildStyleSection({ surface, sharedSections })];
  const tuning = options.tuningSection?.trim();
  if (tuning) sections.push("", tuning);
  return sections.join("\n");
}
