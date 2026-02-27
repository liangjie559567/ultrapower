<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/

## Purpose
Skill 定义目录。存放所有 71 个 OMC skill 的 Markdown 定义文件，每个 skill 包含触发条件、执行工作流和使用说明。Skill 是用户可调用的高级命令，通过 `/ultrapower:<name>` 语法触发。

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `autopilot/` | 全自主执行 skill |
| `ralph/` | 自引用循环执行 skill |
| `ultrawork/` | 并行执行引擎 skill |
| `team/` | 多 agent 协调 skill |
| `plan/` | 战略规划 skill |
| `pipeline/` | 顺序 agent 链 skill |
| `ax-*/` | Axiom 工作流系列 skill（14 个） |
| `deepinit/` | 代码库初始化 skill |
| `brainstorming/` | 头脑风暴 skill |
| *(其余 50+ 个 skill 目录)* | 各专业 skill 定义 |

## For AI Agents

### 修改此目录时
- 新增 skill 需同步更新 `src/skills/` 中的 TypeScript 注册
- Skill 触发关键词变更需更新 `src/features/magic-keywords/`
- 参见 `skills/writing-skills/` 了解 skill 编写规范

## Dependencies

### Internal
- `src/skills/` — Skill TypeScript 运行时
- `src/features/magic-keywords/` — 关键词触发系统

<!-- MANUAL: -->
