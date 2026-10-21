import registerProvider from "./ulw-provider";

interface ProbeContext {
  cwd: string;
  sessionManager: { getSessionId(): string; getSessionFile(): string | undefined };
}
type ProbeApi = Parameters<typeof registerProvider>[0] & {
  on(event: "input" | "goal_updated" | "message_update" | "message_end", handler: (event: Record<string, unknown>, ctx: ProbeContext) => Promise<void>): void;
};

// Observe the real host only: never create a goal, rewrite input, or append records.
export default function probe(pi: ProbeApi): void {
  registerProvider(pi);
  const endpoint = process.env.OMO_ULW_GOAL_EVENTS_URL;
  if (!endpoint) throw new Error("Missing local goal probe event endpoint");
  const url = new URL(endpoint);
  if (url.hostname !== "127.0.0.1" || url.protocol !== "http:") throw new Error("Goal probe requires a loopback endpoint");
  const report = async (event: unknown, ctx: ProbeContext): Promise<void> => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, sessionFile: ctx.sessionManager.getSessionFile() }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Goal probe event delivery failed: ${response.status}`);
  };
  pi.on("session_start", (_event, ctx) => report({ type: "session_start" }, ctx as ProbeContext));
  pi.on("input", report);
  pi.on("goal_updated", report);
  pi.on("message_update", report);
  pi.on("message_end", report);
}
