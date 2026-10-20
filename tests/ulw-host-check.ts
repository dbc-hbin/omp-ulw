// Run with: bun tests/ulw-host-check.ts (requires the installed omp binary).
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { renderPreset } from "../presets";

const requests: unknown[] = [];
let continuationState: { kind: string; path: string } | undefined;
let scenarioRequests = 0;
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    requests.push(await request.json());
    scenarioRequests++;
    if (continuationState && ["loop", "execute"].includes(continuationState.kind) && scenarioRequests === 2) writeFileSync(continuationState.path, continuationState.kind === "loop"
      ? JSON.stringify({ status: "complete", goals: [{ status: "complete" }] }) : "- [x] 1. Local hook probe\n");
    if (continuationState?.kind === "execute" && scenarioRequests === 3) {
      const path = resolve(continuationState.path, "../../boulder.json");
      const boulder: unknown = JSON.parse(readFileSync(path, "utf8"));
      assert(typeof boulder === "object" && boulder !== null && "works" in boulder && typeof boulder.works === "object" && boulder.works !== null && "probe" in boulder.works);
      const work = boulder.works.probe;
      assert(typeof work === "object" && work !== null && "status" in work && work.status === "active");
      work.status = "complete";
      writeFileSync(path, JSON.stringify(boulder));
    }
    if (continuationState?.kind === "execute-mixed" && (scenarioRequests === 2 || scenarioRequests === 3)) {
      const plan = readFileSync(continuationState.path, "utf8");
      writeFileSync(continuationState.path, scenarioRequests === 2
        ? plan.replace("- [ ] 3.", "- [x] 3.") : plan.replace("- [ ] F1.", "- [x] F1."));
    }
    return new Response([
      'data: {"id":"ulw-probe","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":"ULW-PROBE"},"finish_reason":null}]}',
      'data: {"id":"ulw-probe","object":"chat.completion.chunk","choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2}}',
      'data: [DONE]', "",
    ].join("\n\n"), { headers: { "content-type": "text/event-stream" } });
  },
});
async function run(prompts: string[], flags: string[] = [], continuation?: "loop" | "execute" | "execute-blocked" | "execute-mixed", provider?: string, model = "gpt-6.1-sol", loadSkills = false, tools?: string[]): Promise<string[]> {
  const offset = requests.length;
  continuationState = undefined;
  scenarioRequests = 0;
  const cwd = continuation ? mkdtempSync(join(tmpdir(), "omo-ulw-host-")) : process.cwd();
  const child = Bun.spawn([
    "omp", "--mode", "rpc", "--no-ui", "--no-extensions", "-e", resolve("index.ts"),
    "-e", resolve("tests/fixtures/ulw-provider.ts"), "--model", provider ? `${provider}/deepseek-v4-flash-omo-local-probe` : `omo-ulw-probe/${model}`,
    "--cwd", cwd, ...(tools ? ["--tools", tools.join(",")] : loadSkills ? ["--tools", "read"] : ["--no-tools", "--no-skills"]), "--no-rules", "--no-title", "--no-session", "--no-lsp", ...flags,
  ], { stdin: "pipe", stdout: "pipe", stderr: "pipe", env: { ...process.env, OMO_ULW_PROBE_BASE_URL: `http://127.0.0.1:${server.port}/v1`, OMO_ULW_PROBE_CONTINUATION: continuation ?? "", OMO_ULW_PROBE_PROVIDER: provider ?? "", OMO_ULW_PROBE_MODEL: model } });
  const stderr = new Response(child.stderr).text();
  let signal = Promise.withResolvers<void>();
  let expected = "ready";
  let expectedRequests = 0;
  let failure: unknown;
  const abort = AbortSignal.timeout(60000);
  abort.addEventListener("abort", () => {
    failure = new Error(`OMP host deadline: provider=${provider ?? "omo-ulw-probe"}, mode=${continuation ?? "ordinary"}, event=${expected}, requests=${scenarioRequests}/${expectedRequests}`);
    signal.reject(failure);
  }, { once: true });
  const output = (async () => {
    let buffer = "";
    for await (const bytes of child.stdout) {
      buffer += new TextDecoder().decode(bytes);
      for (;;) {
        const end = buffer.indexOf("\n");
        if (end < 0) break;
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        if (!line.startsWith("{")) continue;
        const event: unknown = JSON.parse(line);
        if (typeof event !== "object" || event === null || !("type" in event)) continue;
        if (event.type === "extension_error") {
          failure = event;
          signal.reject(new Error(JSON.stringify(event)));
        }
        if (event.type === "message_end" && "message" in event && typeof event.message === "object" && event.message !== null && "stopReason" in event.message && event.message.stopReason === "error") {
          failure = event.message;
          signal.reject(new Error(JSON.stringify(event.message)));
        }
        if (event.type === "ulw_probe_state" && "kind" in event && typeof event.kind === "string" && "path" in event && typeof event.path === "string") continuationState = { kind: event.kind, path: event.path };
        if (expected === "ready" && event.type === "ready") signal.resolve();
        if (event.type === "response" && "id" in event && event.id === "ready" && "success" in event && event.success === false && typeof event.error === "string" && event.error.includes("transport limit")) {
          signal.resolve();
          continue;
        }
        if (event.type === "response" && "success" in event && event.success === false) {
          failure = event;
          signal.reject(new Error(JSON.stringify(event)));
        } else if ((expected === "ready" || expected === "configured") && "id" in event && event.id === expected) signal.resolve();
        else if (expected === "agent_end" && event.type === "agent_end" && !("willContinue" in event && event.willContinue === true)) {
          if (scenarioRequests !== expectedRequests) {
            failure = new Error(`OMP settled with requests=${scenarioRequests}/${expectedRequests}`);
            signal.reject(failure);
          } else signal.resolve();
        }
      }
    }
    if (expected !== "finished") signal.reject(new Error(`OMP exited before ${expected}`));
  })();
  try {
    child.stdin.write(JSON.stringify({ type: "get_state", id: "ready" }) + "\n");
    await signal.promise;
    // Inherited compaction settings can suppress session_stop before the hook runs.
    signal = Promise.withResolvers<void>();
    expected = "configured";
    child.stdin.write(JSON.stringify({ type: "set_auto_compaction", id: "configured", enabled: false }) + "\n");
    await signal.promise;
    for (const [index, prompt] of prompts.entries()) {
      signal = Promise.withResolvers<void>();
      expected = "agent_end";
      expectedRequests = continuation === "execute" || continuation === "execute-mixed" ? 3 : continuation === "loop" ? 2 : index + 1;
      child.stdin.write(JSON.stringify({ type: "prompt", id: `prompt-${index}`, message: prompt }) + "\n");
      await signal.promise;
      if (failure) throw new Error(JSON.stringify(failure));
    }
    if (continuation === "execute-blocked" || continuation === "execute-mixed") {
      const plan = readFileSync(join(cwd, "doc/plans/probe.md"), "utf8");
      assert.equal([...plan.matchAll(/^- \[~\] /gm)].length, continuation === "execute-blocked" ? 1 : 2);
      assert(!/^- \[ \] /m.test(plan));
      const boulder = JSON.parse(readFileSync(join(cwd, "doc/boulder.json"), "utf8"));
      assert.equal(boulder.works.probe.status, "active", "the hook must not label unmet work complete or mutate durable state");
    }
    expected = "finished";
  } finally {
    child.kill();
    await child.exited;
    await output;
    const errors = await stderr;
    if (failure) console.error(errors);
    if (continuation) rmSync(cwd, { recursive: true, force: true });
  }
  return requests.slice(offset).map(body => {
    assert(typeof body === "object" && body !== null && "messages" in body && Array.isArray(body.messages));
    const messages: unknown[] = body.messages;
    return messages.flatMap(message => {
      if (typeof message !== "object" || message === null || !("role" in message) || !["system", "developer"].includes(String(message.role)) || !("content" in message) || typeof message.content !== "string") return [];
      return [message.content];
    }).join("\n");
  });
}

