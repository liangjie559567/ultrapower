<!-- Generated: 2026-01-28 | Updated: 2026-03-05 -->

# src/agents/ - 智能体实现细节

**用途：** 50 个专业智能体的定义、提示词和配置。

**版本：** 5.5.14

## 关键文件

| 文件 | 描述 |
|------|------|
| `definitions.ts` | 所有智能体的定义和提示词 |
| `index.ts` | 智能体导出和注册 |
| `types.ts` | 智能体类型定义 |
| `preamble.ts` | 通用前言和上下文 |
| `timeout-config.ts` | 超时配置 |
| `timeout-manager.ts` | 超时管理逻辑 |
| `agent-wrapper.ts` | 智能体包装器 |
| `prompt-generator.ts` | 提示词生成器 |

## 智能体分类

| 分类 | 数量 | 示例 |
|------|------|------|
| 构建/分析 | 8 | explore, analyst, planner, architect, debugger, executor, deep-executor, verifier |
| 审查 | 7 | style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer |
| 领域专家 | 15+ | dependency-expert, test-engineer, designer, writer, qa-tester, scientist, build-fixer, git-master, database-expert, devops-engineer, i18n-specialist, accessibility-auditor, api-designer |
| 产品 | 5 | product-manager, ux-researcher, information-architect, product-analyst |
| Axiom | 15+ | axiom-worker, axiom-prd-crafter, axiom-system-architect, axiom-evolution-engine 等 |

## 面向 AI 智能体

### 在此目录中工作

1. **查找智能体定义**
   - 使用 `lsp_workspace_symbols` 查找智能体名称
   - 在 `definitions.ts` 中查看完整定义
   - 检查 `timeout-config.ts` 中的超时设置

2. **修改智能体提示词**
   - 编辑 `definitions.ts` 中的提示词
   - 运行 `npm test` 验证
   - 更新 `agents/AGENTS.md` 文档

3. **添加新智能体**
   - 在 `definitions.ts` 中定义
   - 在 `index.ts` 中导出
   - 在 `timeout-config.ts` 中配置超时
   - 在 `agents/AGENTS.md` 中记录

### 修改检查清单

| 修改位置 | 验证步骤 |
|---------|---------|
| 提示词 | 运行 `npm test` |
| 超时配置 | 检查 `timeout-config.ts` |
| 新智能体 | 更新 `definitions.ts` 和 `index.ts` |
| 智能体数量 | 更新 `/AGENTS.md` 根文件 |

### 常见任务

```typescript
// 获取智能体定义
import { getAgentDefinitions } from './definitions';
const agents = getAgentDefinitions();

// 查找特定智能体
const executor = agents.find(a => a.name === 'executor');

// 检查超时配置
import { AGENT_TIMEOUTS } from './timeout-config';
const timeout = AGENT_TIMEOUTS['executor'];
```
