import { ulwRequest, visibleUlwText } from "./ulw";
import type { Setting } from "@oh-my-pi/pi-coding-agent/config/registry";

type TaskIntent = "restricted" | "implementation";
interface PrewalkContext { cwd: string; agent: { kind: "main" | "sub" } }
export interface PrewalkApi {
  on(event: "session_start" | "session_switch" | "session_branch" | "session_tree" | "session_shutdown", handler: (event: unknown, ctx: PrewalkContext) => void | Promise<void>): void;
  on(event: "before_agent_start", handler: (event: { prompt: string; reason?: "prompt" | "revive" }, ctx: PrewalkContext) => void | Promise<void>): void;
}

export function registerPrewalk(pi: PrewalkApi): void {
  let scope: object | undefined;
  let controls: Array<{ setting: Setting; muted: unknown; previous?: { value: unknown; runtime: boolean } }> = [];
  const restore = () => {
    if (!scope) return;
    for (const control of controls) {
      const { setting, previous } = control;
      if (!previous) continue;
      // A later operator/extension value takes ownership; never overwrite it.
      if (setting.provenance(scope) === "runtime" && Object.is(setting.get(scope), control.muted)) {
        if (previous.runtime) setting.override(scope, previous.value);
        else setting.clearOverride(scope);
      }
      control.previous = undefined;
    }
  };
  pi.on("session_start", async (_event, ctx) => {
    if (ctx.agent.kind !== "main") return;
    restore();
    const [{ lookup }, { findScopedSettings }] = await Promise.all([
      import("@oh-my-pi/pi-coding-agent/config/registry"),
      import("@oh-my-pi/pi-coding-agent/config/settings"),
    ]);
    // api.pi.settings is global. Bind the concrete session instance while the
    // host runner's active-settings scope is available, including SDK sessions.
    scope = findScopedSettings(ctx.cwd);
    const auto = lookup("prewalk.auto");
    const enabled = lookup("prewalk.enabled");
    if (!scope || !auto || !enabled) throw new Error("OMP prewalk control requires the OMP 18.19 session settings API.");
    controls = [{ setting: auto, muted: "off" }, { setting: enabled, muted: false }];
    await Promise.resolve();
  });
  for (const event of ["session_switch", "session_branch", "session_tree", "session_shutdown"] as const) {
    pi.on(event, (_event, ctx) => {
      if (ctx.agent.kind !== "main") return;
      restore();
      return Promise.resolve();
    });
  }
  pi.on("before_agent_start", (event, ctx) => {
    if (ctx.agent.kind !== "main" || event.reason === "revive" || !scope) return;
    const intent = prewalkIntent(event.prompt);
    if (!intent) return;
    if (intent === "implementation") restore();
    else for (const control of controls) {
      const { setting, muted } = control;
      const value = setting.get(scope);
      if (Object.is(value, muted)) continue;
      control.previous = { value, runtime: setting.provenance(scope) === "runtime" };
      setting.override(scope, muted);
    }
    // Registry listeners coalesce in a microtask; disarm/rearm before delivery.
    return Promise.resolve();
  });
}

