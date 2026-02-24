<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-31 -->

# agents

28 个专业 AI agent 定义，采用 3 级模型路由以优化成本和性能。

## 用途

此目录定义了 ultrapower 中所有可用的 agent：

- **12 个基础 agent**，含默认模型分配
- **4 个专业 agent**（security-reviewer、build-fixer、tdd-guide、code-reviewer）
- **12 个分级变体**（LOW/MEDIUM/HIGH），用于智能路由
- 提示词从 `/agents/*.md` 文件动态加载
- 工具根据 agent 专业方向分配

## 关键文件

| 文件 | 描述 |
|------|------|
| `definitions.ts` | **主注册表** - `getAgentDefinitions()`、`omcSystemPrompt` |
| `architect.ts` | 架构与调试专家（Opus） |
| `executor.ts` | 专注任务实现（Sonnet） |
| `explore.ts` | 快速代码库搜索（Haiku） |
| `designer.ts` | UI/UX 专家（Sonnet） |
| `document-specialist.ts` | 文档与参考查询（Sonnet） |
| `writer.ts` | 技术文档（Haiku） |
| `vision.ts` | 视觉/图像分析（Sonnet） |
| `critic.ts` | 批判性计划审查（Opus） |
| `analyst.ts` | 预规划分析（Opus） |
| `planner.ts` | 战略规划（Opus） |
| `qa-tester.ts` | 使用 tmux 进行 CLI/服务测试（Sonnet） |
| `scientist.ts` | 数据分析与假设检验（Sonnet） |
| `index.ts` | 导出所有 agent 和工具函数 |

## 面向 AI Agent

### 在此目录中工作

#### 理解 Agent 注册表

主注册表位于 `definitions.ts`：

```typescript
// 获取全部 28 个 agent
const agents = getAgentDefinitions();

// 每个 agent 包含：
{
  name: 'architect',
  description: 'Architecture & Debugging Advisor',
  prompt: '...',  // 从 /agents/architect.md 加载
  tools: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
  model: 'opus',
  defaultModel: 'opus'
}
```

#### Agent 选择指南

| 任务类型 | 最佳 Agent | 模型 | 工具 |
|----------|-----------|------|------|
| 复杂调试 | `architect` | opus | Read, Glob, Grep, WebSearch, WebFetch |
| 快速代码查询 | `architect-low` | haiku | Read, Glob, Grep |
| 标准分析 | `architect-medium` | sonnet | Read, Glob, Grep, WebSearch, WebFetch |
| 功能实现 | `executor` | sonnet | Read, Glob, Grep, Edit, Write, Bash, TodoWrite |
| 简单修复 | `executor-low` | haiku | Read, Glob, Grep, Edit, Write, Bash, TodoWrite |
| 复杂重构 | `executor-high` | opus | Read, Glob, Grep, Edit, Write, Bash, TodoWrite |
| 快速文件搜索 | `explore` | haiku | Read, Glob, Grep |
| 架构发现 | `explore-high` | opus | Read, Glob, Grep |
| UI 组件 | `designer` | sonnet | Read, Glob, Grep, Edit, Write, Bash |
| 简单样式 | `designer-low` | haiku | Read, Glob, Grep, Edit, Write, Bash |
| 设计系统 | `designer-high` | opus | Read, Glob, Grep, Edit, Write, Bash |
| API 文档 | `document-specialist` | sonnet | Read, Glob, Grep, WebSearch, WebFetch |
| README/文档 | `writer` | haiku | Read, Glob, Grep, Edit, Write |
| 图像分析 | `vision` | sonnet | Read, Glob, Grep |
| 计划审查 | `critic` | opus | Read, Glob, Grep |
| 需求分析 | `analyst` | opus | Read, Glob, Grep, WebSearch |
| 战略规划 | `planner` | opus | Read, Glob, Grep, WebSearch |
| CLI 测试 | `qa-tester` | sonnet | Bash, Read, Grep, Glob, TodoWrite |
| 数据分析 | `scientist` | sonnet | Read, Glob, Grep, Bash, python_repl |
| ML/假设检验 | `scientist-high` | opus | Read, Glob, Grep, Bash, python_repl |
| 安全审计 | `security-reviewer` | opus | Read, Grep, Glob, Bash |
| 快速安全扫描 | `security-reviewer-low` | haiku | Read, Grep, Glob, Bash |
| 构建错误 | `build-fixer` | sonnet | Read, Grep, Glob, Edit, Write, Bash |
| TDD 工作流 | `tdd-guide` | sonnet | Read, Grep, Glob, Edit, Write, Bash |
| 测试建议 | `tdd-guide-low` | haiku | Read, Grep, Glob, Bash |
| 代码审查 | `code-reviewer` | opus | Read, Grep, Glob, Bash |

#### 创建新 Agent

