import { ASYNC_DEFAULT, MONITOR_CONDITIONS, TURN_END_IS_WAIT, buildPreset, resolvePresetName } from "./upstream/presets.js";

export interface PresetModel { id: string; name?: string }
export interface PresetOptions { surface: "terminal" | "app"; toolNames: string[] }

export function renderPreset(model: PresetModel, options: PresetOptions): { name: string; prompt: string } | undefined {
  const name = resolvePresetName({ id: model.id, name: model.name }, { promptPreset: "auto" });
  if (!name) return undefined;
  const preset = buildPreset(name, { surface: options.surface, selectedTools: options.toolNames });
  if (!preset) return undefined;
  let prompt = preset.prompt;
  // omp ask is blocking; retain the original ask-last policy, not an unsupported nonblocking call.
  prompt = prompt.replace(/Ask through request_user_input when it is available, with wait_for_answer false so the question rides along while you keep working - true only when an irreversible next step turns on the answer; if it returns no answers, proceed on best judgment\./g,
    "Finish work that does not depend on the answer first. Ask through ask when it is available; ask blocks until answered, so use it only when the remaining work needs the answer. If no answer is supplied, proceed on best judgment where safe.");
  prompt = prompt.replaceAll("request_user_input", "ask").replaceAll("ask_user_question", "ask")
    .replaceAll(" (waitForAnswer true when the next step depends on the answer)", " (ask blocks until answered)");
  if (!options.toolNames.includes("ask")) prompt = prompt.replace(/through ask when it is available/g, "with a direct question");
  // Replace only the original async transport claims; retain its default-background/pending-work policy.
  prompt = prompt.replace(ASYNC_DEFAULT, ASYNC_DEFAULT
    .replace(/\*\*.*?\*\*/, "**ASYNCHRONOUS IS THE DEFAULT FORM OF EVERY CALL THAT OFFERS ONE: BASH SESSIONS START WITH THE RUNTIME'S ASYNC OPTION, LONG COMPUTATIONS RUN THROUGH ASYNC BASH, AND CHILD WORK RUNS THROUGH task - NEVER A FOREGROUND CELL THAT SITS ON A `--watch` OR A SPAWNED PROCESS, NEVER A CHILD TASK SPAWNED TO WATCH.**")
    .replace("Each returns a handle at once and delivers its result later as a message", "Each returns a handle; collect its result later through wait"));
  prompt = prompt.replace(TURN_END_IS_WAIT, TURN_END_IS_WAIT
    .replace("THERE IS NO WAIT TOOL. END YOUR TURN WHEN THE NEXT STEP NEEDS A PENDING RESULT AND A HANDLE WILL WAKE YOU", "USE wait WHEN THE NEXT STEP NEEDS A PENDING RESULT"));
  prompt = prompt.replace(MONITOR_CONDITIONS, MONITOR_CONDITIONS
    .replace(/\*\*.*?\*\* \(a direct `monitor` call only in a session without `eval`\)\./, "**EVERY CONDITION YOU WOULD OTHERWISE WAIT ON GETS AN ASYNC BASH WATCH: START A CONDITION-WATCHING COMMAND THROUGH THE RUNTIME'S ASYNC BASH OPTION AND COLLECT ITS HANDLE THROUGH wait.**")
    .replace("The subscription is the whole cost of the wait and its matching line wakes you; a cell that awaits the wait holds the js kernel until the cell limit kills it.", "The async watch owns the wait; collect its matching result through wait when the next step depends on it, rather than holding a foreground js cell on the watching command.")
    .replace("running session or child", "running session or task"));
  // Grok 4.5 remains an orchestrator, but uses omp workers rather than recursive CLI invocations.
  prompt = prompt.replace(/- \*\*Delegate implementation via `bash`\.\*\* Spawn workers:[^\n]+/g,
    "- **Delegate implementation via `task`.** Spawn independent workers through task, selecting the appropriate supported worker/model through the runtime contract; do not assume a model glob selects a prompting guide. Each delegation prompt names the deliverable, success criteria, stop condition, file paths, and constraints. Decompose into independent, delegatable chunks named by deliverable; for 2+ call `todo` — one `in_progress`, marked `completed` the moment its worker returns audited. Collect worker results through wait.");
  prompt = prompt.replace(/Spawn a separate `omp --print` review invocation/g, "Spawn a separate task review worker");
  return { name: preset.name, prompt };
}
