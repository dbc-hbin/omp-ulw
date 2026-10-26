import { expect, test } from "bun:test";
import { generate, parseRef } from "./update.mjs";

const revision = "a".repeat(40);
const root = "packages/coding-agent/src/core/extensions/builtin/prompt-preset/";
const modules = new Map([
  ["presets.ts", 'export function buildPreset(name) { return { name, prompt: "x".repeat(1100) }; } export function resolvePresetName() { return "fixture"; }'],
  ["settings.ts", 'export const VALID_PRESETS = new Set(["auto", "fixture"]);'],
  ["gpt-6-astra.ts", 'export const GPT6_ASTRA_RULES = ["async-default", "turn-end-is-wait", "monitor-conditions"].map(id => ({id, directive: id}));'],
]);

function sourceRequest(overrides = new Map(), calls = []) {
  return async url => {
    calls.push(url);
    if (url.startsWith("https://api.github.com/")) return Response.json({ sha: revision });
    if (url === `https://raw.githubusercontent.com/code-yeongyu/senpi/${revision}/LICENSE`) return new Response("Fixture license");
    const prefix = `https://raw.githubusercontent.com/code-yeongyu/senpi/${revision}/${root}`;
    if (!url.startsWith(prefix)) throw new Error(`Unpinned request: ${url}`);
    const path = url.slice(prefix.length);
    const body = overrides.has(path) ? overrides.get(path) : modules.get(path);
    return new Response(body ?? "missing", { status: body === undefined ? 404 : 200 });
  };
}

test("GitHub references accept only the source repository and retain branch paths", () => {
  expect(parseRef("v2026.10.13")).toBe("v2026.10.13");
  expect(parseRef("https://github.com/code-yeongyu/senpi/tree/release/prompts")).toBe("release/prompts");
  expect(parseRef(`https://github.com/code-yeongyu/senpi/commit/${revision}`)).toBe(revision);
  expect(parseRef("https://github.com/code-yeongyu/senpi/releases/tag/v2026.10.13")).toBe("v2026.10.13");
  for (const input of ["", "a b", "https://example.com/code-yeongyu/senpi/tree/main", "https://github.com/another/repo/tree/main", "https://github.com/code-yeongyu/senpi/tree/main?ref=other"]) expect(() => parseRef(input)).toThrow();
});

test("generation pins every source read and produces a self-contained catalog", async () => {
  const calls = [];
  const generated = await generate("feature/prompts", sourceRequest(new Map(), calls));
  expect(calls[0]).toBe("https://api.github.com/repos/code-yeongyu/senpi/commits/feature%2Fprompts");
  expect(calls.slice(1)).toHaveLength(4);
  expect(generated).toMatchObject({ revision, count: 1, sourceCount: 3 });
  // Executing the generated module verifies bundled exports, not prompt wording.
  const module = await import(`data:text/javascript;base64,${Buffer.from(generated.content).toString("base64")}`);
  expect(module.presetNames).toEqual(["fixture"]);
  expect(module.resolvePresetName({ id: "fixture" }, { promptPreset: "auto" })).toBe("fixture");
  expect(module.buildPreset("fixture", { surface: "terminal", selectedTools: [] }).name).toBe("fixture");
});

test("failed requests, invalid revisions and missing source contracts fail generation", async () => {
  await expect(generate("main", async () => new Response("denied", { status: 403 }))).rejects.toThrow("revision lookup failed");
  await expect(generate("main", async () => Response.json({ sha: "main" }))).rejects.toThrow("invalid commit SHA");
  await expect(generate("main", sourceRequest(new Map([["presets.ts", undefined]])))).rejects.toThrow();
  await expect(generate("main", sourceRequest(new Map([["gpt-6-astra.ts", "export const GPT6_ASTRA_RULES = [];\n"]])))).rejects.toThrow("Missing upstream rule");
});

test("approved shared model modules are bundled from the same pinned revision", async () => {
  const calls = [];
  const request = sourceRequest(new Map([["presets.ts", `
import { isFable55ModelId } from "@earendil-works/pi-ai/utils/fable55-launch";
export function buildPreset(name) { return { name, prompt: "x".repeat(1100) }; }
export function resolvePresetName(model) { return isFable55ModelId(model.id) ? "fixture" : undefined; }
`]]), calls);
  const sharedUrl = `https://raw.githubusercontent.com/code-yeongyu/senpi/${revision}/packages/ai/src/utils/fable55-launch.ts`;
  const generated = await generate("main", async url => {
    if (url === sharedUrl) {
      calls.push(url);
      return new Response('export function isFable55ModelId(id) { return id === "claude-fable-5-5"; }');
    }
    return request(url);
  });
  expect(calls.filter(url => url === sharedUrl)).toHaveLength(1);
  const module = await import(`data:text/javascript;base64,${Buffer.from(generated.content).toString("base64")}`);
  expect(module.resolvePresetName({ id: "claude-fable-5-5" })).toBe("fixture");
  expect(module.resolvePresetName({ id: "claude-fable-5" })).toBeUndefined();
  expect(new Bun.Transpiler({ loader: "js" }).scanImports(generated.content)).toEqual([]);
});

test("new external or out-of-scope imports require an explicit adapter update", async () => {
  for (const dependency of ["node:fs", "@earendil-works/pi-ai/utils/other", "../../../../../../outside.ts"]) {
    const source = `import * as dependency from ${JSON.stringify(dependency)};
export function buildPreset(name) { return { name, prompt: "x".repeat(1100) + typeof dependency.readFileSync }; }
export function resolvePresetName() { return "fixture"; }`;
    await expect(generate("main", sourceRequest(new Map([["presets.ts", source]])))).rejects.toThrow();
  }
});
