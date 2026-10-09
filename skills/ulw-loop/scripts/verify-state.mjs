#!/usr/bin/env node
// Read-only checkpoint validation. No SDK, state mutation, or external packages.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync, lstatSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const fail = (message) => { throw new Error(message); };
const json = (path) => JSON.parse(readFileSync(path, "utf8"));

export function snapshot(cwd = process.cwd(), inputs) {
 if (inputs !== undefined) {
  if (!Array.isArray(inputs) || !inputs.length || !inputs.every(text)) fail("explicit capture inputs must be nonempty paths");
  const digest = createHash("sha256");
  for (const path of [...inputs].sort()) {
   digest.update(path + "\0");
   const file = artifact(path, cwd);
   if (lstatSync(file).isSymbolicLink()) fail("capture input is a symlink: " + path);
   digest.update(readFileSync(file));
  }
  return { tree: "explicit-files", worktree_diff: digest.digest("hex"), capture_cwd: realpathSync(cwd), capture_inputs: inputs };
 }
 const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
 const tree = git("rev-parse", "HEAD^{tree}").trim();
 const digest = createHash("sha256");
 const artifacts = ["doc/drafts", "doc/plans", "doc/evidence", "doc/ulw-loop", "doc/ulw-execute", "doc/ulw-research", "doc/mass-ulw", "doc/frontend-design", "doc/boulder.json", "doc/init-deep.json"];
 digest.update(git("diff", "--binary", "HEAD", "--", ".", ...artifacts.map((path) => ":(exclude)" + path)));
 const paths = git("ls-files", "--others", "--exclude-standard", "-z").split("\0").filter((p) => p && !artifacts.some((path) => p === path || p.startsWith(path + "/"))).sort();
 for (const path of paths) {
  digest.update(path + "\0");
  const file = resolve(cwd, path);
  if (lstatSync(file).isSymbolicLink()) fail("untracked evidence input is a symlink: " + path);
  digest.update(readFileSync(file));
 }
 return { tree, worktree_diff: digest.digest("hex"), capture_cwd: realpathSync(cwd) };
}

function artifact(path, cwd) {
 if (!text(path)) fail("missing artifact path");
 const resolved = resolve(cwd, path);
 const stat = statSync(resolved);
 if (!stat.isFile() || stat.size === 0) fail("artifact must be a nonempty file: " + resolved);
 return resolved;
}

