import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { resolveSafeDocPath, scaffold } from "./skills/ulw-plan/scripts/scaffold-plan.mjs";

const root = resolve("skills");

test("plan scaffolding uses doc, preserves existing files and rejects unsafe paths", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "workflow-doc-"));
  try {
    mkdirSync(join(cwd, "doc"));
    writeFileSync(join(cwd, "doc/guide.md"), "Existing documentation");
    const options = { slug: "storage", intent: "clear", reviewRequired: true };
    expect(await scaffold(cwd, { ...options, draftOnly: true })).toEqual([{ relPath: "doc/drafts/storage.md", status: "created" }]);
    expect(existsSync(join(cwd, "doc/plans"))).toBe(false);
    expect(readFileSync(join(cwd, "doc/drafts/storage.md"), "utf8").match(/^plan_path: (.+)$/m)?.[1]).toBe("doc/plans/storage.md");
    expect(await scaffold(cwd, options)).toEqual([{ relPath: "doc/drafts/storage.md", status: "exists" }, { relPath: "doc/plans/storage.md", status: "created" }]);
    expect((await scaffold(cwd, options)).every(result => result.status === "exists")).toBe(true);
    expect(readFileSync(join(cwd, "doc/guide.md"), "utf8")).toBe("Existing documentation");
    expect(existsSync(join(cwd, ".omo"))).toBe(false);
    for (const path of ["../doc/plans/escape.md", "src/doc/plans/escape.md", "doc/../escape.md", ".omo/plans/old.md", "doc/plans/invalid.json"]) expect(() => resolveSafeDocPath(cwd, path)).toThrow();
    const cli = Bun.spawnSync(["node", resolve("skills/ulw-plan/scripts/scaffold-plan.mjs"), "storage", "--stdout", "--review-required"], { cwd });
    expect(cli.exitCode).toBe(0);
    const output = JSON.parse(cli.stdout.toString());
    expect(output.draft.path).toBe("doc/drafts/storage.md");
    expect(output.plan.path).toBe("doc/plans/storage.md");
    rmSync(join(cwd, "doc/plans"), { recursive: true });
    mkdirSync(join(cwd, "outside"));
    symlinkSync(join(cwd, "outside"), join(cwd, "doc/plans"));
    await expect(scaffold(cwd, options)).rejects.toThrow(/symlink/);
    expect(readdirSync(join(cwd, "outside"))).toEqual([]);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

test("registered skill metadata and relative resource links resolve inside the shipped tree", () => {
  const names = new Set<string>();
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(root, entry.name, "SKILL.md");
    const source = readFileSync(path, "utf8");
    const name = /^name:\s*["']?([^\r\n"']+)/m.exec(source)?.[1];
    expect(name).toBe(entry.name);
    expect(names.has(name!)).toBe(false);
    names.add(name!);
    expect(/^description:\s*\S/m.test(source)).toBe(true);
  }
  for (const path of new Bun.Glob("**/*.md").scanSync({ cwd: root, absolute: true })) {
    const source = readFileSync(path, "utf8").replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "").replace(/`[^`\n]*`/g, "");
    for (const match of source.matchAll(/\[[^\]\n]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1].split("#")[0];
      if (!target || /^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith("/")) continue;
      expect({ path, target, exists: existsSync(resolve(dirname(path), decodeURIComponent(target))) }).toEqual({ path, target, exists: true });
    }
  }
});

test("workflow templates resolve their skill resources relative to the template", () => {
  for (const name of ["ulw-plan", "ulw-execute", "ulw-loop", "ulw-research", "mass-ulw"]) {
    const template = new URL(`./prompts/${name}.md`, import.meta.url);
    const source = readFileSync(template, "utf8");
    const target = source.split("`")[1];
    expect(target).toBe(`../skills/${name}/SKILL.md`);
    expect(existsSync(new URL(target!, template))).toBe(true);
  }
});

