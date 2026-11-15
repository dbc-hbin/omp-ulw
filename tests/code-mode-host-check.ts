// Run with: bun tests/code-mode-host-check.ts (requires the installed omp binary).
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gptModel, otherModel, provider, type Observation, type WireTool } from "./fixtures/code-mode-provider";

interface Message { role: string; content?: unknown; tool_call_id?: string }
interface Payload { model: string; messages: Message[]; tools?: WireTool[] }
interface Turn {
  name: string;
  model: string;
  calls: Payload[];
  observations: Observation[];
  finalSent: boolean;
  finalObserved: boolean;
}
const direct = new Set(["eval", "ask", "wait", "todo", "yield", "think", "task", "checkpoint", "rewind", "new_context", "write"]);
const sentinel = "NATIVE_CODE_MODE_READ_47A9";
const present = "native-code-mode-present.txt";
const missing = "native-code-mode-missing-47a9.txt";
const evalCall = "native_eval_read_47a9";
const turns: Turn[] = [];
let turn: Turn | undefined;
let failure: unknown;
let stopping = false;
const failed = Promise.withResolvers<never>();
void failed.promise.catch(() => {});
function fail(error: unknown): void {
  failure ??= error;
  failed.reject(error);
}
function stream(content: string | { name: string; id: string; args: unknown }): Response {
  const tool = typeof content !== "string";
  const delta = tool
    ? { role: "assistant", tool_calls: [{ index: 0, id: content.id, type: "function", function: { name: content.name, arguments: JSON.stringify(content.args) } }] }
    : { role: "assistant", content };
  return new Response([
    `data: ${JSON.stringify({ id: "code-mode-probe", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: null }] })}`,
    `data: ${JSON.stringify({ id: "code-mode-probe", object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: tool ? "tool_calls" : "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })}`,
    "data: [DONE]", "",
  ].join("\n\n"), { headers: { "content-type": "text/event-stream" } });
}
function names(tools: WireTool[]): string[] { return tools.map(tool => tool.function.name).sort(); }
function toolSchemas(tools: WireTool[]): unknown {
  return tools.map(tool => ({ name: tool.function.name, parameters: tool.function.parameters }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function systemText(body: Payload): string {
  return body.messages.filter(message => ["system", "developer"].includes(message.role)).map(message => {
    if (typeof message.content === "string") return message.content;
    assert(Array.isArray(message.content), "system content must be text or text blocks");
    return message.content.map((block: { type: string; text?: string }) => {
      assert.equal(block.type, "text");
      return block.text ?? "";
    }).join("\n");
  }).join("\n");
}
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    try {
      const url = new URL(request.url);
      assert.equal(url.hostname, "127.0.0.1");
      assert.equal(request.method, "POST");
      assert(turn, "unscripted provider traffic outside a prompt");
      assert(!turn.finalSent, "unexpected traffic after the scripted final response");
      if (url.pathname === "/observe") {
        const observation = await request.json() as Observation;
        assert(["agent", "provider"].includes(observation.stage));
        assert(["before", "after"].includes(observation.phase));
        assert.equal(observation.model, turn.model);
        turn.observations.push(observation);
        return new Response("ok");
      }
      assert.equal(url.pathname, "/v1/chat/completions", "unexpected provider endpoint");
      const body = await request.json() as Payload;
      assert.equal(body.model, turn.model);
      assert(Array.isArray(body.messages) && Array.isArray(body.tools));
      turn.calls.push(body);
      const expected = turn.name === "gpt-native-eval" ? 2 : 1;
      assert(turn.calls.length <= expected, "unexpected retry, continuation or auxiliary request");
      if (turn.name === "gpt-native-eval" && turn.calls.length === 1) {
        assert(body.tools.some(tool => tool.function.name === "eval"), "native eval must be directly callable");
        return stream({ name: "eval", id: evalCall, args: {
          language: "js", title: "Reading native code-mode fixtures",
          code: [
            `const paths = ${JSON.stringify([present, missing])};`,
            "const settled = await Promise.allSettled(paths.map(path => tool.read({ path })));",
            'print(JSON.stringify(settled.map((item, index) => ({ path: paths[index], status: item.status, result: item.status === "fulfilled" ? item.value : String(item.reason) }))));',
          ].join("\n"),
        } });
      }
      if (turn.name === "gpt-native-eval") {
        const result = body.messages.find(message => message.role === "tool" && message.tool_call_id === evalCall);
        assert(result, "native eval result must return to the actual provider");
        const text = JSON.stringify(result.content);
        assert(text.includes(sentinel), "native read must return the scratch-file sentinel");
        assert(text.includes(missing), "native missing-file error must identify the requested file");
        assert(/ENOENT|no such file|not found|does not exist/i.test(text), "native missing-file diagnostic must survive eval");
        assert(/rejected|hasError|isError/.test(text), "native eval must expose the failed read, not silently succeed");
      }
      turn.finalSent = true;
      return stream(`CODE_MODE_COMPLETE:${turn.name}`);
    } catch (error) {
      fail(error);
      return new Response(JSON.stringify({ error: { message: String(error) } }), { status: 500 });
    }
  },
});
const root = mkdtempSync(join(tmpdir(), "omp-code-mode-host-"));
let child: Bun.Subprocess<"pipe", "pipe", "pipe"> | undefined;
let output: Promise<void> | undefined;
let stderr: Promise<string> | undefined;
const pending = new Map<string, ReturnType<typeof Promise.withResolvers<void>>>();
let ended: ReturnType<typeof Promise.withResolvers<void>> | undefined;
const deadline = setTimeout(() => fail(new Error(`Code-mode host deadline: ${turn?.name ?? "startup"}; requests=${turn?.calls.length ?? 0}`)), 90_000);
function send(command: Record<string, unknown>): void {
  assert(child?.stdin && typeof child.stdin !== "number");
  child.stdin.write(`${JSON.stringify(command)}\n`);
}
async function rpc(command: Record<string, unknown> & { id: string }): Promise<void> {
  const signal = Promise.withResolvers<void>();
  pending.set(command.id, signal);
  send(command);
  await Promise.race([signal.promise, failed.promise]);
  pending.delete(command.id);
}
try {
  const home = join(root, "home");
  const cwd = join(root, "workspace");
  mkdirSync(home);
  mkdirSync(cwd);
  writeFileSync(join(cwd, present), `${sentinel}\n`);
  const config = join(root, "config.yml");
  writeFileSync(config, [
    "compaction:", "  enabled: false", "prewalk:", "  enabled: false", "  auto: off",
    "memory:", "  enabled: false",
    "task:", "  isolation:", "    enabled: false", "  completionProbe: false",
    "  speculativeLaunch: false", "  prewalk: false", "  enableLsp: false",
    "  agentPrewalk: {}", "  agentAdvisor: {}", "",
  ].join("\n"));
  // Only PATH/locale/temp are inherited: no credentials, user plugins, memory,
  // custom model configuration, rules or project files enter this host.
  child = Bun.spawn([
    "omp", "--mode", "rpc", "--no-ui", "--no-extensions",
    "-e", fileURLToPath(new URL("./fixtures/code-mode-provider.ts", import.meta.url)),
    "--model", `${provider}/${gptModel}`, "--cwd", cwd, "--config", config,
    "--tools", "read,grep,bash,edit,write,eval,task",
    "--no-skills", "--no-rules", "--no-title", "--no-session", "--no-lsp", "--no-prewalk",
  ], { cwd, stdin: "pipe", stdout: "pipe", stderr: "pipe", env: {
    PATH: process.env.PATH, LANG: process.env.LANG ?? "en_US.UTF-8", TMPDIR: process.env.TMPDIR ?? tmpdir(),
    HOME: home, PI_CODING_AGENT_DIR: join(home, "agent"),
    OMP_CODE_MODE_PROBE_BASE: `http://127.0.0.1:${server.port}`,
  } });
  assert(child.stdout && typeof child.stdout !== "number");
  assert(child.stderr && typeof child.stderr !== "number");
  stderr = new Response(child.stderr).text();
  output = (async () => {
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const bytes of child!.stdout as ReadableStream<Uint8Array>) {
      buffer += decoder.decode(bytes, { stream: true });
      for (;;) {
        const end = buffer.indexOf("\n");
        if (end < 0) break;
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        if (!line.startsWith("{")) continue;
        const event = JSON.parse(line);
        if (event.type === "extension_error" ||
          event.type === "message_end" && event.message?.stopReason === "error" ||
          event.type === "tool_execution_end" && (event.isError || event.result?.isError || event.result?.hasError)) {
          throw new Error(JSON.stringify(event));
        }
        if (event.type === "response") {
          // Native get_state may exceed the RPC transport limit with tool metadata.
          if (event.success === false && !(event.id === "ready" && String(event.error).includes("transport limit"))) {
            throw new Error(JSON.stringify(event));
          }
          pending.get(event.id)?.resolve();
        }
        if (event.type === "message_end" && event.message?.role === "assistant" && turn &&
          JSON.stringify(event.message.content).includes(`CODE_MODE_COMPLETE:${turn.name}`)) turn.finalObserved = true;
        if (event.type === "agent_end" && !event.willContinue) {
          assert(turn?.finalSent && turn.finalObserved, "host must consume the scripted final response before completing");
          ended?.resolve();
        }
      }
    }
    if (!stopping) throw new Error("OMP exited before the scripted model-switch sequence completed");
  })().catch(fail);
  await rpc({ type: "get_state", id: "ready" });
  await rpc({ type: "set_auto_compaction", id: "compaction-off", enabled: false });
  for (const [index, [name, model]] of [
    ["gpt-native-eval", gptModel], ["non-gpt-native-tools", otherModel], ["gpt-switch-back", gptModel],
  ].entries()) {
    if (index > 0) await rpc({ type: "set_model", id: `model-${index}`, provider, modelId: model });
    turn = { name: name!, model: model!, calls: [], observations: [], finalSent: false, finalObserved: false };
    turns.push(turn);
    ended = Promise.withResolvers<void>();
    send({ type: "prompt", id: `prompt-${index}`, message: `Code-mode deterministic host contract: ${name}.` });
    await Promise.race([ended.promise, failed.promise]);
    assert.equal(turn.calls.length, index === 0 ? 2 : 1);
  }
  let presetRegions = 0;
  const baseline = turns[0]!.observations.find(item => item.stage === "provider" && item.phase === "before")!;
  assert(baseline?.tools, "must observe native pre-plugin schemas");
  for (const name of ["read", "grep", "bash", "edit", "write", "eval", "task"]) {
    assert(baseline.activeTools.includes(name), `explicit native selection must enable ${name}`);
    assert(names(baseline.tools).includes(name), `native request must originally expose ${name}`);
  }
  for (const current of turns) {
    for (const stage of ["agent", "provider"] as const) {
      const before = current.observations.filter(item => item.stage === stage && item.phase === "before");
      const after = current.observations.filter(item => item.stage === stage && item.phase === "after");
      assert.equal(before.length, stage === "agent" ? 1 : current.calls.length);
      assert.equal(after.length, before.length);
      before.forEach((original, index) => {
        assert.deepEqual(after[index]!.activeTools, original.activeTools, `${current.name}: ${stage} must not change activation`);
        assert.deepEqual(original.activeTools, baseline.activeTools, `${current.name}: switching models must not change native activation`);
      });
    }
    current.calls.forEach((body, index) => {
      const original = current.observations.filter(item => item.stage === "provider" && item.phase === "before")[index]!.tools!;
      const projected = current.observations.filter(item => item.stage === "provider" && item.phase === "after")[index]!.tools!;
      assert.deepEqual(body.tools, projected, "observed final schemas must reach the actual provider");
      if (current.model !== gptModel) {
        assert.deepEqual(toolSchemas(body.tools!), toolSchemas(original), "non-GPT switch must restore every original native schema");
        assert.deepEqual(toolSchemas(body.tools!), toolSchemas(baseline.tools!), "non-GPT must restore the original native tool set");
        return;
      }
      assert.deepEqual(names(body.tools!), names(original.filter(tool => direct.has(tool.function.name))), "GPT must expose exactly the conservative direct set");
      assert.deepEqual(toolSchemas(body.tools!), toolSchemas(original.filter(tool => direct.has(tool.function.name))), "projection must preserve every retained native tool's parameters");
      for (const name of ["read", "grep", "bash", "edit"]) assert(!names(body.tools!).includes(name), `GPT must hide ordinary ${name}`);
      for (const name of ["eval", "task", "write"]) assert(names(body.tools!).includes(name), `GPT must retain native ${name}`);
      const read = original.find(tool => tool.function.name === "read")!;
      const description = body.tools!.find(tool => tool.function.name === "eval")!.function.description ?? "";
      assert(description.includes("<omp-code-mode>") && description.includes("</omp-code-mode>"), "native eval must carry the catalog");
      assert(description.includes("await tool.read(args)"), "catalog must advertise native read");
      assert(description.includes(`JSON Schema: ${JSON.stringify(read.function.parameters)}`), "catalog must contain the actual native read wire schema");
      const regions = [...systemText(body).matchAll(/<omp-model-preset>([\s\S]*?)<\/omp-model-preset>/g)];
      assert.equal(regions.length, 1, `${current.name}: actual GPT request must contain exactly one installed model preset`);
      for (const region of regions) {
        presetRegions++;
        assert(!/\beval\b|await tool\./i.test(region[1]!), "any installed GPT preset region must have no eval steering");
      }
    });
  }
  if (failure) throw failure;
  console.log(JSON.stringify({
    status: "PASS", requests: turns.reduce((sum, item) => sum + item.calls.length, 0),
    scenarios: turns.map(item => ({ name: item.name, model: item.model, requests: item.calls.length })),
    assertions: ["full index installation", "unchanged native activation before/after hooks", "actual GPT wire projection",
      "native read schema in eval catalog", "real eval tool.read sentinel and missing-file diagnostic",
      "direct native task retained", "RPC non-GPT restoration and GPT re-projection"],
    writeException: "Native write remains direct: its schema mixes ordinary files, plans and xd session-control; the public API cannot distinguish them.",
    promptIntegration: `${presetRegions} installed GPT preset regions checked for absent eval steering`,
    limitations: ["Scripted loopback responses verify transport, not model obedience",
      "No-eval authoritative selection and cache mutation belong to unit checks; this smoke does not claim those scenarios"],
  }, null, 2));
} catch (error) {
  fail(error);
  throw error;
} finally {
  clearTimeout(deadline);
  stopping = true;
  if (child) {
    child.kill("SIGTERM");
    const killDeadline = setTimeout(() => child?.kill("SIGKILL"), 5_000);
    try { await child.exited; } finally { clearTimeout(killDeadline); }
  }
  await output;
  const errors = await stderr;
  if (failure && errors) console.error(errors);
  await server.stop(true);
  rmSync(root, { recursive: true, force: true });
}
