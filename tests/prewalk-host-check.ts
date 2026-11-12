// Run with: bun tests/prewalk-host-check.ts (requires the installed omp binary).
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { renderPreset } from "../presets";
import { provider, sourceModel, targetModel } from "./fixtures/prewalk-provider";
import type { Observation } from "./fixtures/prewalk-provider";

interface Call { model: string; messages: unknown[] }
interface Turn { prompt: string; artifact?: string; calls: Call[]; observations: Observation[]; auxiliary: number }
const turns: Turn[] = [];
let turn: Turn | undefined;
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    const body: unknown = await request.json();
    assert(turn, "provider traffic must belong to an active turn");
    if (new URL(request.url).pathname === "/observe") {
      assert(typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string" &&
        "enabled" in body && "auto" in body && "enabledSource" in body && typeof body.enabledSource === "string" &&
        "autoSource" in body && typeof body.autoSource === "string");
      turn.observations.push({ prompt: body.prompt, enabled: body.enabled, auto: body.auto, enabledSource: body.enabledSource, autoSource: body.autoSource });
      return new Response("ok");
    }
    assert(typeof body === "object" && body !== null && "model" in body && typeof body.model === "string" && "messages" in body && Array.isArray(body.messages));
    const main = "tools" in body && Array.isArray(body.tools) && body.tools.length > 0;
    if (main) turn.calls.push({ model: body.model, messages: body.messages });
    else turn.auxiliary++;
    assert(turn.calls.length <= 5 && turn.auxiliary <= 32, "unexpected prewalk/provider loop");
    const step = main ? turn.calls.length : 0;
    const work = "Write the requested scoped artifact";
    const tools = turn.artifact && step === 1
      ? [{ name: "todo", arguments: { i: "Tracking scoped work", op: "init", items: [work] } }]
      : turn.artifact && step === 2
        ? [
          { name: "write", arguments: { i: "Writing requested scoped artifact", path: turn.artifact, content: "Scoped artifact\n" } },
          { name: "todo", arguments: { i: "Completing scoped work", op: "done", task: work } },
        ] : [];
    const delta = tools.length
      ? { role: "assistant", tool_calls: tools.map((tool, index) => ({ index, id: `call-${turns.length}-${step}-${index}`, type: "function", function: { name: tool.name, arguments: JSON.stringify(tool.arguments) } })) }
      : { role: "assistant", content: main ? "PREWALK-PROBE" : "Local fixture skill." };
    return new Response([
      `data: ${JSON.stringify({ id: "prewalk-probe", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: null }] })}`,
      `data: ${JSON.stringify({ id: "prewalk-probe", object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: tools.length ? "tool_calls" : "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })}`,
      "data: [DONE]", "",
    ].join("\n\n"), { headers: { "content-type": "text/event-stream" } });
  },
});
const root = mkdtempSync(join(tmpdir(), "omp-prewalk-host-"));
async function run(inputs: Array<{ prompt: string; artifact?: string }>, options: { enabled?: boolean; auto?: "off" | "on"; seed?: "runtime" | "operator-clear"; skills?: boolean } = {}): Promise<Turn[]> {
  const start = turns.length;
  const cwd = mkdtempSync(join(root, "workspace-"));
  const home = join(cwd, "home");
  mkdirSync(home);
  const config = join(cwd, "config.yml");
  const settings = `compaction:\n  enabled: false\nprewalk:\n  enabled: ${options.enabled ?? true}\n  model: ${provider}/${targetModel}\n  auto: ${options.auto ?? "off"}\n`;
  writeFileSync(config, settings);
  const child = Bun.spawn([
    "omp", "--mode", "rpc", "--no-ui", "--no-extensions", "-e", resolve("tests/fixtures/prewalk-provider.ts"),
    "--model", `${provider}/${sourceModel}`, "--cwd", cwd, "--config", config,
    "--tools", "read,write,todo", ...(options.skills ? ["--skills", "ulw-plan"] : ["--no-skills"]),
    "--no-rules", "--no-title", "--no-session", "--no-lsp",
  ], { cwd, stdin: "pipe", stdout: "pipe", stderr: "pipe", env: {
    PATH: process.env.PATH, LANG: process.env.LANG ?? "en_US.UTF-8", TMPDIR: process.env.TMPDIR ?? tmpdir(),
    HOME: home, PI_CODING_AGENT_DIR: join(home, "agent"),
    OMP_PREWALK_PROBE_BASE: `http://127.0.0.1:${server.port}`, OMP_PREWALK_PROBE_SEED: options.seed ?? "",
  } });
  const stderr = new Response(child.stderr).text();
  let signal = Promise.withResolvers<void>();
  let expected = "ready";
  const watchdog = setTimeout(() => { signal.reject(new Error(`Prewalk host deadline: ${expected}; ${turn?.prompt}`)); child.kill(); }, 60000);
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
        if (event.type === "extension_error" || event.type === "response" && "success" in event && event.success === false) signal.reject(new Error(JSON.stringify(event)));
        if (event.type === "message_end" && "message" in event && typeof event.message === "object" && event.message !== null && "stopReason" in event.message && event.message.stopReason === "error") signal.reject(new Error(JSON.stringify(event.message)));
        if (expected === "ready" && event.type === "response" && "id" in event && event.id === "ready") signal.resolve();
        if (expected === "agent_end" && event.type === "agent_end" && !("willContinue" in event && event.willContinue === true)) signal.resolve();
      }
    }
    if (expected !== "finished") signal.reject(new Error(`OMP exited before ${expected}`));
  })();
  try {
    child.stdin.write(JSON.stringify({ type: "get_state", id: "ready" }) + "\n");
    await signal.promise;
    for (const input of inputs) {
      turn = { ...input, calls: [], observations: [], auxiliary: 0 };
      turns.push(turn);
      signal = Promise.withResolvers<void>();
      expected = "agent_end";
      child.stdin.write(JSON.stringify({ type: "prompt", id: `prompt-${turns.length}`, message: input.prompt }) + "\n");
      await signal.promise;
      if (input.artifact) assert.equal(readFileSync(join(cwd, input.artifact), "utf8"), "Scoped artifact\n");
    }
    assert.equal(readFileSync(config, "utf8"), settings, "task overrides must never persist config changes");
    expected = "finished";
  } finally {
    clearTimeout(watchdog);
    child.kill();
    await child.exited;
    await output;
    const errors = await stderr;
    if (expected !== "finished") console.error(errors);
  }
  return turns.slice(start);
}
function messages(call: Call, roles: string[]): string {
  return call.messages.flatMap((message: unknown) => {
    if (typeof message !== "object" || message === null || !("role" in message) || !roles.includes(String(message.role)) || !("content" in message)) return [];
    const content = message.content;
    if (typeof content === "string") return [content];
    if (!Array.isArray(content)) return [];
    return content.flatMap((block: unknown) => typeof block === "object" && block !== null && "text" in block && typeof block.text === "string" ? [block.text] : []);
  }).join("\n");
}
function restricted(result: Turn, requests: number): void {
  assert.equal(result.calls.length, requests, `no native prewalk continuation for ${result.prompt}; ${JSON.stringify({
    observations: result.observations,
    calls: result.calls.map(call => ({ model: call.model, text: messages(call, ["user", "tool"]) })),
  })}`);
  assert(result.calls.every(call => call.model === sourceModel), "restricted artifacts must not trigger a handoff");
  assert(result.observations.every(observation => observation.enabled === false && observation.auto === "off"));
}
try {
  const [investigation, continuation, planning, implementation] = await run([
    { prompt: "/ulw Investigate only; report findings without edits." },
    { prompt: "continue" },
    { prompt: "/ulw-plan fix login", artifact: "doc/plans/probe.md" },
    { prompt: "Fix the implementation now.", artifact: "implementation.txt" },
  ]);
  assert(investigation && continuation && planning && implementation);
  restricted(investigation, 1);
  restricted(continuation, 1);
  restricted(planning, 3);
  assert.equal(implementation.observations[0]?.enabled, true);
  assert.equal(implementation.observations[0]?.enabledSource, "overlay");
  assert(implementation.calls.some(call => call.model === targetModel), "a later implementation must recover its configured handoff");
  for (const call of [...investigation.calls, ...continuation.calls, ...planning.calls, ...implementation.calls]) {
    const system = messages(call, ["system", "developer"]);
    const profile = renderPreset({ id: call.model }, { surface: "app", toolNames: ["read", "write", "todo"] });
    assert(profile);
    assert(system.includes(profile.prompt), "handoff must refresh the model's actual working profile");
    assert.equal(system.match(/<omp-model-preset>/g)?.length, 1);
    assert(system.includes("<omp-ulw-policy>"), "task scope changes must preserve armed ULW");
  }
  const steering = implementation.calls.map(call => messages(call, ["user"])).join("\n");
  assert(steering.includes("Prewalk checkpoint:"));
  assert(!steering.includes("STOP: In NEXT reply") && !steering.includes("5–9 items"), "native prewalk must not reinstate forced planning");
  const [nativePlan] = await run([{ prompt: "/skill:ulw-plan fix login", artifact: "doc/plans/native.md" }], { skills: true });
  assert(nativePlan);
  restricted(nativePlan, 3);
  const [automatic] = await run([{ prompt: "Just explain why login fails." }], { enabled: false, auto: "on" });
  assert(automatic);
  restricted(automatic, 1);
  assert.equal(automatic.auxiliary, 0, "restricted tasks must not invoke the auto-prewalk judge");
  const [off, stillOff] = await run([
    { prompt: "계획만 세워줘." }, { prompt: "Implement the fix.", artifact: "off.txt" },
  ], { enabled: false });
  assert(off && stillOff);
  restricted(off, 1);
  assert.equal(stillOff.calls.length, 3);
  assert(stillOff.calls.every(call => call.model === sourceModel), "an originally disabled prewalk must remain disabled");
  for (const seed of ["runtime", "operator-clear"] as const) {
    const [muted, restored] = await run([
      { prompt: "수정하지 말고 원인만 분석해." }, { prompt: "Implement the fix.", artifact: "restored.txt" },
    ], { enabled: false, seed });
    assert(muted && restored);
    restricted(muted, 1);
    assert.equal(muted.auxiliary, 0);
    const state = restored.observations[0];
    assert(state);
    assert.equal(state.enabled, seed === "runtime");
    assert.equal(state.auto, seed === "runtime" ? "on" : "off");
    assert.equal(state.enabledSource, seed === "runtime" ? "runtime" : "overlay");
    assert.equal(state.autoSource, seed === "runtime" ? "runtime" : "overlay");
    assert.equal(restored.calls.some(call => call.model === targetModel), seed === "runtime");
  }
  for (const prompt of [
    "Refactor the parser.", "/refactor the parser",
    "/mass-ulw Fix the login failure.",
    "Implement the fix without changes to the public API.",
    "Fix login. Do not modify unrelated files.",
  ]) {
    const [explanation, execution] = await run([
      { prompt: "/mass-ulw Explain the login failure." },
      { prompt, artifact: "review-regression.txt" },
    ]);
    assert(explanation && execution);
    restricted(explanation, 1);
    assert.equal(execution.observations[0]?.enabled, true);
    assert(execution.calls.some(call => call.model === targetModel), `implementation must restore prewalk: ${prompt}`);
  }
  for (const prompt of ["/ulw-execute Do not modify any files yet.", "/refactor Do not implement for now."]) {
    const [waiting, continuation, execution] = await run([
      { prompt }, { prompt: "continue" }, { prompt: "Fix the implementation now.", artifact: "after-wait.txt" },
    ]);
    assert(waiting && continuation && execution);
    restricted(waiting, 1);
    restricted(continuation, 1);
    assert.equal(execution.observations[0]?.enabled, true);
    assert(execution.calls.some(call => call.model === targetModel), "a later request must release the temporary prohibition");
  }
  console.log(`PASS: ${turns.length} real OMP prewalk turns; scoped suppression, plan writes, native skill, handoff, preset/ULW state, auto judge, override ownership and persisted settings`);
} finally {
  server.stop(true);
  rmSync(root, { recursive: true, force: true });
}
