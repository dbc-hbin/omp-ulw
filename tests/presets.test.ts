import { describe, expect, test } from "bun:test";
import { renderPreset } from "../presets";
import { buildPreset, presetNames } from "../upstream/presets.js";

const toolNames = ["eval", "ask", "task", "bash", "wait", "read", "grep", "glob", "write", "edit", "todo", "web_search"];
const models: Record<string, string> = {
  "kimi-k2-6": "kimi-k2.6", "kimi-k2-7": "kimi-for-coding-highspeed", "kimi-k2-8": "kimi-for-coding",
};

describe("faithful omo presets", () => {
  test("all original builders resolve their interpolations on both surfaces", () => {
    for (const name of presetNames) {
      for (const surface of ["terminal", "app"] as const) {
        const original = buildPreset(name, { surface, selectedTools: toolNames });
        expect(original?.name).toBe(name);
        expect(original?.prompt.length).toBeGreaterThan(1000);
        expect(original?.prompt).not.toMatch(/senpi/i);
        expect(original?.prompt).not.toMatch(/\$\{|\bundefined\b|\[object Object\]/);
        // gpt-5 is an explicit-only upstream preset, never selected by original auto resolution.
        if (name === "gpt-5") continue;
        const rendered = renderPreset({ id: models[name] ?? name }, { surface, toolNames });
        expect(rendered?.name).toBe(name);
        expect(rendered?.prompt).not.toMatch(/senpi/i);
        expect(rendered?.prompt).not.toMatch(/\$\{|\bundefined\b|\[object Object\]/);
        expect(rendered?.prompt).not.toMatch(/request_user_input|ask_user_question|wait_for_answer|waitForAnswer|tool\.monitor|--print|THERE IS NO WAIT TOOL/);
        expect(rendered?.prompt).not.toMatch(/\[Outcome so far\]|\bYou need:/);
        expect(rendered?.prompt).not.toMatch(/<workstation>|<context_files>|<skills>/);
      }
    }
  });

  test("original ordering, aliases and version boundaries drive selection", () => {
    const cases: [string, string | undefined][] = [
      ["openai/gpt-6-astra", "gpt-6-astra"], ["gpt-6.1-sol", "gpt-6-astra"], ["gpt-61-luna", "gpt-6-astra"],
      ["gpt-6-astra-extra", "gpt-6-astra"], ["gpt-6-astral", undefined], ["gpt-6", undefined], ["gpt-7-astra", undefined],
      ["gpt-5.3", "gpt-5.3-codex"], ["gpt-5", undefined], ["gpt-5.7", undefined],
      ["swe-2-max", "kimi-k3"], ["swe-2-maximum", undefined], ["k3", "kimi-k3"],
      ["k3.1-pro", "kimi-k3-1"], ["kimi-k3.1-pro-highspeed", "kimi-k3-1"], ["k3p1", "kimi-k3-1"],
      ["kimi-k2p8", "kimi-k2-8"], ["kimi-k2.80", undefined],
      ["claude-fable-5.5", "claude-fable-5-5"], ["anthropic/claude-mythos-5-5", "claude-fable-5-5"],
      ["claude-fable-5.1", "claude-fable-5-1"], ["claude-fable-5", "claude-fable-5"],
      ["claude-mythos-5.1", "claude-fable-5-1"], ["claude-opus-5.5", "claude-opus-5-5"],
      ["claude-haiku-5.5", "claude-haiku-5-5"], ["anthropic/claude-haiku-5-5", "claude-haiku-5-5"],
      ["claude-haiku-4-5", undefined],
      ["gemini-4-argon", "gemini-4-argon"], ["google/gemini-4-argon-preview", "gemini-4-argon"],
      ["gemini-4-argonaut", undefined], ["gemini-4", undefined],
      ["deepseek-v4-flash-0731", "deepseek-v4-flash-0731"], ["deepseek-flash", "deepseek-v4-1-flash"],
      ["grok-4.70", undefined], ["glm-5.30", undefined], ["llama-4", undefined],
    ];
    for (const [id, name] of cases) expect(renderPreset({ id }, { surface: "terminal", toolNames })?.name).toBe(name);
    expect(renderPreset({ id: "opaque", name: "GPT 6.1 Luna" }, { surface: "app", toolNames })?.name).toBe("gpt-6-astra");
    expect(renderPreset({ id: "opaque", name: "Gemini 4 Argon" }, { surface: "app", toolNames })?.name).toBe("gemini-4-argon");
    expect(renderPreset({ id: "opaque", name: "gpt-5.6" }, { surface: "app", toolNames })).toBeUndefined();
  });

  test("temporary Terra child alias uses Sol without changing main or neighboring models", () => {
    const options = { surface: "app" as const, toolNames };
    const sol = renderPreset({ id: "gpt-6.1-sol" }, { ...options, subagent: true });
    expect(sol?.name).toBe("gpt-6-astra");
    for (const id of ["gpt-6.1-terra", "openai/gpt-6.1-terra-fast", "gpt-6-1-terra", "openai-gpt-61-terra"]) {
      expect(renderPreset({ id }, { ...options, subagent: true })).toEqual(sol);
      expect(renderPreset({ id }, options)).toBeUndefined();
    }
    expect(renderPreset({ id: "opaque", name: "GPT 6.1 Terra" }, { ...options, subagent: true })).toEqual(sol);
    for (const id of ["gpt-6.1-terrarium", "gpt-6.10-terra", "gpt-6.2-terra", "gpt-6-terra"]) {
      expect(renderPreset({ id }, { ...options, subagent: true })).toBeUndefined();
    }
  });

  test("selected tools govern optional search and mutation routing", () => {
    const options = { surface: "terminal" as const, toolNames: [] };
    for (const id of ["gpt-5.2", "kimi-k2.6", "claude-opus-4-8", "gpt-6-astra", "gemini-4-argon"]) {
      const rendered = renderPreset({ id }, options);
      expect(rendered).toBeDefined();
      expect(rendered?.prompt).not.toMatch(/Specialized search available|request_user_input|ask_user_question|wait_for_answer|tool\.monitor|--print/);
    }
  });


  test("official and third-party DeepSeek aliases retain provider-sensitive routing", () => {
    const options = { surface: "terminal" as const, toolNames };
    const model = { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" };
    expect(renderPreset({ ...model, provider: "deepseek" }, options)?.name).toBe("deepseek-v4-1-flash");
    expect(renderPreset({ ...model, provider: "openrouter" }, options)?.name).toBe("deepseek-v4-flash");
    expect(renderPreset(model, options)?.name).toBe("deepseek-v4-flash");
  });
});
