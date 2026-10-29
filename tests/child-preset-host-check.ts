// Run with: bun tests/child-preset-host-check.ts (requires the installed omp binary).
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPreset } from "../presets";
import { childModels, parentModel, provider, type Observation } from "./fixtures/child-preset-provider";

type Role = keyof typeof childModels;
type ToolSchema = { properties?: Record<string, ToolSchema>; items?: ToolSchema; required?: string[] };
type WireTool = { type: string; function: { name: string; parameters: ToolSchema } };
type Payload = { model: string; messages: Array<{ role: string; content?: unknown; tool_call_id?: string }>; tools?: WireTool[] };
const roles = Object.keys(childModels) as Role[];
const assignment = (role: Role) => `CHILD_ASSIGNMENT_${role.toUpperCase()}_79B1`;
const completion = (role: Role) => `CHILD_COMPLETE_${role.toUpperCase()}_79B1`;
const observations: Observation[] = [];
const requests: Payload[] = [];
const childRequests = new Map<Role, Payload[]>();
const done = Promise.withResolvers<void>();
// Attach a handler immediately: failures can arrive before RPC readiness.
void done.promise.catch(() => {});
let failure: unknown;
let finalSent = false;
let finalObserved = false;
let parentRequests = 0;
let stopping = false;
const fail = (error: unknown) => { failure ??= error; done.reject(error); };
function stream(content: string | { name: string; args: unknown; id: string }): Response {
  const tool = typeof content !== "string";
  const delta = tool
    ? { role: "assistant", tool_calls: [{ index: 0, id: content.id, type: "function", function: { name: content.name, arguments: JSON.stringify(content.args) } }] }
    : { role: "assistant", content };
  return new Response([
    `data: ${JSON.stringify({ id: "child-preset-probe", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: null }] })}`,
    `data: ${JSON.stringify({ id: "child-preset-probe", object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: tool ? "tool_calls" : "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })}`,
    "data: [DONE]", "",
  ].join("\n\n"), { headers: { "content-type": "text/event-stream" } });
}
function systemText(body: Payload): string {
  return body.messages.filter(message => message.role === "system" || message.role === "developer").map(message => {
    if (typeof message.content === "string") return message.content;
    assert(Array.isArray(message.content), "system content must be string or text blocks");
    return message.content.map((block: { type: string; text?: string }) => {
      assert.equal(block.type, "text");
      return block.text ?? "";
    }).join("\n");
  }).join("\n");
}
function taskArguments(body: Payload): unknown {
  const schema = body.tools?.find(tool => tool.function.name === "task")?.function.parameters;
  const item = schema?.properties?.tasks?.items;
  assert(item?.properties, "installed task tool must expose native batch schema");
  assert(schema?.required?.includes("context") && schema.required.includes("tasks"));
  for (const key of ["agent", "task", "solutionSpace"]) assert(key in item.properties, `native task item missing ${key}`);
  return {
    context: "Local deterministic provider contract check. No files need changing. Return the assigned completion sentinel.",
    tasks: roles.map(role => ({
      name: `Probe${role}`, ...(role === "task" ? {} : { agent: role }),
      task: `${assignment(role)}. Preserve this assignment and return ${completion(role)}. Do not launch nested agents.`,
      solutionSpace: "Only this assigned local fixture response; no repository edits, validation commands, or external services.",
    })),
  };
}
const server = Bun.serve({
  hostname: "127.0.0.1", port: 0,
  async fetch(request) {
    try {
      const url = new URL(request.url);
      assert.equal(request.method, "POST");
      if (url.pathname === "/observe") {
        observations.push(await request.json() as Observation);
        return new Response("ok");
      }
      assert.equal(url.pathname, "/v1/chat/completions");
      const body = await request.json() as Payload;
      requests.push(body);
      if (body.model === parentModel) {
        parentRequests++;
        assert(parentRequests <= 12, "unexpected parent continuation loop");
        if (parentRequests === 1) return stream({ name: "task", id: "spawn_children_79b1", args: taskArguments(body) });
        // Native async result messages, not request arrival or an elapsed delay, prove completion.
        const delivered = JSON.stringify(body.messages.filter(message => message.role !== "assistant"));
        if (roles.every(role => delivered.includes(completion(role)))) {
          finalSent = true;
          return stream("PARENT_CHILD_CHECK_COMPLETE_79B1");
        }
        return stream("Awaiting native child result delivery.");
      }
      const role = roles.find(role => childModels[role] === body.model);
      assert(role, `unexpected local model request: ${body.model}`);
      const seen = childRequests.get(role) ?? [];
      seen.push(body);
      childRequests.set(role, seen);
      assert(seen.length <= (role === "task" ? 2 : 1), `unexpected ${role} retry/continuation`);
      if (role === "task" && seen.length === 1) {
        const evalSchema = body.tools?.find(tool => tool.function.name === "eval")?.function.parameters;
        assert(evalSchema?.properties?.code && evalSchema.properties.language, "mutable worker must expose native eval schema");
        return stream({ name: "eval", id: "eval_arithmetic_79b1", args: { language: "js", code: "print(2 + 3)", title: "Child preset arithmetic" } });
      }
      if (role === "task") {
        const result = body.messages.find(message => message.role === "tool" && message.tool_call_id === "eval_arithmetic_79b1");
        assert(result, "native eval result must return to child provider");
        assert(/\b5\b/.test(JSON.stringify(result.content)), "native eval must return arithmetic result 5");
        assert(!/Tool execution failed|isError.*true/.test(JSON.stringify(result)), "native eval must succeed");
      }
      return stream(completion(role));
    } catch (error) {
      fail(error);
      return new Response(JSON.stringify({ error: { message: String(error) } }), { status: 500 });
    }
  },
});
const root = mkdtempSync(join(tmpdir(), "omo-child-preset-host-"));
let child: Bun.Subprocess<"pipe", "pipe", "pipe"> | undefined;
let output: Promise<void> | undefined;
let stderr: Promise<string> | undefined;
const deadline = setTimeout(() => fail(new Error(`Child host deadline: parent requests=${parentRequests}; children=${JSON.stringify([...childRequests].map(([role, bodies]) => [role, bodies.length]))}; finalSent=${finalSent}`)), 90_000);
try {
  const home = join(root, "home");
  const cwd = join(root, "workspace");
  mkdirSync(home);
  mkdirSync(cwd);
  const config = join(root, "config.yml");
  writeFileSync(config, [
    "task:", "  batch: true", "  isolation:", "    enabled: false", "  completionProbe: false",
    "  speculativeLaunch: false", "  prewalk: false", "  enableLsp: false", "  maxRecursionDepth: 1",
    "  agentPrewalk: {}", "  agentAdvisor: {}", "compaction:", "  enabled: false", "",
  ].join("\n"));
  // An isolated HOME and agent directory deliberately exclude user credentials, plugins,
  // custom agents and model settings. Only PATH/locale/temp are inherited, not API keys.
  child = Bun.spawn([
    "omp", "--mode", "rpc", "--no-ui", "--no-extensions",
    "-e", fileURLToPath(new URL("./fixtures/child-preset-provider.ts", import.meta.url)),
    "--model", `${provider}/${parentModel}`, "--cwd", cwd, "--config", config,
    "--no-skills", "--no-rules", "--no-title", "--no-session", "--no-lsp", "--no-prewalk",
  ], { stdin: "pipe", stdout: "pipe", stderr: "pipe", env: {
    PATH: process.env.PATH, LANG: process.env.LANG ?? "en_US.UTF-8", TMPDIR: process.env.TMPDIR ?? tmpdir(),
    HOME: home, PI_CODING_AGENT_DIR: join(home, "agent"),
    OMO_CHILD_PRESET_BASE_URL: `http://127.0.0.1:${server.port}`,
  } });
  assert(child.stdin && typeof child.stdin !== "number");
  assert(child.stdout && typeof child.stdout !== "number");
  assert(child.stderr && typeof child.stderr !== "number");
  stderr = new Response(child.stderr).text();
  const ready = Promise.withResolvers<void>();
  const configured = Promise.withResolvers<void>();
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
        if (event.type === "extension_error" || (event.type === "message_end" && event.message?.stopReason === "error")) throw new Error(JSON.stringify(event));
        if (event.type === "message_end" && event.message?.role === "assistant" &&
          JSON.stringify(event.message.content).includes("PARENT_CHILD_CHECK_COMPLETE_79B1")) finalObserved = true;
        if (event.type === "response" && event.success === false) {
          // get_state can exceed RPC's transport limit with the full native tool catalog.
          if (event.id === "probe-ready" && String(event.error).includes("transport limit")) ready.resolve();
          else throw new Error(JSON.stringify(event));
        }
        if (event.type === "ready" || (event.type === "response" && event.id === "probe-ready" && event.success)) ready.resolve();
        if (event.type === "response" && event.id === "probe-configured" && event.success) configured.resolve();
        if (event.type === "agent_end" && !event.willContinue && finalSent && finalObserved) done.resolve();
      }
    }
    if (!stopping) throw new Error("OMP exited before all child results were delivered");
  })().catch(fail);
  child.stdin.write(`${JSON.stringify({ type: "get_state", id: "probe-ready" })}\n`);
  await Promise.race([ready.promise, done.promise]);
  if (failure) throw failure;
  child.stdin.write(`${JSON.stringify({ type: "set_auto_compaction", id: "probe-configured", enabled: false })}\n`);
  await Promise.race([configured.promise, done.promise]);
  if (failure) throw failure;
  child.stdin.write(`${JSON.stringify({ type: "prompt", id: "probe-prompt", message: "/ulw exercise the deterministic native child preset contract using the assigned local children" })}\n`);
  await done.promise;
  if (failure) throw failure;

  assert.equal(childRequests.size, roles.length);
  const parentSystem = systemText(requests.find(body => body.model === parentModel)!);
  assert(parentSystem.includes("<omp-ulw-policy>"), "parent must actually activate ULW for the inheritance test");
  const summaries = roles.map(role => {
    const before = observations.filter(item => item.kind === "sub" && item.phase === "before" && item.model.id === childModels[role]);
    const after = observations.filter(item => item.kind === "sub" && item.phase === "after" && item.model.id === childModels[role]);
    assert.equal(before.length, 1, `${role}: exactly one observed native child preparation`);
    assert.equal(after.length, 1, `${role}: exactly one post-injection preparation`);
    const original = before[0]!;
    const injected = after[0]!;
    assert.equal(injected.session, original.session);
    assert.deepEqual(injected.tools, original.tools, `${role}: injection must not change active tools`);
    assert.deepEqual(injected.blocks.slice(1), original.blocks.slice(1), `${role}: every trailing system block must remain byte-identical`);
    assert(original.blocks.length > 1, `${role}: exercise the real multi-block host prompt`);
    assert(injected.prompt.includes(assignment(role)), `${role}: assignment must reach native child hook`);
    const profile = renderPreset(role === "task" ? { id: "gpt-6.1-sol" } : injected.model, { surface: "app", toolNames: injected.tools, subagent: true });
    assert(profile, `${role}: shipped model profile must exist`);
    const childBodies = childRequests.get(role)!;
    for (const body of childBodies) {
      const system = systemText(body);
      assert.equal(system.split("<omp-model-preset>").length - 1, 1, `${role}: exactly one preset marker`);
      assert.equal(system.split("</omp-model-preset>").length - 1, 1);
      assert(system.includes(`<omp-model-preset>\n${profile.prompt}\n\n`), `${role}: outbound payload must contain the complete shipped profile`);
      assert(!system.includes("<omp-ulw-policy>"), `${role}: no inherited parent ULW policy`);
      assert(!system.includes("<ultrawork-mode>"), `${role}: no inherited parent ULW directive`);
      for (const block of injected.blocks.slice(1)) assert(system.includes(block), `${role}: outbound payload must retain each trailing block`);
      assert(JSON.stringify(body.messages).includes(assignment(role)), `${role}: outbound assignment retained`);
      const native = original.blocks.join("\n\n");
      const nativeRole = native.lastIndexOf("§ Role");
      assert(nativeRole >= 0, `${role}: native child role is present`);
      // The host appends role/cooperation/completion after its project footer.
      assert(system.includes(native.slice(nativeRole)), `${role}: appended native role and completion contract must survive intact`);
      const wireNames = body.tools?.map(tool => tool.function.name) ?? [];
      assert(wireNames.length > 0, `${role}: native tools are exposed`);
      for (const name of wireNames) assert(injected.tools.includes(name), `${role}: no extra wire tool ${name}`);
      if (role === "scout") {
        assert(!injected.tools.includes("eval") && !wireNames.includes("eval"), "readonly scout must not gain eval");
        // OMP may expose write as an xd:// transport even for read-only agents;
        // the active-tool equality above ensures this extension grants nothing.
        for (const name of ["edit", "bash", "apply_patch"]) assert(!wireNames.includes(name), `readonly scout must not gain ${name}`);
      } else assert(wireNames.includes("eval"), `${role}: mutable native tools remain exposed`);
    }
    return { agent: role, model: injected.model.id, requests: childBodies.length, tools: injected.tools };
  });
  assert.equal(childRequests.get("task")!.length, 2, "worker must execute real eval and receive its result");
  console.log(JSON.stringify({ status: "PASS", requests: requests.length, scenarios: summaries,
    assertions: ["native default worker, sonic and scout spawn", "complete shipped model profiles", "exact trailing-block preservation", "native role/assignment/completion retention", "parent ULW isolation", "unchanged active tools", "readonly scout restrictions", "native worker eval returns 5", "native async completion delivery"],
    limitations: ["Scripted local responses verify host transport, not model obedience", "Model refresh/fallback and custom-template rejection are covered by unit tests", "Seance is excluded because it isolates extensions"],
  }, null, 2));
} finally {
  clearTimeout(deadline);
  stopping = true;
  if (child) {
    // Give the host's shutdown handlers a chance to dispose native child/eval runtimes.
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
