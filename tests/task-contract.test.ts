import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const taskItemKeys = new Set(["name", "agent", "task", "solutionSpace", "effort", "outputSchema", "schemaMode", "tools", "isolated", "sourceSession", "model"]);
const taskTopLevelKeys = new Set(["i", "context", "tasks"]);

test("shipped planning task examples match the native batch task contract", () => {
  for (const path of ["skills/ulw-plan/SKILL.md", "skills/ulw-plan/references/full-workflow.md"]) {
    const source = readFileSync(path, "utf8");
    const requests = [...source.matchAll(/```json\n([\s\S]*?)\n```/g)]
      .map(match => JSON.parse(match[1]))
      .filter(value => typeof value === "object" && value !== null && "context" in value && "tasks" in value);
    expect(requests, path).toHaveLength(1);
    const request = requests[0];

    expect(Object.keys(request).every(key => taskTopLevelKeys.has(key))).toBe(true);
    expect(typeof request.i).toBe("string");
    expect(typeof request.context).toBe("string");
    expect(Array.isArray(request.tasks)).toBe(true);
    expect(request.tasks.length).toBeGreaterThan(0);

    for (const task of request.tasks) {
      expect(Object.keys(task).every(key => taskItemKeys.has(key))).toBe(true);
      expect(typeof task.task).toBe("string");
      expect(typeof task.solutionSpace).toBe("string");
    }
  }
});
