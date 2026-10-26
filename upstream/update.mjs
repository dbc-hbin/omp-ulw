import { posix } from "node:path";
import { parseArgs } from "node:util";
import { rename, rm } from "node:fs/promises";

const repository = "code-yeongyu/senpi";
const sourceRoot = "packages/coding-agent/src/";
const presetRoot = `${sourceRoot}core/extensions/builtin/prompt-preset/`;
const dynamicRoot = `${sourceRoot}core/dynamic-prompt/`;
const sharedSources = new Map([
  ["@earendil-works/pi-ai/utils/fable55-launch", "packages/ai/src/utils/fable55-launch.ts"],
]);
const destination = new URL("./presets.js", import.meta.url);

export function parseRef(value) {
  if (value.startsWith("https://")) {
    const url = new URL(value);
    const match = /^\/code-yeongyu\/senpi\/(?:tree|commit|releases\/tag)\/(.+)$/.exec(url.pathname);
    if (url.origin !== "https://github.com" || !match || url.search || url.hash) throw new Error("Use a Senpi GitHub tree, commit or release URL");
    value = decodeURIComponent(match[1]);
  }
  if (!value || /[\s?#\\]/.test(value)) throw new Error("Expected a Git tag, branch or commit SHA");
  return value;
}

export async function generate(ref, request = fetch) {
  ref = parseRef(ref);
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await request(`https://api.github.com/repos/${repository}/commits/${encodeURIComponent(ref)}`, { headers });
  if (!response.ok) throw new Error(`GitHub revision lookup failed: ${response.status}`);
  const commit = await response.json();
  if (typeof commit?.sha !== "string" || !/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error("GitHub returned an invalid commit SHA");
  const revision = commit.sha;
  const licenseResponse = await request(`https://raw.githubusercontent.com/${repository}/${revision}/LICENSE`);
  if (!licenseResponse.ok) throw new Error(`Upstream license: HTTP ${licenseResponse.status}`);
  const license = await licenseResponse.text();
  if (!license.trim()) throw new Error("Missing upstream license");
  const entry = `${presetRoot}omp-entry.ts`;
  const sources = new Map();
  const result = await Bun.build({
    root: import.meta.dir,
    entrypoints: [entry],
    target: "bun",
    format: "esm",
    write: false,
    plugins: [{
      name: "github-prompt-sources",
      setup(build) {
        build.onResolve({ filter: /.*/ }, args => {
          const isEntry = args.path === entry;
          const sharedSource = sharedSources.get(args.path);
          if (sharedSource) return { path: sharedSource, namespace: "github" };
          const path = isEntry ? entry : posix.normalize(posix.join(posix.dirname(args.importer), args.path));
          if (!isEntry && !args.path.startsWith(".")) throw new Error(`Unexpected upstream dependency: ${args.path}`);
          if (!(path.startsWith(presetRoot) || path.startsWith(dynamicRoot) || path === `${sourceRoot}config.ts`) || !path.endsWith(".ts")) throw new Error(`Unexpected upstream source: ${path}`);
          return { path, namespace: "github" };
        });
        build.onLoad({ filter: /.*/, namespace: "github" }, async ({ path }) => {
          if (path === entry) return { loader: "ts", contents: `
export { buildPreset, resolvePresetName } from "./presets.ts";
import { VALID_PRESETS } from "./settings.ts";
import { GPT6_ASTRA_RULES } from "./gpt-6-astra.ts";
export const presetNames = [...VALID_PRESETS].filter(name => name !== "auto");
const rules = new Map(GPT6_ASTRA_RULES.map(rule => [rule.id, rule.directive]));
export const ASYNC_DEFAULT = rules.get("async-default");
export const TURN_END_IS_WAIT = rules.get("turn-end-is-wait");
export const MONITOR_CONDITIONS = rules.get("monitor-conditions");
` };
          if (path === `${sourceRoot}config.ts`) return { loader: "ts", contents: 'export const APP_NAME = "omp";' };
          if (path === `${dynamicRoot}build.ts`) return { loader: "js", contents: await Bun.file(new URL("./omp-build.mjs", import.meta.url)).text() };
          if (!sources.has(path)) sources.set(path, (async () => {
            const response = await request(`https://raw.githubusercontent.com/${repository}/${revision}/${path}`);
            if (!response.ok) throw new Error(`Upstream source ${path}: HTTP ${response.status}`);
            return response.text();
          })());
          return { loader: "ts", contents: await sources.get(path) };
        });
      },
    }],
  });
  if (!result.success) throw new AggregateError(result.logs, "Upstream prompt build failed; existing presets were not changed");
  const code = await result.outputs[0].text();
  const imports = new Bun.Transpiler({ loader: "js" }).scanImports(code);
  if (imports.length) throw new Error(`Unbundled upstream dependencies: ${imports.map(item => item.path).join(", ")}`);
  // The candidate module must execute before it can replace the installed bundle.
  const candidate = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  if (!Array.isArray(candidate.presetNames) || candidate.presetNames.length === 0 || new Set(candidate.presetNames).size !== candidate.presetNames.length) throw new Error("Invalid upstream preset catalog");
  for (const key of ["ASYNC_DEFAULT", "TURN_END_IS_WAIT", "MONITOR_CONDITIONS"]) {
    if (typeof candidate[key] !== "string" || !candidate[key]) throw new Error(`Missing upstream rule: ${key}`);
  }
  for (const name of candidate.presetNames) {
    for (const surface of ["terminal", "app"]) {
      const preset = candidate.buildPreset(name, { surface, selectedTools: ["eval", "ask", "task", "bash", "wait", "read", "grep", "glob", "write", "edit", "todo", "web_search"] });
      if (preset?.name !== name || typeof preset.prompt !== "string" || preset.prompt.length < 1000 || /\$\{|\bundefined\b|\[object Object\]|<workstation>|<context_files>|<skills>/.test(preset.prompt)) throw new Error(`Invalid generated preset: ${name}/${surface}`);
    }
  }
  return { revision, count: candidate.presetNames.length, sourceCount: sources.size, content: `// Generated by bun upstream/update.mjs --ref ${revision}\n// Source: https://github.com/${repository}/tree/${revision}\n// OMP owns runtime sections; presets.ts adapts tool transport.\n${license.trimEnd().split("\n").map(line => line ? "// " + line : "//").join("\n")}\n${code}` };
}

if (import.meta.main) {
  try {
    const { values } = parseArgs({ args: process.argv.slice(2), options: { ref: { type: "string" }, check: { type: "boolean" }, help: { type: "boolean" } }, strict: true });
    if (values.help) {
      console.log("Usage: bun upstream/update.mjs [--ref <tag|SHA|branch|GitHub-URL>] [--check]\nDefault ref: main. --check compares without writing. Only upstream/presets.js is generated; OMP adapters and skills are preserved.");
    } else {
      const generated = await generate(values.ref ?? "main");
      const changed = generated.content !== await Bun.file(destination).text();
      if (changed && !values.check) {
        const temporary = new URL(`./.presets-${process.pid}.tmp`, import.meta.url);
        try {
          await Bun.write(temporary, generated.content);
          await rename(temporary, destination);
        } finally { await rm(temporary, { force: true }); }
      }
      console.log(JSON.stringify({ revision: generated.revision, presets: generated.count, sources: generated.sourceCount, changed, written: changed && !values.check }));
      if (values.check && changed) process.exitCode = 1;
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
