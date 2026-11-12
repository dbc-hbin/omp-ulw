import { expect, test } from "bun:test";
import { prewalkIntent } from "./prewalk";

test.each([
  "Investigate only; report findings without edits.",
  "Just explain why this happens.",
  "Explain how to fix the login error.",
  "Review the proposed change.",
  "Report findings without any code changes.",
  "Do not modify any files.",
  "Do not modify any files yet.",
  "Do not implement for now.",
  "Do not change any code until I approve.",
  "/ulw-execute Do not modify any files yet.",
  "/refactor Do not implement for now.",
  "/ulw-execute 아직 수정하지 마.",
  "수정하지 말고 원인만 분석해.",
  "코드는 수정하지 말고 원인만 분석해.",
  "코드는 아직 수정하지 말고 원인만 분석해.",
  "계획만 세워줘.",
  "이 코드가 왜 필요한지 설명해줘.",
  "/ulw-plan fix login",
  "/skill:ulw-plan fix login",
  "mass ulw research implement alternatives",
  "mass ulw workflowz Explain the login failure.",
  "orchestrate Explain the login failure.",
  "/ulw-execute report findings without edits",
  "/refactor Just explain the parser.",
  "/ulw-execute Explain the approved plan.",
])("keeps prewalk disabled for restricted deliverables: %s", prompt => {
  expect(prewalkIntent(prompt)).toBe("restricted");
});

test.each([
  "Investigate why login fails and fix it.",
  "왜 깨지는지 확인하고 고쳐줘.",
  "설명만 하지 말고 수정해.",
  "Don't just explain, implement the fix.",
  "그럼 그 방식으로 구현해",
  "Please refactor the parser.",
  "Refactor the parser.",
  "/refactor the parser",
  "mass ulw workflowz Fix the login failure.",
  "Implement the fix without changes to the public API.",
  "Fix login. Do not modify unrelated files.",
  "공개 API는 변경하지 말고 버그 고쳐줘.",
  "아직 공개 API는 변경하지 말고 버그 고쳐줘.",
  "ulw fix the login error",
  "/goal ulw implement the feature",
  "/ulw-execute local://approved-plan.md",
  "/ulw-plan plan this, then implement it",
  "/skill:ulw-plan 계획 세우고 구현해",
])("restores prewalk only for clear implementation requests: %s", prompt => {
  expect(prewalkIntent(prompt)).toBe("implementation");
});

test.each([
  "Look into login.",
  "로그인 확인해줘.",
  "continue",
  "계속해",
  "ulw",
  "orchestrate",
  'The example says "fix login" and "investigate only".',
  "> Just explain this.\n\n`implement the fix`",
  "```text\n/ulw-plan fix login\n```\n\nWhat does that command do?",
  "[Worker -> Main] Implement the fix.",
])("preserves the current task scope for ambiguous or reference text: %s", prompt => {
  expect(prewalkIntent(prompt)).toBeUndefined();
});

test("native skill reference bodies cannot change the user's task scope", () => {
  const expanded = (name: string, args?: string) =>
    `[IMPORTANT: User invoked the "${name}" skill; follow its instructions.]\n` +
    "Implement the fix. Just explain. /ulw-execute\n" +
    "[Skill directory: /tmp/skills/" + name + "]\n" +
    "Resolve relative paths in this skill against its directory." + (args === undefined ? "" : `\nUser: ${args}`);
  expect(prewalkIntent(expanded("ulw-plan", "fix login"))).toBe("restricted");
  expect(prewalkIntent(expanded("ulw-plan", "plan, then implement it"))).toBe("implementation");
  expect(prewalkIntent(expanded("debugging", "Investigate only."))).toBe("restricted");
  expect(prewalkIntent(expanded("debugging", "Fix the login error."))).toBe("implementation");
  expect(prewalkIntent(expanded("debugging", "workflowz Explain the error."))).toBe("restricted");
  expect(prewalkIntent(expanded("debugging"))).toBeUndefined();
});