1. **创建 agent 文件**（如 `new-agent.ts`）：
```typescript
import type { AgentConfig } from '../shared/types.js';

export const newAgent: AgentConfig = {
  name: 'new-agent',
  description: 'What this agent does',
  prompt: '', // 将从 /agents/new-agent.md 加载
  tools: ['Read', 'Glob', 'Grep'],
  model: 'sonnet',
  defaultModel: 'sonnet'
};
```

2. **在 `/agents/new-agent.md` 创建提示词模板**：
```markdown
---
name: new-agent
description: What this agent does
model: sonnet
tools: [Read, Glob, Grep]
---

# Agent Instructions

You are a specialized agent for...
```

3. **添加到 `definitions.ts`**：
```typescript
import { newAgent } from './new-agent.js';

export function getAgentDefinitions() {
  return {
    // ... 现有 agent
    'new-agent': newAgent,
  };
}
```

4. **从 `index.ts` 导出**：
```typescript
export { newAgent } from './new-agent.js';
```

#### 创建分级变体

对于模型路由，在 `definitions.ts` 中创建 LOW/MEDIUM/HIGH 变体：

```typescript
// 简单任务的 Haiku 变体
export const newAgentLow: AgentConfig = {
  name: 'new-agent-low',
  description: 'Quick new-agent tasks (Haiku)',
  prompt: loadAgentPrompt('new-agent-low'),
  tools: ['Read', 'Glob', 'Grep'],
  model: 'haiku',
  defaultModel: 'haiku'
};

// 复杂任务的 Opus 变体
export const newAgentHigh: AgentConfig = {
  name: 'new-agent-high',
  description: 'Complex new-agent tasks (Opus)',
  prompt: loadAgentPrompt('new-agent-high'),
  tools: ['Read', 'Glob', 'Grep', 'WebSearch'],
  model: 'opus',
  defaultModel: 'opus'
};
```

### 修改检查清单

#### 添加新 Agent 时

1. 创建 agent 文件（`src/agents/new-agent.ts`）
2. 创建提示词模板（`agents/new-agent.md`）
3. 添加到 `definitions.ts`（导入 + 注册）
4. 从 `index.ts` 导出
5. 更新 `docs/REFERENCE.md`（Agents 部分，更新数量）
6. 更新 `docs/CLAUDE.md`（Agent 选择指南）
7. 更新根目录 `/AGENTS.md`（如适用，更新 Agent 摘要）

#### 修改 Agent 时

1. 如更改工具/模型，更新 agent 文件（`src/agents/*.ts`）
2. 如更改行为，更新提示词模板（`agents/*.md`）
3. 如适用，更新分级变体（`-low`、`-medium`、`-high`）
4. 如更改 agent 描述/能力，更新 `docs/REFERENCE.md`
5. 如更改工具分配，更新 `docs/CLAUDE.md`（Agent 工具矩阵）

#### 删除 Agent 时

1. 从 `src/agents/` 删除 agent 文件
2. 从 `agents/` 删除提示词模板
3. 从 `definitions.ts` 和 `index.ts` 中移除
4. 更新所有文档中的 agent 数量
5. 检查 skill/hook 中是否有对已删除 agent 的引用

### 测试要求

Agent 通过集成测试进行测试：

```bash
npm test -- --grep "agent"
```

### 常见模式

**提示词加载：**
```typescript
function loadAgentPrompt(agentName: string): string {
  const agentPath = join(getPackageDir(), 'agents', `${agentName}.md`);
  const content = readFileSync(agentPath, 'utf-8');
  // 去除 YAML frontmatter
  const match = content.match(/^---[\s\S]*?---\s*([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}
```

**工具分配模式：**
- 只读 agent：`['Read', 'Glob', 'Grep']`
- 分析 agent：添加 `['WebSearch', 'WebFetch']`
- 执行 agent：添加 `['Edit', 'Write', 'Bash', 'TodoWrite']`
- 数据 agent：添加 `['python_repl']`

## 依赖

### 内部
- 提示词来自 `/agents/*.md`
- 类型来自 `../shared/types.ts`

### 外部
无 - 纯 TypeScript 定义。

## Agent 分类

| 分类 | Agent | 用途 |
|------|-------|------|
| 分析 | architect, architect-medium, architect-low | 调试、架构 |
| 执行 | executor, executor-low, executor-high | 代码实现 |
| 搜索 | explore, explore-high | 代码库探索 |
| 研究 | document-specialist | 外部文档 |
| 前端 | designer, designer-low, designer-high | UI/UX 工作 |
| 文档 | writer | 技术写作 |
| 视觉 | vision | 图像/截图分析 |
| 规划 | planner, analyst, critic | 战略规划 |
| 测试 | qa-tester | 交互式测试 |
| 安全 | security-reviewer, security-reviewer-low | 安全审计 |
| 构建 | build-fixer | 编译错误 |
| TDD | tdd-guide, tdd-guide-low | 测试驱动开发 |
| 审查 | code-reviewer | 代码质量 |
| 数据 | scientist, scientist-high | 数据分析 |

<!-- MANUAL: -->
