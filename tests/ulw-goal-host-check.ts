// Run: bun tests/ulw-goal-host-check.ts (installed omp, Bun with POSIX Terminal support).
// Exercises the editor, not RPC prompt text or a programmatic sendUserMessage.
import { strict as assert } from "node:assert";
import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, watch, writeFileSync, type FSWatcher } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type RecordValue = Record<string, any>;
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const objective = 'ulw preserve the full objective: 한글, "quoted path", and the final criterion END-OF-GOAL';
const followup = "ulw keep the original goal and check FOLLOWUP-DO-NOT-REPLACE";
const firstChunk = "ULW-GOAL-INITIAL-STREAM";
const events = new EventEmitter();
const deadline = new AbortController();
let phase = "starting TUI";
let terminalOutput = "";
let stopping = false;
let sessionFile: string | undefined;
let requestCount = 0;
let drainingFollowup = false;
const goals: RecordValue[] = [];
const streams = new Map<number, () => void>();
const fail = (error: unknown) => { if (!deadline.signal.aborted) deadline.abort(error); };
const timer = setTimeout(() => fail(new Error(`TUI goal deadline at ${phase}; requests=${requestCount}`)), 60000);
const interrupted = () => fail(new Error("TUI goal probe interrupted"));
process.on("SIGINT", interrupted);
process.on("SIGTERM", interrupted);

