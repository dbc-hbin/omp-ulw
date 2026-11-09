import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { adapter } from "./adapt-frontend-refs.mjs";
import { repositoryRoot, thirdPartyMaterializeMap, upstreamNames } from "./frontend-refs-manifest.mjs";

export class FrontendMaterializationError extends Error {
  /** @param {string} code @param {readonly string[]} paths @param {string} message */
  constructor(code, paths, message) {
    super(`[materialize] ${message}`);
    this.name = "FrontendMaterializationError";
    this.code = code;
    this.paths = paths;
  }
}

const initialize = "git submodule update --init --recursive";

// The recorded index gitlinks are the source pins; generation never fetches.
/** @param {string} repoRoot */
function validateUpstreams(repoRoot) {
  /** @param {string} cwd @param {readonly string[]} args */
  const git = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const gitlinks = new Map(
    git(repoRoot, ["ls-files", "--stage", "-z", "--", "upstream/skills"])
      .split("\0")
      .flatMap((entry) => {
        const match = /^160000 ([0-9a-f]{40,64}) 0\t(.+)$/.exec(entry);
        return match ? [[match[2], match[1]]] : [];
      }),
  );
  for (const name of upstreamNames) {
    const relative = `upstream/skills/${name}`;
    const root = join(repoRoot, relative);
    if (!gitlinks.has(relative) || !existsSync(join(root, ".git"))) {
      throw new FrontendMaterializationError("uninitialized", [relative], `upstream submodule not initialized: ${relative}; run: ${initialize}`);
    }
    if (git(root, ["rev-parse", "HEAD"]) !== gitlinks.get(relative)) {
      throw new FrontendMaterializationError("pin-mismatch", [relative], `upstream checkout differs from recorded gitlink: ${relative}; preserve local work, then run: ${initialize}`);
    }
    if (git(root, ["status", "--porcelain", "--untracked-files=all"])) {
      throw new FrontendMaterializationError("dirty-source", [relative], `upstream has local changes: ${relative}; preserve them before materializing`);
    }
  }
}

/** @param {string} target @param {string} source @param {Buffer} bytes */
function materializedContent(target, source, bytes) {
  const original = bytes.toString("utf8");
  const adapted = adapter(target, original);
  if (adapted !== original) bytes = Buffer.from(adapted);
  if (target.startsWith("references/designpowers/vendor/skills/") && source.endsWith("/SKILL.md")) {
    const content = bytes.toString("utf8");
    const normalized = content.replace(/^---\r?\n[\s\S]*?\r?\n---(?=\r?\n|$)/, (frontmatter) =>
      frontmatter.replace(/^description:[ \t]+([^\r\n]*)/m, (line, value) => {
        const description = value.trim();
        return !description || /^["'\[\{|>]/.test(description)
          ? line
          : `description: ${JSON.stringify(description)}`;
      }),
    );
    return normalized === content ? bytes : Buffer.from(normalized);
  }
  if (target.startsWith("references/ui-ux-db/scripts/")) {
    // Match OMO's generation transform: sibling imports cannot leave bytecode in the installed skill.
    const content = bytes.toString("utf8");
    const normalized = content.replace(/^(?:from|import) (?:core|design_system|search)\b/m,
      (line) => `import sys\nsys.dont_write_bytecode = True\n${line}`);
    return normalized === content ? bytes : Buffer.from(normalized);
  }
  return bytes;
}

export function materializeFrontendRefs({ repoRoot = repositoryRoot, targetRoot = join(repoRoot, "skills", "frontend") } = {}) {
  validateUpstreams(repoRoot);
  // Validate every input and destination before replacing any generated file.
  const outputs = Object.entries(thirdPartyMaterializeMap()).map(([target, { upstream, source }]) => {
    const sourcePath = join(repoRoot, "upstream", "skills", upstream, source);
    if (!existsSync(sourcePath) || !lstatSync(sourcePath).isFile()) {
      throw new FrontendMaterializationError("missing-source", [sourcePath], `missing upstream source: ${upstream}/${source} for ${target}; run: ${initialize}`);
    }
    const parts = target.split("/");
    // Include targetRoot itself so an explicit staging root cannot redirect writes through a symlink.
    for (let index = 0; index <= parts.length; index++) {
      const path = join(targetRoot, ...parts.slice(0, index));
      const stat = lstatSync(path, { throwIfNoEntry: false });
      if (stat && (stat.isSymbolicLink() || (index === parts.length ? !stat.isFile() : !stat.isDirectory()))) {
        throw new FrontendMaterializationError("output-path", [path], `generated destination is not a regular file path: ${path}`);
      }
    }
    return { target, bytes: materializedContent(target, source, readFileSync(sourcePath)) };
  });
  // Running this command explicitly regenerates manifest-owned outputs only.
  for (const { target, bytes } of outputs) {
    const output = join(targetRoot, target);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, bytes);
  }
  return { materialized: outputs.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--target-root" || !args[1])) {
    throw new FrontendMaterializationError("arguments", args, "usage: bun upstream/materialize-frontend-refs.mjs [--target-root <frontend-directory>]");
  }
  const result = materializeFrontendRefs(args.length ? { targetRoot: resolve(args[1]) } : {});
  console.log(`[materialize] wrote ${result.materialized} frontend reference files from pinned submodules`);
}
