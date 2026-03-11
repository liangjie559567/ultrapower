# Superpowers 集成差距分析

**日期**: 2026-03-11
**问题**: 用户反馈 ultrapower 未深入融合 superpowers 核心理念

## 当前状态

### 已有的 superpowers 元素
1. ✅ Skills 文件结构（brainstorming、writing-plans 等）
2. ✅ `using-superpowers` skill（强制调用规则）
3. ✅ 工作流检查清单

### 缺失的核心理念

#### 1. **自动触发机制不够强**
- 原项目：skills 根据上下文自动激活
- 当前：依赖用户手动调用或 magic keywords

#### 2. **工作流纪律执行不严格**
- 原项目：强制按顺序执行（brainstorm → plan → execute → verify）
- 当前：用户可以跳过步骤

#### 3. **缺少 superpowers 原生 skills**
- 原项目有完整的 skills 库
- 当前：部分 skills 是 ultrapower 自创的

## 建议改进

### 高优先级
1. **强化自动触发**：在 hooks 中检测工作流阶段，自动注入对应 skill
2. **工作流门禁**：未完成 brainstorming 不允许进入 writing-plans
3. **Skill 审计**：对照原项目补充缺失的核心 skills

### 中优先级
1. 添加 `.superpowers/` 目录支持（原项目的状态持久化）
2. 实现 skill 依赖检查（某些 skills 依赖其他 skills 先执行）

## 已实现改进（v7.1.0）

### ✅ 工作流门禁系统

**实现位置**: `src/hooks/workflow-gate/`

**功能**:
- 自动检测用户是否跳过必要的工作流步骤
- 强制执行 superpowers 工作流顺序：
  1. brainstorming（实现前必须）
  2. writing-plans（执行前必须）
  3. using-git-worktrees（推荐）
  4. execution（subagent-driven-development 或 executing-plans）
  5. requesting-code-review（完成前必须）
  6. verification-before-completion（合并前必须）

**工作原理**:
- 在 `UserPromptSubmit` hook 中拦截用户输入
- 检测实现意图关键词（implement, create, add, build, 实现, 创建等）
- 检测执行意图关键词（execute, run, start, 执行, 运行等）
- 检测 skill 调用（/ultrapower:executing-plans, /ultrapower:subagent-driven-development）
- 维护工作流状态文件 `.omc/workflow-state.json`
- 当检测到跳过步骤时，自动注入对应 skill 并显示警告消息

**测试覆盖**: 15 个测试用例，100% 通过

## 待实现改进

### 高优先级
1. ~~**工作流门禁**：未完成 brainstorming 不允许进入 writing-plans~~ ✅ 已完成
2. **强化自动触发**：在 hooks 中检测工作流阶段，自动注入对应 skill
3. **Skill 审计**：对照原项目补充缺失的核心 skills

### 中优先级
1. 添加 `.superpowers/` 目录支持（原项目的状态持久化）
2. 实现 skill 依赖检查（某些 skills 依赖其他 skills 先执行）

## 下一步行动

继续实现剩余的高优先级改进项。
