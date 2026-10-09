interface UpstreamModel { id: string; name?: string; provider?: string; promptPreset?: string }
interface UpstreamOptions { surface: "terminal" | "app"; selectedTools: string[] }
export function resolvePresetName(model: UpstreamModel, settings: { promptPreset: "auto" }): string | undefined;
export function buildPreset(name: string, options: UpstreamOptions): { name: string; prompt: string } | undefined;
export const presetNames: string[];
export const ASYNC_DEFAULT: string;
export const TURN_END_IS_WAIT: string;
export const MONITOR_CONDITIONS: string;
