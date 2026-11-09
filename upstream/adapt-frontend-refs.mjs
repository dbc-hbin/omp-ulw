import { designpowersAgents, designpowersSkills } from "./frontend-refs-manifest.mjs";

/**
 * Apply the established OMP adaptations to freshly copied pinned references.
 * Targets are relative to skills/frontend, as in the materialization manifest.
 * @param {string} target
 * @param {string} content
 * @returns {string}
 */
export function adapter(target, content) {
  switch (target) {
    case "references/design/taste-skill.md":
      // Keep the complete upstream body; HEAD's elision text was a capture artifact.
      return content.replace(
        "### 12.A File Location",
        "### 12.A Upstream proposed file location (not shipped or required by this port)",
      );
    case "references/design/gpt-tasteskill.md":
      return content
        .replace(
          "LLMs are inherently lazy and always pick the first layout option. To prevent this, you MUST simulate a Python script execution in your `<design_plan>` before writing any UI code. ",
          "For an explicitly requested Awwwards/high-craft or image/reference-led brief, simulate a Python script execution in your `<design_plan>` before writing UI code. Ordinary frontend work does not require this preflight or its forced layout randomization.",
        )
        .replace(
          "Every page MUST begin with",
          "For an explicitly routed Awwwards/high-craft brief, the page MUST begin with",
        )
        .replace(
          "Static interfaces are strictly forbidden. You must write real GSAP (`@gsap/react`, `ScrollTrigger`).",
          "For an explicitly motion-rich/high-craft brief, use real GSAP (`@gsap/react`, `ScrollTrigger`) where the interaction serves meaning; ordinary interfaces may remain static or use the project's existing motion tools.",
        )
        .replace("## 8. MANDATORY PRE-FLIGHT", "## 8. HIGH-CRAFT PRE-FLIGHT")
        .replace(
          "Before writing ANY React/UI code, you MUST output",
          "Before writing React/UI code for an explicitly routed Awwwards/high-craft or image/reference-led brief, output",
        );
    case "references/design/image-to-code-skill.md":
      return content
        .replace(
          "For visual website tasks, you must first generate the design image(s) yourself.",
          "A concrete user-supplied image/reference is already the image-first contract: analyze it, extract tokens/states and implement it; do not generate a competing target. Generated-reference work below applies only when the user requested concepts or the visual task lacks a concrete reference. Use the actual `generate_image` schema in `../runtime.md`, not a provider-specific tool.\nFor generated-reference website tasks, first generate the design image(s) yourself.",
        )
        .replace("## 2. MANDATORY IMAGE-FIRST RULE", "## 2. IMAGE-FIRST RULE (SCOPED)")
        .replace(
          "For website design requests where visual quality matters, image generation is mandatory first.",
          "For explicit generated-reference, image/reference-led, or high-craft website requests where no concrete user reference exists, image generation is first. Ordinary UI work and existing-project changes should infer from the current surface and start with implementation.",
        )
        .replace(
          "When this skill is used inside Codex or any environment that supports image generation plus implementation, default to an image-first workflow for website design tasks.",
          "When this skill is explicitly selected for an image/reference-led or high-craft website task, use an image-first workflow for that task.",
        )
        .replace(
          "For visually important frontend tasks, do not begin by freely designing in code.\nBegin by creating the visual references first whenever image generation is available.",
          "For explicitly visual/high-craft frontend tasks, do not begin by freely designing in code; begin by creating visual references when image generation is available. This is not a default requirement for ordinary UI work.",
        )
        .replace(
          "when the request is mainly about visual frontend quality.",
          "when the request explicitly asks for visual exploration, a reference, or high-craft art direction.",
        )
        .replace(
          /Trigger image-first workflow when the user asks for:\n(?:- [^\n]*\n)+/,
          "Trigger image-first workflow when the user explicitly asks for:\n- a visual concept or mockup before code\n- a premium/high-craft landing page or creative website\n- a screenshot/reference match or image-led redesign\n- a multi-section website concept where images are part of the requested deliverable\n- an explicit request to make visual exploration the primary deliverable\n",
        )
        .replace(
          "For visual website work, the skill must first generate",
          "For generated-reference website work, first generate",
        );
    default:
      break;
  }

  const skillReference = designpowersSkills.some(
    (name) => target === `references/designpowers/vendor/skills/${name}/reference.md`,
  );
  const agentReference = designpowersAgents.some(
    (name) => target === `references/designpowers/vendor/agents/${name}.md`,
  );
  if (!skillReference && !agentReference) return content;

  let adapted = content
    .replaceAll("design-state.md", "doc/frontend-design/state.md")
    .replaceAll("`design-state`", "the lead-owned doc/frontend-design/state.md ledger")
    .replaceAll("`design-discovery`", "the frontend direction/discovery lane")
    .replaceAll("`design-strategy`", "the frontend direction/strategy lane")
    .replaceAll("`design-taste`", "the current-project taste calibration in Lane A")
    .replaceAll("`using-designpowers`", "the local frontend orchestration contract")
    .replaceAll("**using-designpowers**", "**frontend orchestration**")
    .replaceAll(
      "**Calls:** `design-memory`",
      "**Records through:** actual OMP retain with provenance",
    )
    .replaceAll(
      "Invoke `design-memory` to add",
      "Use actual OMP recall/retain for observed design episodes with provenance to add",
    )
    .replaceAll("`design-memory`", "OMP recall/retain observational design episodes")
    .replaceAll("~/.designpowers/taste-profile.md", "the qualified observational design episodes returned by OMP recall");

  if (skillReference) {
    for (const name of designpowersSkills) {
      adapted = adapted.replaceAll(`\`${name}\``, `\`../${name}/reference.md\``);
    }
    adapted = adapted
      .replace(
        "Dispatch the existing reviewer agents **simultaneously**",
        "Dispatch the actual OMP reviewers using these role briefs **simultaneously**",
      )
      .replace(
        "dispatch `design-builder` with the prioritised fix list",
        "assign an actual OMP worker using the design-builder role brief with the prioritised fix list",
      )
      .replace(
        "This skill dispatches the **heuristic-evaluator** agent",
        "This reference supplies the heuristic-evaluator charter to an actual OMP reviewer",
      )
      .replace(
        "Dispatch the `heuristic-evaluator` agent (see `agents/heuristic-evaluator.md`).",
        "Dispatch an actual OMP reviewer using the local `../../agents/heuristic-evaluator.md` role brief.",
      );
  }

  if (agentReference) {
    adapted = adapted
      .replace(/^model: sonnet\n/m, "")
      .replace(
        /Use this instead of the built-in (?:content-designer|design-researcher|ux-lead) when working within a Designpowers workflow\./,
        "Use this as a role brief with actual listed OMP roles, not a callable agent type.",
      )
      .replace(
        "Use this instead of the built-in design-engineer when working within a Designpowers workflow.",
        "Use this as assignment context for an actual listed OMP worker; it is not a callable agent type.",
      )
      .replace(
        "If no content-writer output exists, write placeholder copy and mark it clearly as `/* TODO: content review needed */`",
        "If no content-writer output exists, use complete real copy from the task/project; ask only for missing required content and never ship placeholders",
      );
  }
  return adapted;
}
