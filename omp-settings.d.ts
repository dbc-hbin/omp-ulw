// Host-provided exports consumed by the extension (OMP 18.19).
// These declarations have no runtime implementation or package dependency.
declare module "@oh-my-pi/pi-coding-agent/config/registry" {
  export interface Setting {
    get(scope: object): unknown;
    provenance(scope: object): string;
    override(scope: object, value: unknown): void;
    clearOverride(scope: object): void;
  }
  export function lookup(id: string): Setting | undefined;
}

declare module "@oh-my-pi/pi-coding-agent/config/settings" {
  export function findScopedSettings(cwd?: string, agentDir?: string): object | undefined;
}