export function verify(state, { goalId, gate, cwd = process.cwd() } = {}) {
 if (state.schema_version !== 1 || !text(state.objective) || !text(state.when_to_stop) || !text(state.run_id)) fail("invalid binding goal");
 if (!Array.isArray(state.goals) || state.goals.length === 0) fail("no goals");
 const ids = new Set();
 for (const goal of state.goals) {
  if (!text(goal.id) || ids.has(goal.id)) fail("missing or duplicate goal id");
  ids.add(goal.id);
 }
 const seen = new Set();
 const visiting = new Set();
 const visit = (goal) => {
  if (visiting.has(goal.id)) fail("goal dependency cycle");
  if (seen.has(goal.id)) return;
  visiting.add(goal.id);
  for (const id of goal.depends_on ?? []) {
   const upstream = state.goals.find((g) => g.id === id);
   if (!upstream) fail("unknown goal dependency: " + id);
   visit(upstream);
  }
  visiting.delete(goal.id); seen.add(goal.id);
 };
 state.goals.forEach(visit);
 const selected = gate ? state.goals : state.goals.filter((g) => g.id === goalId);
 if (selected.length === 0) fail("--goal must identify an existing goal");
 const fingerprints = new Map();
 let checked = 0;
 for (const goal of selected) {
  if (!text(goal.objective) || !Array.isArray(goal.criteria) || goal.criteria.length === 0) fail("goal has no observable criteria: " + goal.id);
  for (const dependency of goal.depends_on ?? []) {
   if (state.goals.find((g) => g.id === dependency)?.status !== "complete") fail("goal dependency incomplete: " + dependency);
  }
  const criterionIds = new Set();
  for (const criterion of goal.criteria) {
   if (!text(criterion.id) || criterionIds.has(criterion.id)) fail("missing or duplicate criterion id");
   criterionIds.add(criterion.id);
   if (!gate && criterion.essential === false) continue;
   if (!text(criterion.scenario) || !text(criterion.pass_condition) || !text(criterion.expected_evidence)) fail("criterion lacks observable contract: " + criterion.id);
   if (criterion.status !== "pass" || !text(criterion.evidence)) fail("criterion not proven: " + criterion.id);
   if (!Array.isArray(criterion.artifacts) || criterion.artifacts.length === 0) fail("criterion has no artifacts");
   criterion.artifacts.forEach((path) => artifact(path, cwd));
   artifact(criterion.expected_evidence, cwd);
   if (!Array.isArray(criterion.cleanup) || !criterion.cleanup.length || !criterion.cleanup.every(text)) fail("criterion lacks cleanup receipts");
   if (!Array.isArray(criterion.adversarial_classes) || !criterion.adversarial_classes.length) fail("criterion lacks adversarial outcomes or explicit not-applicable reason");
   for (const entry of criterion.adversarial_classes) {
    if (!text(entry.name) || !(entry.status === "pass" && text(entry.evidence) || entry.status === "not_applicable" && text(entry.reason))) fail("unproven adversarial class");
   }
   const captureCwd = criterion.capture_cwd ?? cwd;
   const key = JSON.stringify([captureCwd, criterion.capture_inputs]);
   if (!fingerprints.has(key)) fingerprints.set(key, snapshot(captureCwd, criterion.capture_inputs));
   const current = fingerprints.get(key);
   if (criterion.tree !== current.tree || criterion.worktree_diff !== current.worktree_diff) fail("stale criterion evidence: " + criterion.id);
   checked++;
  }
 }
 if (gate) {
  const current = snapshot(cwd, gate.capture_inputs);
  if (gate.tree !== current.tree || gate.worktree_diff !== current.worktree_diff) fail("stale final gate");
  if (gate.manualQa?.by !== "main-session" || gate.manualQa?.status !== "passed" || !text(gate.manualQa.evidence)) fail("main-session manual QA missing");
  const surfaces = gate.manualQa.surfaceEvidence;
  if (!Array.isArray(surfaces) || surfaces.length === 0) fail("real-surface evidence missing");
  const criteria = selected.flatMap((goal) => goal.criteria.map((criterion) => ({ id: criterion.id, ref: goal.id + ":" + criterion.id })));
  const proofs = [...surfaces, ...(gate.manualQa.adversarialOutcomes ?? [])];
  for (const criterion of criteria) {
   const unique = criteria.filter((entry) => entry.id === criterion.id).length === 1;
   if (!proofs.some((proof) => proof.verdict === "passed" && (proof.criterionRef === criterion.ref || unique && proof.criterionRef === criterion.id))) fail("criterion has no real-surface proof: " + criterion.ref);
  }
  for (const surface of proofs) {
   if (surface.verdict !== "passed" || !text(surface.invocation ?? surface.scenario) || !text(surface.criterionRef)) fail("invalid surface proof");
   if (!Array.isArray(surface.artifactRefs) || !surface.artifactRefs.length) fail("surface artifacts missing");
   for (const ref of surface.artifactRefs) {
    const record = gate.manualQa.artifactRefs?.find((a) => a.id === ref);
    const kinds = { cli: ["cli-transcript", "log"], tmux: ["cli-transcript", "log"], http: ["http-dump"], browser: ["screenshot", "image"], gui: ["screenshot", "image"], data: ["data-diff"] };
    const allowed = surface.surface === undefined ? Object.values(kinds).flat() : kinds[surface.surface];
    if (!record || !allowed?.includes(record.kind)) fail("invalid surface artifact reference");
    artifact(record.path, cwd);
   }
  }
  if (gate.gateReview?.recommendation !== "APPROVE" || !text(gate.gateReview.by) || !text(gate.gateReview.evidence) || !Array.isArray(gate.gateReview.blockers) || gate.gateReview.blockers.length) fail("independent gate review not approved");
  artifact(gate.gateReview.reportPath, cwd);
  if (gate.iteration?.status !== "passed" || gate.iteration.fullRerun !== true || !text(gate.iteration.evidence) || !Array.isArray(gate.iteration.rerunCommands) || !gate.iteration.rerunCommands.length) fail("final rerun missing");
  if (gate.criteriaCoverage?.totalCriteria !== checked || gate.criteriaCoverage.passCount !== checked || !text(gate.criteriaCoverage.originalIntent) || !text(gate.criteriaCoverage.desiredOutcome) || !text(gate.criteriaCoverage.userOutcomeReview)) fail("final criteria coverage incomplete");
 }
 return { ok: true, criteria_checked: checked };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 try {
  const [path, option, value] = process.argv.slice(2);
  if (path === "snapshot") console.log(JSON.stringify(snapshot(option ?? process.cwd())));
  else if (path === "snapshot-files" && option) console.log(JSON.stringify(snapshot(process.cwd(), json(option))));
  else if (path && (option === "--goal" || option === "--final") && value) console.log(JSON.stringify(verify(json(path), option === "--final" ? { gate: json(value) } : { goalId: value })));
  else fail("usage: verify-state.mjs snapshot [cwd] | snapshot-files <inputs.json> | <goals.json> --goal <id> | <goals.json> --final <quality-gate.json>");
 } catch (error) {
  console.error(error.message); process.exitCode = 1;
 }
}
