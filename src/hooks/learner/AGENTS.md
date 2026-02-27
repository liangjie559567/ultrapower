<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/learner/

## Purpose
Skill 提取 hook。从当前对话中自动识别和提取可复用的工作流模式，生成新的 skill 定义，支持 ultrapower 的自我进化能力。

## For AI Agents

### 触发条件
- 用户执行了重复性工作流
- 检测到可抽象的操作模式
- 用户明确请求 `/ultrapower:learner`

### 修改此目录时
- 提取逻辑变更需更新 `skills/learner/SKILL.md`
- 生成的 skill 存储在 `skills/` 目录中

## Dependencies

### Internal
- `skills/learner/SKILL.md` — Learner skill 定义
- `skills/` — 生成的 skill 存储位置

<!-- MANUAL: -->