test("shipped TUI evidence CLI measures ANSI CJK widths and rejects invalid dimensions", () => {
  const directory = mkdtempSync(join(tmpdir(), "omo-skill-cli-"));
  try {
    const capture = join(directory, "capture.txt");
    writeFileSync(capture, "\u001b[31m한글\u001b[0m\nabcde\n");
    const result = Bun.spawnSync(["node", "skills/visual-qa/scripts/visual-qa.mjs", "tui-check", capture, "--cols", "4"]);
    expect(result.exitCode).toBe(0);
    const data: unknown = JSON.parse(result.stdout.toString());
    expect(data).toMatchObject({ maxWidth: 5, lineWidths: [4, 5], overflowLines: [{ line: 2, width: 5 }], wideCharColumns: [0, 2], hasAnsi: true });
    const invalid = Bun.spawnSync(["node", "skills/visual-qa/scripts/visual-qa.mjs", "tui-check", capture, "--cols", "0"]);
    expect(invalid.exitCode).toBe(1);
    const png = join(directory, "pixel.png");
    writeFileSync(png, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==", "base64"));
    const identical = Bun.spawnSync(["node", "skills/visual-qa/scripts/visual-qa.mjs", "image-diff", png, png]);
    expect(identical.exitCode).toBe(0);
    expect(JSON.parse(identical.stdout.toString())).toMatchObject({ dimensionsMatch: true, totalPixels: 1, diffPixels: 0, similarityScore: 100, alphaChannelIntact: true });
    writeFileSync(capture, "not a PNG");
    const malformed = Bun.spawnSync(["node", "skills/visual-qa/scripts/visual-qa.mjs", "image-diff", capture, capture]);
    expect(malformed.exitCode).toBe(1);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("session discovery finds middle prompts across products and respects platform and child scope", () => {
  const directory = mkdtempSync(join(tmpdir(), "omp-session-discovery-"));
  const home = join(directory, "home");
  const logs = join(directory, "logs");
  const script = resolve("skills/coding-agent-sessions/scripts/find-agent-sessions.py");
  const timestamp = "2026-06-01T00:00:00.000Z";
  const prompts = ["start the task", "needle-middle-only", "finish the task"];
  try {
    mkdirSync(home);
    const codex = (id: string, parent?: string) => [
      { timestamp, type: "session_meta", payload: {
        id, timestamp, cwd: "/repo/discovery", model_provider: "openai",
        source: parent ? { subagent: { thread_spawn: { parent_thread_id: parent, depth: 1 } } } : "cli",
      } },
      ...prompts.map(text => ({ timestamp, type: "response_item", payload: {
        type: "message", role: "user", content: [{ type: "input_text", text }],
      } })),
    ];
    for (const [path, rows] of [
      [join(logs, "sessions/rollout-codex-main.jsonl"), codex("codex-main")],
      [join(logs, "sessions/rollout-codex-child.jsonl"), codex("codex-child", "codex-main")],
      [join(logs, "projects/work/claude-main.jsonl"), prompts.map(content => ({
        sessionId: "claude-main", type: "user", timestamp, cwd: "/repo/discovery", message: { role: "user", content },
      }))],
    ] as const) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, rows.map(row => JSON.stringify(row)).join("\n") + "\n");
    }
    writeFileSync(join(logs, "projects/work/incomplete.jsonl"), '{"type":');
    const run = (...args: string[]) => Bun.spawnSync(["python3", "-B", script, ...args, "--root", logs], {
      env: {
        ...process.env, HOME: home, CODEX_HOME: join(home, ".codex"), CLAUDE_CONFIG_DIR: join(home, ".claude"),
        OPENCODE_HOME: join(home, ".opencode"), APPDATA: join(home, "appdata"), XDG_DATA_HOME: join(home, ".local/share"),
      },
    });
    const found = run("find", "needle-middle-only", "--platform", "codex", "--platform", "claude");
    expect(found.exitCode).toBe(0);
    const matches = JSON.parse(found.stdout.toString()).results;
    expect(matches.map((item: { id: string }) => item.id).sort()).toEqual(["claude-main", "codex-main"]);
    for (const match of matches) expect(match.match_reasons).toContainEqual(expect.objectContaining({
      query: "needle-middle-only", field: "user_message", snippet: "needle-middle-only",
    }));
    const scoped = run("search", "--query", "needle-middle-only", "--platform", "codex");
    expect(scoped.exitCode).toBe(0);
    expect(JSON.parse(scoped.stdout.toString()).results.map((item: { id: string }) => item.id)).toEqual(["codex-main"]);
    const children = run("find", "needle-middle-only", "--platform", "codex", "--include-subagents");
    expect(children.exitCode).toBe(0);
    expect(JSON.parse(children.stdout.toString()).results.map((item: { id: string }) => item.id).sort()).toEqual(["codex-child", "codex-main"]);
    const consultation = run("read", "codex-main");
    expect(consultation.exitCode).toBe(2);
    expect(consultation.stdout.toString()).toBe("");
    expect(existsSync(join(dirname(script), "agent_sessions/__pycache__"))).toBe(false);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
