// Compare the native blocking task contract through direct and eval calls.
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { childModel, parentModel, provider } from "./fixtures/task-bridge-provider";

interface Stats { tokens: { input: number; output: number; total: number }; cost: number }
const usage = { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 };
const childResult = "TASK_BRIDGE_CHILD_RESULT";
const finalResult = "TASK_BRIDGE_PARENT_DONE";
function stream(content: string | { name: string; arguments: unknown }): Response {
  const isTool = typeof content !== "string";
  const delta = isTool
    ? { role: "assistant", tool_calls: [{ index: 0, id: "task_contract", type: "function",
      function: { name: content.name, arguments: JSON.stringify(content.arguments) } }] }
    : { role: "assistant", content };
  return new Response([
    `data: ${JSON.stringify({ id: "probe", object: "chat.completion.chunk", choices: [{ index: 0, delta, finish_reason: null }] })}`,
    `data: ${JSON.stringify({ id: "probe", object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: isTool ? "tool_calls" : "stop" }], usage })}`,
    "data: [DONE]", "",
  ].join("\n\n"), { headers: { "content-type": "text/event-stream" } });
}

async function run(invocation: "direct" | "eval"): Promise<Stats> {
  const root = mkdtempSync(join(tmpdir(), "omp-task-bridge-"));
  const home = join(root, "home");
  const cwd = join(root, "workspace");
  mkdirSync(join(home, "agent", "agents"), { recursive: true });
  mkdirSync(cwd);
  writeFileSync(join(home, "agent", "agents", "contract.md"), [
    "---", "name: contract", "description: Local blocking contract probe.",
    "blocking: true", "tools: []", "spawns: []", "---",
    `Return ${childResult}. Do not call tools or spawn agents.`,
  ].join("\n"));
  const config = join(root, "config.yml");
  writeFileSync(config, [
    "compaction:", "  enabled: false", "prewalk:", "  enabled: false", "  auto: off",
    "memory:", "  enabled: false", "task:", "  batch: true", "  isolation:", "    enabled: false",
    "  completionProbe: false", "  speculativeLaunch: false", "  prewalk: false",
    "  enableLsp: false", "  agentPrewalk: {}", "  agentAdvisor: {}", "",
  ].join("\n"));
  const failed = Promise.withResolvers<never>();
  void failed.promise.catch(() => {});
  const ready = Promise.withResolvers<void>();
  const ended = Promise.withResolvers<void>();
  const stats = Promise.withResolvers<Stats>();
  let parentCalls = 0;
  let childCalls = 0;
  let finalObserved = false;
  let stopping = false;
  const server = Bun.serve({
    hostname: "127.0.0.1", port: 0,
    async fetch(request) {
      try {
        assert.equal(new URL(request.url).pathname, "/v1/chat/completions");
        const body = await request.json() as {
          model: string; messages: Array<{ role: string; tool_call_id?: string; content: unknown }>;
          tools: Array<{ function: { name: string } }>;
        };
        if (body.model === childModel) {
          assert.equal(++childCalls, 1);
          return stream(childResult);
        }
        assert.equal(body.model, parentModel);
        assert(++parentCalls <= 2, "unexpected retry or continuation");
        if (parentCalls === 1) {
          const args = { context: "Local contract verification; no files or external services.",
            tasks: [{ agent: "contract", name: "ContractChild",
              task: `Return ${childResult}. Do not call tools.`,
              solutionSpace: "One fixed response, no investigation or edits." }] };
          return stream(invocation === "direct"
            ? { name: "task", arguments: args }
            : { name: "eval", arguments: { language: "js",
              code: `const result = await tool.task(${JSON.stringify(args)}); print(result);`,
              title: "Checking native task bridge" } });
        }
        const result = body.messages.find(message => message.role === "tool" && message.tool_call_id === "task_contract");
        assert(result && JSON.stringify(result.content).includes(childResult), "child result must reach the parent through the selected path");
        return stream(finalResult);
      } catch (error) {
        failed.reject(error);
        return new Response(String(error), { status: 500 });
      }
    },
  });
  let child: Bun.Subprocess<"pipe", "pipe", "pipe"> | undefined;
  let output: Promise<void> | undefined;
  let stderr: Promise<string> | undefined;
  const deadline = setTimeout(() => failed.reject(new Error(`${invocation}: task host deadline`)), 90_000);
  try {
    child = Bun.spawn([
      "omp", "--mode", "rpc", "--no-ui", "--no-extensions",
      "-e", fileURLToPath(new URL("./fixtures/task-bridge-provider.ts", import.meta.url)),
      "--model", `${provider}/${parentModel}`, "--cwd", cwd, "--config", config,
      "--no-skills", "--no-rules", "--no-title", "--no-session", "--no-lsp", "--no-prewalk",
    ], { cwd, stdin: "pipe", stdout: "pipe", stderr: "pipe", env: {
      PATH: process.env.PATH, LANG: process.env.LANG ?? "en_US.UTF-8", TMPDIR: process.env.TMPDIR ?? tmpdir(),
      HOME: home, PI_CODING_AGENT_DIR: join(home, "agent"),
      OMP_TASK_BRIDGE_BASE: `http://127.0.0.1:${server.port}`,
    } });
    const send = (command: object) => child!.stdin.write(`${JSON.stringify(command)}\n`);
    stderr = new Response(child.stderr).text();
    output = (async () => {
      const decoder = new TextDecoder();
      let buffer = "";
      for await (const bytes of child!.stdout) {
        buffer += decoder.decode(bytes, { stream: true });
        for (;;) {
          const end = buffer.indexOf("\n");
          if (end < 0) break;
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 1);
          if (!line.startsWith("{")) continue;
          const event = JSON.parse(line);
          if (event.type === "extension_error" || event.type === "message_end" && event.message?.stopReason === "error") {
            throw new Error(line);
          }
          if (event.type === "response") {
            if (event.success === false && !(event.id === "ready" && String(event.error).includes("transport limit"))) throw new Error(line);
            if (event.id === "ready") ready.resolve();
            if (event.id === "stats") stats.resolve(event.data);
          }
          if (event.type === "message_end" && event.message?.role === "assistant" &&
            JSON.stringify(event.message.content).includes(finalResult)) finalObserved = true;
          if (event.type === "agent_end" && !event.willContinue && finalObserved) ended.resolve();
        }
      }
      if (!stopping) throw new Error("Host exited before verification completed");
    })().catch(error => failed.reject(error));
    send({ type: "get_state", id: "ready" });
    await Promise.race([ready.promise, failed.promise]);
    send({ type: "prompt", id: "run", message: "Run the local blocking task contract probe." });
    await Promise.race([ended.promise, failed.promise]);
    send({ type: "get_session_stats", id: "stats" });
    const result = await Promise.race([stats.promise, failed.promise]);
    assert.equal(parentCalls, 2);
    assert.equal(childCalls, 1);
    return result;
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
    if (errors) console.error(errors);
    await server.stop(true);
    rmSync(root, { recursive: true, force: true });
  }
}

const direct = await run("direct");
const bridged = await run("eval");
assert.equal(direct.tokens.total, usage.total_tokens * 3);
// OMP 18.20.2 returns the blocking child's result but does not add nested
// task usage to session stats. Keep this gap visible until the host fixes it.
assert.equal(bridged.tokens.total, usage.total_tokens * 2);
assert(Math.abs(direct.cost / bridged.cost - 1.5) < 1e-9);
console.log(JSON.stringify({
  status: "PASS", assertions: ["native blocking child result returns through direct and eval paths"],
  knownLimitation: "OMP 18.20.2 omits bridged blocking task usage from native session totals",
  direct: { tokens: direct.tokens.total, cost: direct.cost },
  bridged: { tokens: bridged.tokens.total, cost: bridged.cost },
}, null, 2));
