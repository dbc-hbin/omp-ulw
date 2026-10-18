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
  const workflow = base.indexOf("\n§ Workflow\n", policy);
  if (role < 0 || runtime <= role || policy <= runtime || workflow <= policy) return undefined;
  // Replace only the role body. Everything from Runtime onward is host-owned,
  // including Tool Policy's # General and all delegation/workflow/delivery,
  // memory, completion, and critical sections. Prefix context in block 0 is
  // host/project-owned too and remains before the role.
  const roleBodyStart = role + "\n§ Role\n".length;
  const originalBehavior = base.slice(roleBodyStart, runtime);
  const host = base.slice(0, roleBodyStart) + behavior + "\n" + base.slice(runtime);
  return { blocks: [host, ...blocks.slice(1)], originalBehavior };
}
