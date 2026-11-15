import { describe, expect, test } from "bun:test";
import { renderPreset } from "../presets";
import { buildPreset, presetNames } from "../upstream/presets.js";

const toolNames = ["eval", "ask", "task", "bash", "wait", "read", "grep", "glob", "write", "edit", "todo", "web_search"];
const models: Record<string, string> = {
  "kimi-k2-6": "kimi-k2.6", "kimi-k2-7": "kimi-for-coding-highspeed", "kimi-k2-8": "kimi-for-coding",
};

describe("faithful omo presets", () => {
  test("catalog renders preserve model routing and OMP tool transport across surfaces and capabilities", () => {
    for (const name of presetNames) {
      for (const surface of ["terminal", "app"] as const) {
        for (const activeTools of [toolNames, toolNames.filter(tool => tool !== "eval"), []]) {
          const original = buildPreset(name, { surface, selectedTools: activeTools });
          expect(original?.name).toBe(name);
          expect(original?.prompt).not.toMatch(/\$\{|\bundefined\b|\[object Object\]/);
          // gpt-5 is an explicit-only upstream preset, never selected by original auto resolution.
          if (name === "gpt-5") continue;
          const rendered = renderPreset({ id: models[name] ?? name }, { surface, toolNames: activeTools });
          expect(rendered?.name).toBe(name);
          expect(rendered?.prompt).not.toMatch(/\$\{|\bundefined\b|\[object Object\]/);
          expect(rendered?.prompt).not.toMatch(/request_user_input|ask_user_question|wait_for_answer|waitForAnswer|`(?:tool\.)?monitor(?:`|\()|--print/);
          expect(rendered?.prompt).not.toMatch(/<workstation>|<context_files>|<skills>/);
          const prompt = rendered!.prompt;
          const moments = original!.prompt.match(/^(?:A handoff is|Handoff moments:|At a handoff -)[^\n]+/m)?.[0];
          expect(moments).toBeDefined();
          expect(prompt).toContain(moments!.replace("one short block:", "one short update:").replace("then open with one block:", "then give one short update:"));
          expect(prompt).toContain("Briefly connect the outcome so far to the user's requested result");
          expect(prompt).toContain("execute any stated next action in the same response with tool calls");
          expect(prompt.includes("after each tool wave that changes what you know")).toBe(original!.prompt.includes("after each tool wave that changes what you know"));
          expect(prompt).not.toMatch(/Ask: \[|You need: \[|Now: \[|Next: \[|Now and Next are todo labels verbatim/);
          if (name === "gpt-6-astra") {
            const writing = prompt.match(/## Writing\n\n([\s\S]*?)(?=\n\n## Reporting)/)?.[1];
            expect(writing).toContain("Avoid section headings and redundant concluding summaries.");
            expect(writing).toContain("State intended actions directly; omit unsolicited descriptions of what you will not do, what stays unchanged, or how you will categorize results.");
          }
          if (surface === "terminal" && !name.startsWith("kimi-k2-")) {
            expect(prompt).toContain("Open a new request with one short routing line");
            expect(prompt).toContain("the intended work, and the observable stop condition");
            expect(prompt).toContain("On continuation or confirmation turns, keep the settled scope and act without repeating the opening");
            expect(prompt).not.toMatch(/Open every turn|I read this as \[intent\]/);
          } else {
            expect(prompt.includes("I read this as [intent]")).toBe(original!.prompt.includes("I read this as [intent]"));
            expect(prompt).not.toContain("On continuation or confirmation turns");
          }
        }
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
      ["claude-fable-5.2", "claude-fable-5-2"], ["anthropic/claude-mythos-5-2", "claude-fable-5-2"],
      ["claude-fable-5-2-20261109", "claude-fable-5-2"], ["claude-fable-5-20261109", "claude-fable-5"],
      ["claude-fable-5.20", "claude-fable-5"], ["claude-fable-5.5", "claude-fable-5"],
      ["claude-fable-5.1", "claude-fable-5-1"], ["claude-fable-5", "claude-fable-5"],
      ["claude-mythos-5.1", "claude-fable-5-1"], ["claude-opus-5.5", "claude-opus-5-5"],
      ["claude-haiku-5.5", "claude-haiku-5-5"], ["anthropic/claude-haiku-5-5", "claude-haiku-5-5"],
      ["claude-haiku-4-5", undefined],
      ["gemini-4-carbon", "gemini-4-argon"], ["gemini-4-argon", "gemini-4-argon"],
      ["gemini-4-hydrogen", "gemini-4-argon"], ["gemini-4", "gemini-4-argon"],
      ["deepseek-v4-flash-0731", "deepseek-v4-flash-0731"], ["deepseek-flash", "deepseek-v4-1-flash"],
      ["grok-4.70", undefined], ["glm-5.30", undefined], ["llama-4", undefined],
    ];
    for (const [id, name] of cases) expect(renderPreset({ id }, { surface: "terminal", toolNames })?.name).toBe(name);
    expect(renderPreset({ id: "opaque", name: "GPT 6.1 Luna" }, { surface: "app", toolNames })?.name).toBe("gpt-6-astra");
    expect(renderPreset({ id: "opaque", name: "Gemini 4 Argon" }, { surface: "app", toolNames })?.name).toBe("gemini-4-argon");
    expect(renderPreset({ id: "opaque", name: "gpt-5.6" }, { surface: "app", toolNames })).toBeUndefined();
  });

  test("GPT profiles leave eval transport to the host while retaining action and evidence contracts", () => {
    const gptModels = [
      ...presetNames.filter(name => name.startsWith("gpt-") && name !== "gpt-5").map(id => ({ id })),
      { id: "openai/gpt-6.1-sol", provider: "openrouter" },
      { id: "opaque", name: "GPT 6.1 Luna", provider: "custom" },
      { id: "openai-codex/gpt-6.1-terra" },
    ];
    for (const model of gptModels) {
      for (const surface of ["terminal", "app"] as const) {
        for (const subagent of [false, true]) {
          for (const activeTools of [toolNames, toolNames.filter(tool => tool !== "eval"), ["eval"], []]) {
            const rendered = renderPreset(model, { surface, toolNames: activeTools, subagent });
            expect(rendered?.name.startsWith("gpt-")).toBe(true);
            const prompt = rendered!.prompt;
            expect(prompt).not.toMatch(/Promise\.all(?:Settled)?|parallel\(thunks\)|code-execution tool/i);
            expect(prompt).not.toMatch(/(?:batch|lookups?)[^\n.]*`eval`|`eval`[^\n.]*multi-call/i);
            expect(prompt).not.toMatch(/(?:skip|use|running) the cell|cell strateg|standalone calls direct|call tools directly instead/i);
            expect(prompt).not.toMatch(/superpower|default to js on Bun|`sh\(\)`/i);
            expect(prompt).toMatch(/edits[^\n.]+approvals[^\n.]+sequential/i);
            expect(prompt).toMatch(/specialized-tool routing/);
            expect(prompt).toMatch(/tool-reported errors[^\n.]+missing or truncated results/);
            expect(prompt).toMatch(/permission or approval denial/i);
            expect(prompt).toMatch(/never (?:suppress|delete|skip)/i);
            expect(prompt).toMatch(/(?:verified fact|evidence-backed|never invent tool output)/i);
          }
        }
      }
    }
  });

  test("GPT keeps visual verification, symbol routing, recovery and pending-job lifecycles", () => {
    const activeTools = [...toolNames, "lsp_goto_definition"];
    for (const id of ["gpt-5.6", "gpt-6.1-sol"]) {
      const prompt = renderPreset({ id }, { surface: "terminal", toolNames: activeTools })!.prompt;
      expect(prompt).toMatch(/(?:render|screenshot)[^\n.]+(?:look|see)/i);
      expect(prompt).toMatch(/language server[^\n.]+(?:references|callers)/i);
      expect(prompt).toMatch(/(?:empty|narrow|thin)[^\n.]+(?:alternatives|source)/i);
      expect(prompt).toMatch(/(?:user|sibling) changes/i);
      expect(prompt).toMatch(/(?:validators?|checks|tests)[^\n.]+(?:run|clean|evidence)|run[^\n.]+validator/i);
      if (id === "gpt-6.1-sol") {
        expect(prompt).toMatch(/native `wait`/);
        expect(prompt).toMatch(/never (?:poll|hold a foreground eval cell)|do not poll/i);
        expect(prompt).toMatch(/(?:existing run|running session)[^\n.]+duplicate/i);
      }
    }
  });

  test("all supported profiles leave execution transport to common tool documentation", () => {
    for (const name of presetNames.filter(name => name !== "gpt-5")) {
      for (const surface of ["terminal", "app"] as const) {
        for (const subagent of [false, true]) {
          for (const activeTools of [toolNames, toolNames.filter(tool => tool !== "eval"), ["eval"], []]) {
            const rendered = renderPreset({ id: models[name] ?? name }, { surface, toolNames: activeTools, subagent });
            expect(rendered?.name).toBe(name);
            const prompt = rendered!.prompt;
            expect(prompt).not.toMatch(/`eval`|Promise\.all(?:Settled)?|parallel\(thunks\)|code-execution tool|`tool\.\*`/i);
            expect(prompt).not.toMatch(/(?:skip|use|running|write) the cell|cell strateg|standalone calls direct|direct tool call|call tools directly instead/i);
            expect(prompt).not.toMatch(/superpower|default to js on Bun|`sh\(\)`|independent (?:tool )?calls[^\n.]*parallel wave/i);
            expect(prompt).not.toMatch(/Before each response,[^\n.]+request every item|one (?:message|response) instead/i);
            expect(prompt).not.toMatch(/Send a step's independent calls in one message/);
            expect(prompt).toMatch(/edits[^\n.]+approvals[^\n.]+sequential/i);
            expect(prompt).toContain("result-dependent calls sequential; inspect each before the next");
            expect(prompt).toMatch(/specialized-tool routing, permissions, and job lifecycles/);
            expect(prompt).toMatch(/call identities, failures, tool-reported errors, and missing or truncated results/);
            expect(prompt).toMatch(/permission or approval denial/i);
            if (activeTools.includes("bash")) {
              expect(prompt).toContain("Sequence bash calls that depend on shell state");
            }
          }
        }
      }
    }
  });

  test("Gemini 4 family shares the adapted Argon profile and capability gates across surfaces and sessions", () => {
    // Official family: https://aistudio.google.com/docs/models#all-gemini-4-models
    // Provider/separator variants below exercise adapter normalization, not extra catalog entries.
    const familyModels = [
      ...[
        "gemini-4", "gemini-4-carbon", "gemini-4-argon", "gemini-4-hydrogen",
        "google/gemini-4-carbon", "google/gemini-4-hydrogen", "gemini-4-argon-contributor",
        "gemini-4-hydrogen-xhigh", "google:gemini-4-carbon", "google@gemini-4-hydrogen",
        "google.gemini_4_carbon", "google-gemini4-hydrogen", "gemini.4.carbon", "GeMiNi 4 Hydrogen",
      ].map(id => ({ id })),
      { id: "gemini-4-carbon", provider: "google-antigravity" },
      { id: "gemini-4-hydrogen", provider: "antigravity" },
      ...["Gemini 4", "Gemini 4 Carbon", "Gemini 4 Argon", "Gemini 4 Hydrogen", "ANTIGRAVITY / GEMINI 4 CARBON"].map(name => ({ id: "opaque", name })),
    ];
    for (const surface of ["terminal", "app"] as const) {
      for (const subagent of [false, true]) {
        for (const activeTools of [toolNames, toolNames.filter(tool => tool !== "eval"), []]) {
          const options = { surface, toolNames: activeTools, subagent };
          const argon = renderPreset({ id: "gemini-4-argon" }, options);
          expect(argon?.name).toBe("gemini-4-argon");
          expect(argon?.prompt).toMatch(/\ba coding agent running on Gemini 4\./);
          expect(argon?.prompt).not.toMatch(/\brunning on Gemini 4 Argon\b/);
          expect(argon?.prompt).not.toMatch(/`eval`|Promise\.allSettled|Writing code is your superpower|`tool\.\*`|standalone calls direct/);
          expect(argon?.prompt).toMatch(/edits, side effects,[^\n]+sequential/i);
          expect(argon?.prompt).toMatch(/Name the intended state before acting|Compare each action with intended state/);
          expect(argon?.prompt).toMatch(/(?:render|screenshot)[^\n.]+look/i);
          expect(argon?.prompt.includes("## Search Grounding")).toBe(activeTools.includes("web_search"));
          for (const model of familyModels) expect(renderPreset(model, options)).toEqual(argon);
          for (const id of ["gemini-3-carbon", "gemini-3.1-hydrogen", "gemini-5-carbon", "gemini-40-carbon", "gemini-41-carbon", "gemini-4x", "gemini-4x-carbon", "notgemini-4-carbon", "google/notgemini-4-carbon"]) {
            expect(renderPreset({ id }, options)).toBeUndefined();
            expect(renderPreset({ id: "opaque", name: id.replaceAll("-", " ") }, options)).toBeUndefined();
          }
        }
      }
    }
  });

  test("Gemini family fallback preserves upstream and existing Terra selection precedence", () => {
    const options = { surface: "terminal" as const, toolNames };
    const astra = renderPreset({ id: "gpt-6-astra" }, options);
    for (const model of [
      { id: "gpt-6-astra", name: "Gemini 4 Carbon" },
      { id: "gemini-4-carbon", name: "GPT 6.1 Luna" },
      { id: "gemini-4-hydrogen", name: "GPT 6.1 Terra" },
    ]) expect(renderPreset(model, options)).toEqual(astra);
  });

  test("Terra aliases use Astra in main and child sessions without matching neighboring models", () => {
    for (const surface of ["terminal", "app"] as const) {
      for (const subagent of [false, true]) {
        const options = { surface, toolNames, subagent };
        const astra = renderPreset({ id: "gpt-6-astra" }, options);
        expect(astra?.name).toBe("gpt-6-astra");
        for (const id of ["gpt-6.1-terra", "openai/gpt-6.1-terra-fast", "openai-codex/gpt-6.1-terra", "gpt-6-1-terra", "openai-gpt-61-terra"]) {
          expect(renderPreset({ id }, options)).toEqual(astra);
        }
        expect(renderPreset({ id: "opaque", name: "GPT 6.1 Terra" }, options)).toEqual(astra);
        for (const id of ["gpt-6.1-terrarium", "gpt-6.10-terra", "gpt-6.2-terra", "gpt-6-terra"]) {
          expect(renderPreset({ id }, options)).toBeUndefined();
        }
      }
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
