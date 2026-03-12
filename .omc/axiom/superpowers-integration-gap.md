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

**测试覆盖**: 24 个测试用例，100% 通过

**自动触发机制**:
- 检测模糊需求（"how to"、"what should"、"help me"、"如何"、"怎么"、"帮我"）
- 最小长度要求：8 个字符（支持中文字符计数）
- 优先级：实现意图 > 执行意图 > skill 调用 > 模糊需求
- 忽略已包含 "brainstorm" 的 prompt
- 自动注入 brainstorming skill 并显示友好提示

## 待实现改进

### 高优先级
1. ~~**工作流门禁**：未完成 brainstorming 不允许进入 writing-plans~~ ✅ 已完成（v7.1.0）
2. ~~**强化自动触发**：在 hooks 中检测工作流阶段，自动注入对应 skill~~ ✅ 已完成（v7.1.0）
3. ~~**Skill 审计**：对照原项目补充缺失的核心 skills~~ ✅ 已完成（v7.1.0）
   - 审计结果：所有 15 个 superpowers 核心 skills 已完整实现
   - brainstorming、systematic-debugging、test-driven-development、writing-plans、writing-skills
   - using-superpowers、using-git-worktrees、verification-before-completion
   - requesting-code-review、receiving-code-review、dispatching-parallel-agents
   - executing-plans、finishing-a-development-branch、subagent-driven-development、next-step-router

### 中优先级
1. **添加 `.superpowers/` 目录支持**（原项目的状态持久化）
   - 目标：兼容原 superpowers 项目的状态文件格式
   - 位置：项目根目录 `.superpowers/state.json`
   - 内容：工作流状态、已完成步骤、当前阶段
   - 迁移策略：读取 `.superpowers/` 优先，回退到 `.omc/workflow-state.json`
2. **实现 skill 依赖检查**（某些 skills 依赖其他 skills 先执行）
   - 目标：在 skill frontmatter 中声明依赖关系
   - 示例：`requires: [brainstorming, writing-plans]`
   - 检查时机：skill 调用前验证依赖是否满足

## 下一步行动

所有高优先级改进已完成。可继续实现中优先级改进项。
