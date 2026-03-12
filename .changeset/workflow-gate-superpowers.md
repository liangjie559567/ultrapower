---
"@liangjie559567/ultrapower": minor
---

Add workflow gate system for superpowers discipline enforcement

**New Feature: Workflow Gate Hook**
- Automatically enforces superpowers workflow order
- Blocks implementation without brainstorming
- Blocks execution without written plan
- Blocks executing-plans/subagent-driven-development without plan
- Maintains workflow state in `.omc/workflow-state.json`
- Auto-injects required skills with warning messages

**Implementation:**
- New hook: `src/hooks/workflow-gate/`
- Integrated into `user-prompt-submit` hook
- 15 test cases with 100% pass rate

**Workflow stages enforced:**
1. brainstorming (required before implementation)
2. writing-plans (required before execution)
3. using-git-worktrees (recommended)
4. execution (subagent-driven-development or executing-plans)
5. requesting-code-review (required before completion)
6. verification-before-completion (required before merge)

**Detection coverage:**
- Implementation keywords: implement, create, add, build, 实现, 创建, 添加
- Execution keywords: execute, run, start, 执行, 运行
- Skill invocations: /ultrapower:executing-plans, /ultrapower:subagent-driven-development
