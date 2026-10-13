export interface HostPrompt {
  blocks: string[];
  originalBehavior: string;
}

/** Replace only the known default template; custom prompts and agent blocks remain owned by their authors. */
export function replaceHostBehavior(blocks: string[], behavior: string): HostPrompt | undefined {
  const base = blocks[0];
  if (!base || /<om[op]-model-preset>/.test(base)) return undefined;
  const role = base.indexOf("\n§ Role\n");
  const runtime = base.indexOf("\n§ Runtime\n", role);
  const policy = base.indexOf("\n§ Tool Policy\n", runtime);
  const io = base.indexOf("\n# Tool I/O\n", policy);
  const delegation = base.indexOf("\n# Delegation\n", io);
  const workflow = base.indexOf("\n§ Workflow\n", io);
  const protocolEnd = delegation >= 0 ? delegation : workflow;
  if (role < 0 || runtime <= role || policy <= runtime || io <= policy || protocolEnd <= io || workflow <= policy) return undefined;
  // ponytail: template section boundaries, leave unfamiliar/custom templates untouched rather than deleting unknown instructions.
  const originalBehavior = base.slice(role, runtime) + base.slice(policy, io) + base.slice(protocolEnd);
  const host = base.slice(0, role) + "\n" + behavior + "\n" + base.slice(runtime, policy) + "\n§ Tool Policy\n" + base.slice(io, protocolEnd);
  return { blocks: [host, ...blocks.slice(1)], originalBehavior };
}