try {
  const astra = readFileSync(new URL("../skills/ultrawork/references/astra-directive.md", import.meta.url), "utf8");
  for (const model of ["gpt-6-astra", "gpt-6-astra-fast", "gpt-6.1-sol", "gpt-6-sol", "gpt-6-luna-fast"]) {
    const [prompt] = await run(["/ulw validate the GPT-6 family directive"], [], undefined, undefined, model);
    assert(prompt.includes(`<ultrawork-mode>${astra}</ultrawork-mode>`));
    assert(!prompt.match(/senpi/i));
  }
  for (const model of ["claude-haiku-5.5", "gemini-4-argon"]) {
    const [prompt] = await run(["verify the selected model profile"], [], undefined, undefined, model);
    const profile = renderPreset({ provider: "omo-ulw-probe", id: model, name: model }, { surface: "app", toolNames: [] })!;
    assert(prompt.includes(`<omp-model-preset>\n${profile.prompt}\n</omp-model-preset>`), `actual provider request must contain the shipped ${model} profile`);
  }
  const [catalog] = await run(["inspect installed skill metadata"], [], undefined, undefined, "gpt-6.1-sol", true);
  for (const name of ["design", "brand", "design-system", "ui-styling", "ui-ux-pro-max", "slides", "banner-design", "native-ui-design"]) {
    assert(!catalog.includes(`skill://${name}`) && !catalog.includes(`<name>${name}</name>`) && !new RegExp(`^\\s*- ${name}(?: \\(|:)`, "m").test(catalog), `disabled design skill must not be advertised: ${name}`);
  }
  for (const name of ["debugging", "review-work", "visual-qa", "visualize", "frontend", "data-scientist", "remove-ai-slops", "hyperplan", "memory-advisor", "reflection", "init-deep", "ast-grep", "lsp-setup", "refactor"]) {
    const [prompt] = await run([`/${name} exercise installed routing`]);
    const body = JSON.stringify(requests.at(-1));
    assert(body.includes(`<omp-${name}-pointer>`), `real command must resolve its skill pointer: ${name}`);
    assert(body.includes(resolve(`skills/${name}/SKILL.md`)));
    assert(!prompt.includes("<omp-ulw-policy>"));
  }
  for (const name of ["review-work", "hyperplan"]) {
    const body = readFileSync(resolve(`skills/${name}/SKILL.md`), "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    for (const args of ["", "ulw verify this local probe", "ulw-plan plan this local probe"]) {
      // Exercise the expanded input delivered by native /skill invocation, not the literal CLI command.
      const expanded = `[IMPORTANT: User invoked the "${name}" skill; follow its instructions. Full skill below.]\n\n${body}\n\n---\n\n[Skill directory: ${resolve(`skills/${name}`)}]\nResolve relative paths in this skill (e.g. \`scripts/foo.js\`, \`templates/config.yaml\`) against this absolute directory; read referenced assets and templates; run scripts with the terminal tool when skill instructions call for it.${args ? `\nUser: ${args}` : ""}`;
      const offset = requests.length;
      const prompts = await run([expanded, "continue"]);
      assert.equal(prompts.length, 2);
      for (const prompt of prompts) assert.equal(prompt.includes("<omp-ulw-policy>"), args !== "", `native skill body must not activate ULW: ${name}`);
      assert.equal(JSON.stringify(requests[offset]).includes("<omp-ulw-plan-pointer>"), args.startsWith("ulw-plan"), `only explicit arguments select planning: ${name}`);
      assert(!JSON.stringify(requests[offset]).includes(`<omp-${name}-pointer>`), "already-expanded native skill must not receive a duplicate pointer");
    }
  }
  const armed = await run(["/ulw verify this local probe", "continue"]);
  assert.equal(armed.length, 2);
  for (const prompt of armed) {
    assert(prompt.includes(`<ultrawork-mode>${astra}</ultrawork-mode>`), "actual provider request must contain the shipped GPT-6 family directive");
    assert(prompt.includes("# Completion contract"), "implementation requests must use the outcome completion gate");
    assert(/useful evidence about the cause or a\s+plausible patch is not completion/.test(prompt), "implementation work must not stop at diagnosis");
    assert.equal(prompt.split("<omp-ulw-policy>").length - 1, 1, "policy must not duplicate on follow-up");
    assert.equal(prompt.split("<omp-model-preset>").length - 1, 1, "model preset must coexist with ULW");
  }
  const quoted = await run(["Explain the quoted token `ulw`."]);
  assert.equal(quoted.length, 1);
  assert(!quoted[0].includes("<omp-ulw-policy>"));
  for (const text of ["Read doc/ulw/notes.md", "Do not use ulw; fix this normally", "> ulw plan the old task", "[REPORT] worker mentioned ulw-loop", "see https://example.com/search?q=ulw"]) {
    const [prompt] = await run([text]);
    assert(!prompt.includes("<omp-ulw-policy>"), `reference must not arm: ${text}`);
    assert(!JSON.stringify(requests.at(-1)).includes("-pointer>"), `reference must not inject a skill pointer: ${text}`);
  }
  const [mass] = await run(["/mass-ulw verify this local probe"]);
  assert(!mass.includes("<omp-ulw-policy>"));
  assert(JSON.stringify(requests.at(-1)).includes("<omp-mass-ulw-pointer>"));
  const [contrast] = await run(["Do not use tmux, but ulw verify this local probe"]);
  assert(contrast.includes("<omp-ulw-policy>"));
  const disabled = await run(["ulw verify this probe"], ["--omo-ultrawork-disabled"]);
  assert.equal(disabled.length, 1);
  assert(!disabled[0].includes("<omp-ulw-policy>"));
  const specialised = await run(["/ulw-plan plan this local probe"]);
  assert.equal(specialised.length, 1);
  assert(specialised[0].includes("<omp-ulw-policy>"));
  assert(JSON.stringify(requests.at(-1)).includes("<omp-ulw-plan-pointer>"));
  for (const mode of ["loop", "execute"] as const) {
    const continued = await run([`/ulw-${mode} exercise owned local state`], [], mode);
    assert.equal(continued.length, mode === "execute" ? 3 : 2, `${mode} must continue through its final gate and stop at completed state`);
  }
  const blocked = await run(["/ulw-execute exercise blocked-only state"], [], "execute-blocked");
  assert.equal(blocked.length, 1, "blocked-only plans must not automatically reopen");
  const mixed = await run(["/ulw-execute exercise independent work and final verification"], [], "execute-mixed");
  assert.equal(mixed.length, 3, "mixed plans must finish pending work and verification without reopening blocked rows");
  for (const provider of ["deepseek", "omo-third-party-probe"]) {
    const [prompt] = await run(["verify the selected model profile"], [], undefined, provider);
    const profile = renderPreset({ provider, id: "deepseek-v4-flash-omo-local-probe", name: "DeepSeek V4 Flash" }, { surface: "app", toolNames: [] })!;
    assert(prompt.includes(`<omp-model-preset>\n${profile.prompt}\n</omp-model-preset>`), "actual provider request must contain the provider-specific shipped profile");
  }
  await run(["inspect the native task schema"], [], undefined, undefined, "gpt-6.1-sol", false, ["task", "wait"]);
  const taskRequest = requests.at(-1);
  assert(typeof taskRequest === "object" && taskRequest !== null && "tools" in taskRequest && Array.isArray(taskRequest.tools));
  const taskBody = taskRequest as { tools: Array<{ function?: { name?: string; parameters?: Record<string, any> } }> };
  const taskTool = taskBody.tools.find((tool: unknown) =>
    typeof tool === "object" && tool !== null && "function" in tool && typeof tool.function === "object" &&
    tool.function !== null && "name" in tool.function && tool.function.name === "task",
  );
  assert(taskTool, "actual provider request must expose the native task tool");
  const taskParameters = taskTool.function?.parameters;
  assert(typeof taskParameters === "object" && taskParameters !== null && "properties" in taskParameters && typeof taskParameters.properties === "object" && taskParameters.properties !== null);
  assert("context" in taskParameters.properties && "tasks" in taskParameters.properties);
  assert(Array.isArray(taskParameters.required) && taskParameters.required.includes("context") && taskParameters.required.includes("tasks"));
  const taskItems = taskParameters.properties.tasks.items;
  assert(typeof taskItems === "object" && taskItems !== null && "properties" in taskItems && typeof taskItems.properties === "object" && taskItems.properties !== null);
  assert("task" in taskItems.properties && "solutionSpace" in taskItems.properties);
  for (const forbidden of ["category", "subagent_type", "prompt", "load_skills", "run_in_background"]) {
    assert(!(forbidden in taskParameters.properties), `native task schema must not expose legacy field: ${forbidden}`);
  }
  console.log(JSON.stringify({ status: "PASS", requests: requests.length, scenarios: ["Astra directive", "Astra-fast directive", "eight design skills excluded", "fourteen installed skill commands", "native skill body suppression", "native skill explicit ULW arguments", "native skill explicit planning arguments", "slash activation", "session follow-up", "quoted keyword suppression", "path reference suppression", "negated invocation suppression", "blockquote suppression", "relay suppression", "URL suppression", "mass pointer without base arming", "contrast clause activation", "disable flag", "specialised command pointer", "loop continuation", "execute final-gate continuation", "official DeepSeek profile", "third-party DeepSeek profile", "native task schema"], cleanup: "all owned OMP processes exited; QA directories removed; local provider stopped" }));
} finally { await server.stop(true); }
