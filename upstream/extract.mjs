// bun upstream/extract.mjs /path/to/omo /path/to/existing/@babel/parser/lib/index.js
// No parser is needed at runtime. Source: omo 5.1.18 embedded original builders.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const [binary, parserPath] = process.argv.slice(2);
if (!binary || !parserPath) throw new Error("Expected omo binary and existing Babel parser path");
const { parse } = require(parserPath);
const bytes = readFileSync(binary);
const source = bytes.toString("utf8");
const ranges = [
  ["function buildHandoffSection", "function assertExpectedLeaf"],
  ["function buildExecutionToolingSection", "function eventOptionsToBuilderInput"],
];
const regions = ranges.map(([start, end]) => {
  const offset = source.indexOf(start);
  const limit = source.indexOf(end, offset);
  if (offset < 0 || limit < 0) throw new Error(`Missing embedded region: ${start}`);
  return source.slice(offset, limit);
});
const omitted = new Set(["cpuModel", "terminalName", "collectWorkstationFacts", "executorPhrase", "buildWorkstationSection", "resolvePromptSurface", "buildContextFilesSection", "buildDynamicSystemPrompt", "loadPromptPresetSettings", "buildToolSection", "withDefaults", "resolvePreset"]);
const generated = [];
for (const region of regions) {
  for (const node of parse(region, { sourceType: "module" }).program.body) {
    if (node.type === "FunctionDeclaration") {
      if (!omitted.has(node.id.name)) generated.push(region.slice(node.start, node.end));
    } else if (node.type === "VariableDeclaration") {
      for (const declaration of node.declarations) {
        if (declaration.id.name.startsWith("init_")) {
          if (["init_workstation", "init_tool_section"].includes(declaration.id.name)) continue;
          const initializer = declaration.init.type === "CallExpression" ? declaration.init.arguments[0] : declaration.init;
          for (const statement of initializer.body.body) {
            if (statement.type === "ExpressionStatement" && statement.expression.type === "CallExpression") continue;
            generated.push(region.slice(statement.start, statement.end));
          }
        } else generated.push(`var ${region.slice(declaration.start, declaration.end)};`);
      }
    }
  }
}
const header = `// Generated from omo 5.1.18; binary sha256 ${createHash("sha256").update(bytes).digest("hex")}\n// Original behavioral builders/constants/order. Host provides tool, workstation, context, skills sections.\n`;
writeFileSync(new URL("source.js", import.meta.url), header + regions.join("\n"));
const adapter = `
var APP_NAME = "omp";
function buildDynamicSystemPrompt(options) {
  const tools = categorizeTools(options.selectedTools);
  const surface = options.surface ?? "terminal";
  const sections = options.corePrompt
    ? [options.corePrompt({ tools, toolSection: "", surface })]
    : [buildIdentitySection(), "", buildIntentGate({ tools, surface }), "", buildWorkingTaskSection(), "", buildVerificationSection({ surface }), "", buildPoliciesSection(), "", buildHandoffSection({ surface }), "", buildStyleSection({ surface })];
  const tuning = options.tuningSection?.trim();
  if (tuning) sections.push("", tuning);
  return sections.join("\\n");
}
export { resolvePresetName, buildPreset, ASYNC_DEFAULT, TURN_END_IS_WAIT, MONITOR_CONDITIONS };
export const presetNames = [...VALID_PRESETS].filter(name => name !== "auto");
`;
writeFileSync(new URL("presets.js", import.meta.url), header + generated.join("\n") + adapter);