/** Explicit task scope only; ambiguous input and continuations retain the current scope. */
export function prewalkIntent(prompt: string): TaskIntent | undefined {
  const request = ulwRequest(prompt.replace(/^\s*\/goal\s+/i, ""));
  const text = visibleUlwText(request.text.slice(request.invocationLength))
    .replace(/(?<!\w)'[^'\r\n]+'(?!\w)/g, "")
    .replace(/\b(?:do\s+not|don['\u2019]t|never)\s+(?:just|only)\s+(?:explain|investigate|research|plan)\b/gi, "")
    .replace(/(?:설명|분석|조사|연구|계획)만\s*하지\s*말고/g, "").trim();
  const noEdits = /\b(?:without|no)\s+(?:any\s+)?(?:(?:code|source)\s+)?(?:edits?|changes?|implementation)\b(?!\s+(?:to|in|outside|beyond|except)\b)/i.test(text) ||
    /\b(?:do\s+not|don['\u2019]t|never)\s+(?:edit|modify|change|implement|fix)(?:\s+(?:(?:any|the)\s+)?(?:code|files?|source(?:\s+code)?|anything|it|changes?))?(?=\s*(?:(?:yet|please|at\s+all|(?:for|right)\s+now|(?:at|in)\s+(?:this|the|current)\s+(?:stage|step|phase|turn|moment)|(?:until|before|while|during)\b[^.!?;,\n]*)\s*)?(?:[.!?;,\n]|$))/i.test(text) ||
    /(?:^|[.!?;,\n]\s*)(?:(?:(?:코드|파일)(?:는|은|을|를)?|아직|지금은|당장은|현재는|절대)\s*)*(?:(?:수정|변경|구현|편집)(?:은|는|을|를)?\s*(?:하지\s*(?:말|마)|없이|금지)|(?:건드리지|바꾸지|고치지)\s*(?:말|마))/.test(text);
  if (noEdits) return "restricted";
  const executeAfter = /\b(?:then|and|afterwards?)\s+(?:please\s+)?(?:implement|fix|build|execute|apply)\b/i.test(text) ||
    /(?:세우고|수립하고|작성하고|계획하고|그다음|이후에?|후에?)\s*(?:구현|수정|실행|적용)(?:해|하)/.test(text);
  if ((request.workflow === "ulw-plan" || request.workflow === "ulw-research") && !executeAfter) return "restricted";
  const implementation = /(?:^|[.!?;,\n]\s*|\b(?:and|then|please|can\s+you|could\s+you|help\s+me|I\s+(?:want|need)\s+(?:you\s+)?to)\s+)(?:fix|implement|build|add|remove|update|refactor|improve|change|apply|clean\s+up)\b/i.test(text) ||
    /(?:구현|수정|개선|추가|변경|리팩터링|정리|적용|반영)(?:해(?:\s*(?:줘|주세요|봐|줄래))?|하(?:자|라|세요))(?=$|[\s.!?,]|줘|주세요)|(?:고쳐|만들어)(?:\s*(?:줘|주세요|봐|라|줄래))?(?=$|[\s.!?,])/.test(text);
  if (implementation || executeAfter) return "implementation";
  const readOnly = /\b(?:(?:just|only)\s+(?:explain|investigate|research|review|plan|analy[sz]e)|(?:investigat(?:e|ion)|explain|research|review|plan(?:ning)?|analysis)\s*[- ]only)\b/i.test(text) ||
    /(?:^|[.!?;\n]\s*)(?:(?:please|can\s+you|could\s+you)\s+)?(?:explain|investigate|research|review|analy[sz]e|plan)\b|\bwhat\s+do\s+you\s+think\b/i.test(text) ||
    /(?:설명|분석|조사|연구|검토|리뷰|평가)(?:만)?\s*(?:해|하(?:자|라|세요))|(?:계획만|계획을)\s*(?:세워|수립|작성)|(?:원인|결과|내용|이유)만\s*(?:알려|분석|설명)|어떻게\s*생각/.test(text);
  if (readOnly) return "restricted";
  return request.workflow === "ulw-execute" || request.workflow === "refactor" ? "implementation" : undefined;
}

/** Native identities only: user text and tool output must never be rewritten. */
export function adaptPrewalkNotice(customType: string, content: string): string {
  if (customType === "prewalk-plan") {
    return "Prewalk checkpoint: follow the user's current scope and the active model preset. Reuse the approved plan, existing todo and selected workflow state. For authorized implementation, plan unresolved work to the detail it needs, update todo when useful, and continue. Do not force a fresh plan, a fixed todo count, or repeated investigation. Investigation, explanation and planning requests end with their requested deliverable; a planning artifact or model handoff does not authorize implementation.";
  }
  if (customType === "prewalk-continue") {
    return "Continue only the remaining work authorized by the current request, using the existing plan, todo and workflow state. If the requested deliverable is complete, stop.";
  }
  if (customType === "prewalk-checklist") {
    return "Before finishing, follow the active model preset's verification rules. Check affected callers and the relevant tests for changes made; reuse valid evidence and report any unrun checks. Keep verification within the requested scope and preserve unrelated work.";
  }
  return content;
}