// Call before the action that can emit the event. No timers or polling for readiness.
function expectEvent(type: string, predicate: (value: RecordValue) => boolean = () => true): Promise<RecordValue> {
  const { promise, resolve: resolveEvent, reject } = Promise.withResolvers<RecordValue>();
  const cleanup = () => { events.off(type, receive); deadline.signal.removeEventListener("abort", abort); };
  const abort = () => { cleanup(); reject(deadline.signal.reason); };
  const receive = (value: RecordValue) => {
    if (!predicate(value)) return;
    cleanup();
    resolveEvent(value);
  };
  events.on(type, receive);
  deadline.signal.addEventListener("abort", abort, { once: true });
  if (deadline.signal.aborted) abort();
  // Some subscriptions intentionally precede other awaited subscriptions.
  void promise.catch(() => {});
  return promise;
}
function journal(): RecordValue[] {
  if (!sessionFile || !existsSync(sessionFile)) return [];
  // A filesystem notification can arrive during an append; only parse complete JSONL rows.
  return readFileSync(sessionFile, "utf8").split("\n").slice(0, -1).filter(Boolean).map(line => JSON.parse(line));
}
function goalRecords(rows: RecordValue[]): RecordValue[] {
  return rows.filter(row => row.type === "mode_change" && row.mode === "goal" && row.data?.goal);
}
const root = mkdtempSync(join(tmpdir(), "omo-ulw-goal-tui-"));
let terminal: Bun.Terminal | undefined;
let child: Bun.Subprocess | undefined;
let server: Bun.Server<undefined> | undefined;
let watcher: FSWatcher | undefined;
try {
  const cwd = join(root, "work");
  const sessions = join(root, "sessions");
  const configRoot = join(root, "config");
  const agentDir = join(configRoot, "agent");
  for (const path of [cwd, sessions, agentDir]) mkdirSync(path, { recursive: true });
  const config = join(root, "probe.yml");
  writeFileSync(config, "goal:\n  enabled: true\ncompaction:\n  enabled: false\nstartup:\n  setupWizard: false\n  quiet: true\n");
  watcher = watch(sessions, { recursive: true }, () => {
    try { events.emit("journal", { rows: journal() }); } catch (error) { fail(error); }
  });
  watcher.on("error", fail);
  server = Bun.serve({
    hostname: "127.0.0.1", port: 0, idleTimeout: 0,
    async fetch(request) {
      try {
        const path = new URL(request.url).pathname;
        if (request.method !== "POST") return new Response("POST required", { status: 405 });
        const body = await request.json() as RecordValue;
        if (path === "/events") {
          const event = body.event as RecordValue;
          if (event.type === "session_start") {
            assert.equal(typeof body.sessionFile, "string", "host must allocate a persisted session");
            const location = relative(sessions, body.sessionFile);
            assert(location && !location.startsWith("..") && !location.startsWith("/"), "session must stay in owned session-dir");
            sessionFile = body.sessionFile;
          }
          if (event.type === "goal_updated") goals.push(event);
          if (event.type === "message_end" && event.message?.stopReason === "error") fail(new Error(JSON.stringify(event)));
          events.emit(event.type, event);
          return new Response("ok");
        }
        assert.equal(path, "/v1/chat/completions", "only the local SSE model endpoint is permitted");
        const number = ++requestCount;
        assert(number <= 5, "unexpected continuation or provider retry loop");
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const send = (value: unknown) => controller.enqueue(new TextEncoder().encode(`data: ${typeof value === "string" ? value : JSON.stringify(value)}\n\n`));
            send({ id: `goal-probe-${number}`, object: "chat.completion.chunk", choices: [{ index: 0, delta: { role: "assistant", content: number === 1 ? firstChunk : `ULW-GOAL-STREAM-${number}` }, finish_reason: null }] });
            streams.set(number, () => {
              streams.delete(number);
              send({ id: `goal-probe-${number}`, object: "chat.completion.chunk", choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
              send("[DONE]");
              controller.close();
            });
          },
          cancel() { streams.delete(number); },
        });
        events.emit("provider", { number, body });
        // Drain only already-queued goal steering if the follow-up lands between turns.
        // Stop on its exact provider-request evidence, never on an elapsed delay.
        if (drainingFollowup && !JSON.stringify(body).includes("FOLLOWUP-DO-NOT-REPLACE")) streams.get(number)?.();
        return new Response(stream, { headers: { "content-type": "text/event-stream" } });
      } catch (error) {
        fail(error);
        return new Response(String(error), { status: 500 });
      }
    },
  });
  const started = expectEvent("session_start");
  const streaming = expectEvent("message_update", event => event.assistantMessageEvent?.type === "text_delta" && event.assistantMessageEvent.delta === firstChunk);
  terminal = new Bun.Terminal({
    cols: 120, rows: 40,
    data(_terminal, data) { terminalOutput = (terminalOutput + new TextDecoder().decode(data)).slice(-16000); },
  });
  child = Bun.spawn([
    "omp", "--no-extensions", "-e", join(repo, "index.ts"), "-e", join(repo, "tests/fixtures/ulw-goal-provider.ts"),
    "--model", "omo-ulw-probe/gpt-6.1-sol", "--cwd", cwd, "--session-dir", sessions,
    "--config", config, "--no-tools", "--no-skills", "--no-rules", "--no-title", "--no-lsp",
    "Keep this local model stream open for the terminal input regression.",
  ], {
    cwd, terminal, timeout: 65000, killSignal: "SIGKILL",
    env: {
      ...process.env, TERM: "xterm-256color",
      PI_CONFIG_DIR: configRoot, PI_CODING_AGENT_DIR: agentDir,
      OMO_ULW_PROBE_BASE_URL: `http://127.0.0.1:${server.port}/v1`,
      OMO_ULW_GOAL_EVENTS_URL: `http://127.0.0.1:${server.port}/events`,
      OMO_ULW_PROBE_PROVIDER: "", OMO_ULW_PROBE_MODEL: "gpt-6.1-sol", OMO_ULW_PROBE_CONTINUATION: "",
    },
    onExit(_child, code, signal, error) { if (!stopping) fail(error ?? new Error(`TUI exited early: ${code}/${signal}`)); },
  });
  await started;
  await streaming; // Actual decoded model delta: startup/editor initialization has finished.
  assert.equal(requestCount, 1);
  assert.equal(goals.filter(event => event.goal).length, 0, "bootstrap must not create a goal");
  const initialGoalEvents = goals.length;

  phase = "creating native goal during an existing model turn";
  const created = expectEvent("goal_updated", event => event.goal?.status === "active");
  const persisted = expectEvent("journal", event => goalRecords(event.rows).some(row => row.data.goal.objective === objective));
  terminal.write(`/${objective}\r`);
  const creation = await created;
  assert.equal(creation.goal.objective, objective, "native goal must retain the entire normalized /ulw objective");
  assert.equal(creation.state?.enabled, true);
  assert.equal(typeof creation.goal.id, "string");
  assert(streams.has(1), "goal must be created before the original stream finishes");

  const goalRequest = expectEvent("provider", event => event.number > 1);
  streams.get(1)!();
  const next = await goalRequest;
  // Persistence may be deferred until the initial assistant message completes.
  events.emit("journal", { rows: journal() });
  await persisted;
  assert(JSON.stringify(next.body).includes("END-OF-GOAL"), "goal objective must reach the next real provider turn");

  phase = "preserving native goal across later /ulw input";
  const admitted = expectEvent("input", event => event.source === "interactive" && event.text === `/${followup}`);
  const followed = expectEvent("provider", event => JSON.stringify(event.body).includes("FOLLOWUP-DO-NOT-REPLACE"));
  const savedFollowup = expectEvent("journal", event => event.rows.some((row: RecordValue) => row.type === "message" && row.message?.role === "user" && JSON.stringify(row.message.content).includes("FOLLOWUP-DO-NOT-REPLACE")));
  terminal.write(`/${followup}\r`);
  await admitted;
  drainingFollowup = true;
  streams.get(next.number)?.();
  await followed;
  events.emit("journal", { rows: journal() });
  await savedFollowup;
  const records = goalRecords(journal());
  assert(records.length > 0, "success requires a persisted native mode_change, not an ULW policy marker");
  for (const row of records) {
    assert.equal(row.data.goal.id, creation.goal.id, "follow-up must not replace native goal identity");
    assert.equal(row.data.goal.objective, objective, "follow-up must not replace the objective");
  }
  for (const event of goals.slice(initialGoalEvents)) {
    assert.equal(event.goal?.id, creation.goal.id, "native goal must not be dropped or replaced");
    assert.equal(event.goal?.objective, objective);
    assert.equal(event.goal?.status, "active");
  }
  console.log(JSON.stringify({ status: "PASS", requests: requestCount, goalId: creation.goal.id, objective, nativeGoalEvents: goals.length, persistedGoalRecords: records.length, scenarios: ["PTY /ulw during active stream", "persisted mode_change goal", "later /ulw preserves goal"] }));
} catch (error) {
  console.error(`TUI goal probe failed at ${phase}\n${terminalOutput}`);
  throw error;
} finally {
  stopping = true;
  clearTimeout(timer);
  process.off("SIGINT", interrupted);
  process.off("SIGTERM", interrupted);
  watcher?.close();
  try {
    if (child && child.exitCode === null) child.kill("SIGKILL");
    if (child) await child.exited;
  } finally {
    try {
      terminal?.close();
    } finally {
      try { await server?.stop(true); } finally {
        rmSync(root, { recursive: true, force: true });
        assert(!existsSync(root), "owned probe directory must be removed");
      }
    }
  }
}
console.log(JSON.stringify({ cleanup: "owned OMP exited; terminal and server closed; probe directory removed" }));
