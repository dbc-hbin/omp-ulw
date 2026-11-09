import { afterEach, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { designOriginals, repositoryRoot, thirdPartyMaterializeMap, upstreamNames } from "./frontend-refs-manifest.mjs";
import { FrontendMaterializationError, materializeFrontendRefs } from "./materialize-frontend-refs.mjs";

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function git(root, ...args) {
  return execFileSync("git", ["-C", root, "-c", "user.name=Materializer Test", "-c", "user.email=materializer@example.invalid", ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function put(root, path, content) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

// Real Git repositories exercise source pinning and initialization, without network or production writes.
function fixture({ omit, contents = new Map() } = {}) {
  const root = mkdtempSync(join(tmpdir(), "frontend-materializer-"));
  roots.push(root);
  git(root, "init", "--quiet");
  for (const name of upstreamNames) {
    const module = join(root, "upstream", "skills", name);
    mkdirSync(module, { recursive: true });
    git(module, "init", "--quiet");
  }
  for (const { upstream, source } of Object.values(thirdPartyMaterializeMap())) {
    const key = `${upstream}/${source}`;
    if (key !== omit) put(root, `upstream/skills/${key}`, contents.get(key) ?? Buffer.from(`${key}\r\n\0\xff`, "latin1"));
  }
  for (const name of upstreamNames) {
    const module = join(root, "upstream", "skills", name);
    git(module, "add", ".");
    git(module, "commit", "--quiet", "-m", "Fixture source");
    git(root, "update-index", "--add", "--cacheinfo", `160000,${git(module, "rev-parse", "HEAD")},upstream/skills/${name}`);
  }
  return { root, targetRoot: join(root, "deployment", "skills", "frontend") };
}

function expectFailure(action, code, paths) {
  let failure;
  try {
    action();
  } catch (error) {
    if (!(error instanceof FrontendMaterializationError)) throw error;
    failure = error;
  }
  expect(failure?.code).toBe(code);
  if (paths) expect(failure?.paths).toEqual(paths);
}

test("Git stores source pins and OMP guides instead of generated reference bodies", () => {
  const tracked = new Set(git(repositoryRoot, "ls-files", "--", "skills/frontend").split("\n"));
  const generated = Object.keys(thirdPartyMaterializeMap()).map(path => `skills/frontend/${path}`);
  const gitlinks = git(repositoryRoot, "ls-files", "--stage", "--", "upstream/skills").split("\n");

  expect(generated.filter(path => tracked.has(path))).toEqual([]);
  for (const guide of designOriginals) expect(tracked.has(`skills/frontend/references/design/${guide}`)).toBe(true);
  expect(tracked.has("skills/frontend/references/ui-ux-db/README.md")).toBe(true);
  expect(gitlinks.map(line => line.match(/^160000 [0-9a-f]{40,64} 0\tupstream\/skills\/([^/]+)$/)?.[1]).sort())
    .toEqual([...upstreamNames].sort());
});

test("materializes allowlisted source bytes into an offline tree and preserves unowned files", () => {
  const { root, targetRoot } = fixture();
  const retained = ["references/ui-ux-db/README.md", "references/ui-ux-db/data/local.csv", "references/design/README.md", "references/designpowers/vendor/local-notes.txt"];
  for (const path of retained) put(targetRoot, path, `local:${path}`);

  const result = materializeFrontendRefs({ repoRoot: root, targetRoot });

  const map = thirdPartyMaterializeMap();
  expect(result.materialized).toBe(Object.keys(map).length);
  for (const [target, { upstream, source }] of Object.entries(map)) {
    expect(readFileSync(join(targetRoot, target))).toEqual(readFileSync(join(root, "upstream", "skills", upstream, source)));
  }
  for (const path of retained) expect(readFileSync(join(targetRoot, path), "utf8")).toBe(`local:${path}`);
  expect(existsSync(join(targetRoot, "references/designpowers/vendor/skills/accessible-content/SKILL.md"))).toBe(false);
  expect(existsSync(join(root, "skills"))).toBe(false);
});

test("refuses an uninitialized submodule before creating output", () => {
  const { root, targetRoot } = fixture();
  rmSync(join(root, "upstream/skills/designpowers"), { recursive: true });

  expectFailure(() => materializeFrontendRefs({ repoRoot: root, targetRoot }), "uninitialized", ["upstream/skills/designpowers"]);

  expect(existsSync(targetRoot)).toBe(false);
});

test("validates the final source before changing an existing output", () => {
  const missing = "designpowers/agents/motion-designer.md";
  const { root, targetRoot } = fixture({ omit: missing });
  put(targetRoot, "references/design/airbnb.md", "previous generated revision");

  expectFailure(() => materializeFrontendRefs({ repoRoot: root, targetRoot }), "missing-source", [join(root, "upstream/skills", missing)]);

  expect(readdirSync(join(targetRoot, "references/design"))).toEqual(["airbnb.md"]);
  expect(readFileSync(join(targetRoot, "references/design/airbnb.md"), "utf8")).toBe("previous generated revision");
});

test.each(["tracked", "untracked"])("refuses %s source edits without changing output", (kind) => {
  const { root, targetRoot } = fixture();
  put(root, `upstream/skills/open-design/${kind === "tracked" ? "design-systems/apple/DESIGN.md" : "local.txt"}`, "local source edit");

  expectFailure(() => materializeFrontendRefs({ repoRoot: root, targetRoot }), "dirty-source", ["upstream/skills/open-design"]);

  expect(existsSync(targetRoot)).toBe(false);
});

test("uses the recorded gitlink rather than a different clean source HEAD", () => {
  const { root, targetRoot } = fixture();
  const module = join(root, "upstream/skills/open-design");
  put(module, "design-systems/apple/DESIGN.md", "new clean revision");
  git(module, "add", ".");
  git(module, "commit", "--quiet", "-m", "Unpinned revision");

  expectFailure(() => materializeFrontendRefs({ repoRoot: root, targetRoot }), "pin-mismatch", ["upstream/skills/open-design"]);

  expect(existsSync(targetRoot)).toBe(false);
});

test("explicit regeneration replaces owned outputs while preserving the OMP guide", () => {
  const { root, targetRoot } = fixture();
  const target = "references/designpowers/vendor/agents/motion-designer.md";
  put(targetRoot, target, "old generated revision");
  put(targetRoot, "references/ui-ux-db/README.md", "OMP guide");

  materializeFrontendRefs({ repoRoot: root, targetRoot });

  expect(readFileSync(join(targetRoot, target))).toEqual(readFileSync(join(root, "upstream/skills/designpowers/agents/motion-designer.md")));
  expect(readFileSync(join(targetRoot, "references/ui-ux-db/README.md"), "utf8")).toBe("OMP guide");
});

test.each(["file", "root"])("rejects a generated destination symlink at its %s before replacing output", (kind) => {
  const { root, targetRoot } = fixture();
  const target = kind === "root" ? targetRoot : join(targetRoot, "references/designpowers/vendor/agents/motion-designer.md");
  const unowned = join(root, "unowned");
  if (kind === "root") mkdirSync(unowned);
  else writeFileSync(unowned, "keep this file");
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(unowned, target);

  expectFailure(() => materializeFrontendRefs({ repoRoot: root, targetRoot }), "output-path", [target]);

  if (kind === "root") expect(readdirSync(unowned)).toEqual([]);
  else expect(readFileSync(unowned, "utf8")).toBe("keep this file");
});

test.each([
  ["plain colon", "description: Use when: designing", 'description: "Use when: designing"'],
  ["quoted", 'description: "Already: quoted"', 'description: "Already: quoted"'],
  ["block", "description: |\n  Multiline: text", "description: |\n  Multiline: text"],
  ["flow", "description: [first, second]", "description: [first, second]"],
])("normalizes only eligible designpowers frontmatter (%s)", (_name, description, expected) => {
  const source = `---\nname: fixture\n${description}\n---\n\ndescription: Body stays: unchanged\n`;
  const { root, targetRoot } = fixture({ contents: new Map([
    ["designpowers/skills/accessible-content/SKILL.md", source],
    ["taste-skill/skills/taste-skill/SKILL.md", source],
  ]) });

  materializeFrontendRefs({ repoRoot: root, targetRoot });

  expect(readFileSync(join(targetRoot, "references/designpowers/vendor/skills/accessible-content/reference.md"), "utf8"))
    .toBe(`---\nname: fixture\n${expected}\n---\n\ndescription: Body stays: unchanged\n`);
  expect(readFileSync(join(targetRoot, "references/design/taste-skill.md"), "utf8")).toBe(source);
});

test("suppresses sibling-import bytecode and regenerates repeatably from the source", () => {
  const source = '#!/usr/bin/env python3\nimport argparse\nfrom core import search\nfrom design_system import generate_design_system\n';
  const { root, targetRoot } = fixture({ contents: new Map([["ui-ux-pro-max/src/ui-ux-pro-max/scripts/search.py", source]]) });

  materializeFrontendRefs({ repoRoot: root, targetRoot });
  materializeFrontendRefs({ repoRoot: root, targetRoot });

  expect(readFileSync(join(targetRoot, "references/ui-ux-db/scripts/search.py"), "utf8"))
    .toBe('#!/usr/bin/env python3\nimport argparse\nimport sys\nsys.dont_write_bytecode = True\nfrom core import search\nfrom design_system import generate_design_system\n');
});
