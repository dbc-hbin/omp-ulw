import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
export const frontendSkillRoot = join(repositoryRoot, "skills", "frontend");
export const upstreamNames = Object.freeze([
  "open-design", "taste-skill", "ui-ux-pro-max", "designpowers",
]);

export const designOriginals = Object.freeze([
  "README.md", "_INDEX.md", "ambience-skill.md", "aside.md",
  "clone-from-url.md", "component-catalogs.md", "design-system-architecture.md",
  "grounding.md", "interaction-skill.md", "layout-skill.md", "lazyweb.md",
  "print-paged-media.md", "react-dev-tooling-skill.md", "stylegallery.md",
]);

export const openDesignBrands = Object.freeze([
  "airbnb", "airtable", "apple", "binance", "bmw", "bugatti", "cal", "claude",
  "clay", "clickhouse", "cohere", "coinbase", "composio", "cursor", "elevenlabs",
  "expo", "ferrari", "figma", "framer", "hashicorp", "ibm", "intercom", "kraken",
  "lamborghini", "linear.app", "lovable", "mastercard", "meta", "minimax",
  "mintlify", "miro", "mistral.ai", "mongodb", "nike", "notion", "nvidia",
  "ollama", "opencode.ai", "pinterest", "playstation", "posthog", "raycast",
  "renault", "replicate", "resend", "revolut", "runwayml", "sanity", "sentry",
  "shopify", "spacex", "spotify", "starbucks", "stripe", "supabase", "superhuman",
  "tesla", "theverge", "together.ai", "uber", "vercel", "vodafone", "voltagent",
  "warp", "webflow", "wired", "wise", "x.ai", "zapier",
]);

export const tasteSkillSources = Object.freeze({
  "taste-skill": "taste-skill", "gpt-tasteskill": "gpt-tasteskill",
  "minimalist-skill": "minimalist-skill", "brutalist-skill": "brutalist-skill",
  "soft-skill": "soft-skill", "redesign-skill": "redesign-skill",
  "image-to-code-skill": "image-to-code-skill", "output-skill": "output-skill",
  "stitch-skill": "stitch-skill", "imagegen-frontend-web": "imagegen-frontend-web",
  "imagegen-frontend-mobile": "imagegen-frontend-mobile", "imagegen-brandkit": "brandkit",
});

export const uiUxDataFiles = Object.freeze([
  "app-interface", "charts", "colors", "google-fonts", "icons", "landing",
  "products", "react-performance", "styles", "typography", "ui-reasoning",
  "ux-guidelines",
]);
export const uiUxStacks = Object.freeze([
  "angular", "astro", "flutter", "html-tailwind", "jetpack-compose", "laravel",
  "nextjs", "nuxt-ui", "nuxtjs", "react-native", "react", "shadcn", "svelte",
  "swiftui", "threejs", "vue",
]);
export const uiUxScripts = Object.freeze(["core.py", "design_system.py", "search.py"]);

export const designpowersSkills = Object.freeze([
  "accessible-content", "adaptive-interfaces", "cognitive-accessibility", "design-debate",
  "design-debt-tracker", "design-handoff", "design-md", "design-retrospective",
  "design-review", "design-system-alignment", "designpowers-critique",
  "heuristic-evaluation", "inclusive-personas", "inspiration-scouting",
  "interaction-design", "motion-choreography", "research-planning", "responsive-patterns",
  "synthetic-user-testing", "taste-feedback", "taste-report", "token-architecture",
  "ui-composition", "usability-testing", "verification-before-shipping", "voice-and-tone",
  "writing-design-plans",
]);
export const designpowersAgents = Object.freeze([
  "accessibility-reviewer", "content-writer", "design-builder", "design-critic",
  "design-lead", "design-scout", "design-strategist", "heuristic-evaluator",
  "inspiration-scout", "motion-designer",
]);

/** @returns {Readonly<Record<string, {readonly upstream: string, readonly source: string}>>} */
export function thirdPartyMaterializeMap() {
  /** @type {Array<[string, {readonly upstream: string, readonly source: string}]>} */
  const entries = [];
  /** @param {string} target @param {string} upstream @param {string} source */
  const add = (target, upstream, source) => entries.push([target, Object.freeze({ upstream, source })]);
  for (const brand of openDesignBrands) {
    add(`references/design/${brand}.md`, "open-design", `design-systems/${brand.replaceAll(".", "-")}/DESIGN.md`);
  }
  for (const [target, source] of Object.entries(tasteSkillSources)) {
    add(`references/design/${target}.md`, "taste-skill", `skills/${source}/SKILL.md`);
  }
  add("references/design/stitch-design-example.md", "taste-skill", "skills/stitch-skill/DESIGN.md");
  // These are the pinned raw equivalents, not the adapted deployment inventory.
  // ui-ux-pro-max.patch owns their local changes and all additional UI/UX files;
  // references/ui-ux-db/README.md remains an untouched tracked OMP guide.
  const uiRoot = "src/ui-ux-pro-max";
  for (const script of uiUxScripts) {
    add(`references/ui-ux-db/scripts/${script}`, "ui-ux-pro-max", `${uiRoot}/scripts/${script}`);
  }
  for (const name of uiUxDataFiles) {
    add(`references/ui-ux-db/data/${name}.csv`, "ui-ux-pro-max", `${uiRoot}/data/${name}.csv`);
  }
  for (const name of uiUxStacks) {
    add(`references/ui-ux-db/data/stacks/${name}.csv`, "ui-ux-pro-max", `${uiRoot}/data/stacks/${name}.csv`);
  }
  add("references/ui-ux-db/references/quick-reference.md", "ui-ux-pro-max", `${uiRoot}/templates/base/quick-reference.md`);
  add("references/designpowers/vendor/LICENSE", "designpowers", "LICENSE");
  for (const name of designpowersSkills) {
    add(`references/designpowers/vendor/skills/${name}/reference.md`, "designpowers", `skills/${name}/SKILL.md`);
  }
  for (const name of designpowersAgents) {
    add(`references/designpowers/vendor/agents/${name}.md`, "designpowers", `agents/${name}.md`);
  }
  return Object.freeze(Object.fromEntries(entries));
}

export function thirdPartyRelativePaths() {
  return Object.keys(thirdPartyMaterializeMap()).sort();
}
