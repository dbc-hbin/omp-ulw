import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { snapshot, verify } from "./verify-state.mjs";

const workspace = mkdtempSync(join(tmpdir(), "workflow-snapshot-"));
try {
 execFileSync("git", ["clone", "--shared", "--no-checkout", "--quiet", process.cwd(), workspace]);
 const baseline = snapshot(workspace);
 mkdirSync(join(workspace, "doc/evidence"), { recursive: true });
 writeFileSync(join(workspace, "doc/evidence/probe.json"), "{}");
 assert.deepEqual(snapshot(workspace), baseline);
 writeFileSync(join(workspace, "doc/guide.md"), "Product documentation");
 assert.notEqual(snapshot(workspace).worktree_diff, baseline.worktree_diff);
} finally { rmSync(workspace, { recursive: true, force: true }); }

// Uses read-only evidence from this repository; no fixture commits or timers.
const capture = snapshot();
const artifact = new URL("./verify-state.mjs", import.meta.url).pathname;
const filesCapture = snapshot(process.cwd(), [artifact]);
assert.equal(filesCapture.tree, "explicit-files");
assert.deepEqual(filesCapture.capture_inputs, [artifact]);
assert.throws(() => snapshot(process.cwd(), []), /nonempty/);
const criterion = { id: "C1", scenario: "read checkpoint validator", pass_condition: "nonempty source at current working fingerprint", expected_evidence: artifact, essential: true, status: "pass", evidence: "Source artifact observed", artifacts: [artifact], ...capture, cleanup: ["No QA resources spawned"], adversarial_classes: [{ name: "stale_state", status: "pass", evidence: "fresh capture fingerprint" }] };
const state = { schema_version: 1, run_id: "validator-self-check", objective: "Validate evidence", when_to_stop: "All assertions pass", goals: [{ id: "G1", objective: "Verify C1", status: "in_progress", depends_on: [], criteria: [criterion] }] };
assert.deepEqual(verify(state, { goalId: "G1" }), { ok: true, criteria_checked: 1 });
const filesState = structuredClone(state); Object.assign(filesState.goals[0].criteria[0], filesCapture);
assert.equal(verify(filesState, { goalId: "G1" }).ok, true);
for (const patch of [{ status: "pending" }, { artifacts: [] }, { cleanup: [] }, { worktree_diff: "stale" }, { tree: "stale" }, { adversarial_classes: [{ name: "stale_state", status: "pass" }] }, { expected_evidence: "/nonexistent-ulw-proof" }]) {
 const bad = structuredClone(state); Object.assign(bad.goals[0].criteria[0], patch);
 assert.throws(() => verify(bad, { goalId: "G1" }));
}
const cycle = structuredClone(state); cycle.goals[0].depends_on = ["G1"];
assert.throws(() => verify(cycle, { goalId: "G1" }), /cycle/);
const gate = { ...capture, manualQa: { by: "main-session", status: "passed", evidence: "CLI source observed", artifactRefs: [{ id: "proof", kind: "cli-transcript", path: artifact }], surfaceEvidence: [{ criterionRef: "C1", surface: "cli", invocation: "read validator", verdict: "passed", artifactRefs: ["proof"] }] }, gateReview: { by: "independent-reviewer", recommendation: "APPROVE", reportPath: artifact, evidence: "fixture review", blockers: [] }, iteration: { status: "passed", fullRerun: true, rerunCommands: ["validator-self-check"], evidence: "fixture rerun" }, criteriaCoverage: { totalCriteria: 1, passCount: 1, originalIntent: "validate", desiredOutcome: "reject stale proof", userOutcomeReview: "fixture passed" } };
assert.equal(verify(state, { gate }).ok, true);
const uncovered = structuredClone(state);
uncovered.goals[0].criteria.push({ ...criterion, id: "C2" });
const coverageGate = { ...gate, criteriaCoverage: { ...gate.criteriaCoverage, totalCriteria: 2, passCount: 2 } };
assert.throws(() => verify(uncovered, { gate: coverageGate }), /no real-surface proof/);
assert.equal(verify(uncovered, { gate: { ...coverageGate, manualQa: { ...gate.manualQa, surfaceEvidence: [...gate.manualQa.surfaceEvidence, { ...gate.manualQa.surfaceEvidence[0], criterionRef: "C2" }] } } }).ok, true);
for (const patch of [{ tree: "stale" }, { gateReview: { ...gate.gateReview, recommendation: "INCONCLUSIVE" } }, { criteriaCoverage: { ...gate.criteriaCoverage, passCount: 0 } }, { manualQa: { ...gate.manualQa, by: "worker" } }]) {
 assert.throws(() => verify(state, { gate: { ...gate, ...patch } }));
}
console.log("Checkpoint validator assertions passed");
