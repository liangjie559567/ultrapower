<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# agents/

## Purpose
包含 49 个专业 AI agent 的 Markdown 提示模板。每个文件定义一个 agent 的角色、能力边界和行为规范，供 `src/agents/` 中的 TypeScript 实现加载。

## Key Files

| 文件 | 描述 |
|------|------|
| `executor.md` | 代码实现、重构、功能开发（Sonnet） |
| `architect.md` | 系统设计、边界、接口、长期权衡（Opus） |
| `planner.md` | 任务排序、执行计划、风险标记（Opus） |
| `analyst.md` | 需求澄清、验收标准、隐性约束（Opus） |
| `explore.md` | 代码库发现、符号/文件映射（Haiku） |
| `debugger.md` | 根因分析、回归隔离、故障诊断（Sonnet） |
| `deep-executor.md` | 复杂自主目标导向任务（Opus） |
| `verifier.md` | 完成证据、声明验证、测试充分性（Sonnet） |
| `code-reviewer.md` | 跨关注点综合审查（Opus） |
| `security-reviewer.md` | 漏洞、信任边界、认证/授权（Sonnet） |
| `axiom-worker.md` | PM→Worker 协议，三态输出（Sonnet） |
| `axiom-system-architect.md` | 原子任务 DAG 与 Manifest 生成（Sonnet） |

## Agent 分类

| 类别 | Agent 数量 | 代表 Agent |
|------|-----------|-----------|
| Build/Analysis Lane | 8 | explore, analyst, planner, architect, debugger, executor, deep-executor, verifier |
| Review Lane | 6 | style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer |
| Domain Specialists | 16 | dependency-expert, test-engineer, designer, writer, qa-tester, scientist 等 |
| Product Lane | 4 | product-manager, ux-researcher, information-architect, product-analyst |
| Axiom Lane | 14 | axiom-requirement-analyst, axiom-prd-crafter, axiom-worker 等 |
| Coordination | 1 | critic |

## For AI Agents

### 修改此目录时
- 修改 agent 提示后，必须同步更新 `src/agents/definitions.ts` 和 `src/agents/index.ts`
- 分层 agent（`-low`、`-medium`、`-high` 变体）需同步更新所有变体
- 更新 `docs/REFERENCE.md` 中的 agent 列表
- 更新根目录 `AGENTS.md` 中的 agent 概览表

### 命名规范
- 文件名使用 kebab-case：`my-agent.md`
- Axiom 系列以 `axiom-` 前缀命名
- 审查类以 `-reviewer` 后缀命名

### 模板结构
每个 agent 文件应包含：角色定义、能力边界、输出格式、禁止行为

## Dependencies

### Internal
- `src/agents/definitions.ts` — agent 注册表，引用此目录的文件名
- `src/agents/prompt-generator.ts` — 加载并渲染 agent 提示模板
- `docs/REFERENCE.md` — 面向用户的 agent 文档

<!-- MANUAL: -->
