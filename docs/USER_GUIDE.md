# ultrapower 用户使用指南

**版本**: v5.5.18
**更新时间**: 2026-03-05

---

## 目录

1. [简介](#1-简介)
2. [安装与配置](#2-安装与配置)
3. [核心概念](#3-核心概念)
4. [快速开始](#4-快速开始)
5. [核心功能](#5-核心功能)
6. [进阶功能](#6-进阶功能)
7. [配置指南](#7-配置指南)
8. [故障排查](#8-故障排查)
9. [FAQ](#9-faq)
10. [版本更新指南](#10-版本更新指南)

---

## 1. 简介

ultrapower 是 Claude Code 的多 agent 编排层，提供 50 个专业 agents、70 个 skills、35 个 hooks 和 35 个自定义工具。

**主要特性**:

* 多 agent 协作编排

* 自动化工作流

* 自我进化系统（Axiom）

* MCP 集成

**适用人群**:

* Claude Code 用户

* AI 辅助开发工具用户

* 企业开发团队

---

## 2. 安装与配置

> 详细安装步骤请参考 [README.md](../README.md#快速开始)

**本章节内容**:

* 前置条件检查

* 两种安装方式

* 验证安装

* 常见安装问题

*（待补充）*

---

## 3. 核心概念

理解 ultrapower 的核心概念：Agent、Skill、Hook、Tool。

**本章节内容**:

* Agent vs Skill vs Hook vs Tool

* 执行模式（autopilot/ralph/ultrawork/team）

* 决策树：何时用哪个？

*（待补充）*

---

## 4. 快速开始

10 分钟快速上手指南。

### 4.1 前置条件检查

在开始前，请确认：

* ✅ Node.js >= 18（运行 `node --version` 检查）

* ✅ Claude Code >= v1.0.0（运行 `claude --version` 检查）

* ✅ Git 已安装（用于插件安装）

* ✅ 有稳定的网络连接

**检查命令**:
```bash
node --version  # 应显示 v18.x.x 或更高
claude --version  # 应显示 v1.x.x 或更高
git --version  # 应显示 git version 2.x.x
```

### 4.2 安装步骤

#### 方式 1：通过 Claude Code 插件（推荐）

1. **添加 marketplace**:
   ```
   /plugin marketplace add <https://github.com/liangjie559567/ultrapower>
   ```

1. **安装插件**:
   ```
   /plugin install omc@ultrapower
   ```

1. **运行安装向导**:
   ```
   /ultrapower:omc-setup
   ```

#### 方式 2：通过 npm 全局安装

```bash
npm install -g @liangjie559567/ultrapower
```

**验证安装**:
```
/ultrapower:omc-doctor
```

如果看到 "✅ ultrapower is ready"，说明安装成功。

### 4.3 第一个示例

让我们使用 autopilot 模式创建一个简单函数：

```
autopilot "创建一个 hello world 函数"
```

**预期输出**:

* ultrapower 会自动分析需求

* 调用 executor agent 生成代码

* 运行测试验证

* 返回完整实现

**示例代码**（自动生成）:
```typescript
export function helloWorld(): string {
  return "Hello, World!";
}
```

**下一步尝试**:

* `ralph "添加单元测试"` - 持续执行直到测试通过

* `team "重构这个函数"` - 使用多 agent 协作

* `/ultrapower:analyze` - 分析代码质量

### 4.4 常见安装问题

#### 问题 1: "command not found: /plugin"

**原因**: Claude Code 未正确安装或未添加到 PATH

**解决**:
```bash

# 检查 Claude Code 是否安装

which claude

# 如果未找到，重新安装 Claude Code

```

#### 问题 2: "marketplace not found"

**原因**: marketplace URL 错误或网络问题

**解决**:
```

# 确认 URL 正确

/plugin marketplace add <https://github.com/liangjie559567/ultrapower>

# 检查网络连接

ping github.com
```

#### 问题 3: "omc-setup failed"

**原因**: 权限问题或依赖缺失

**解决**:
```bash

# 检查 Node.js 版本

node --version  # 应 >= 18

# 清除缓存重试

rm -rf ~/.claude/plugins/cache/omc
/plugin install omc@ultrapower --force
```

**更多问题？** 查看 [故障排查指南](TROUBLESHOOTING.md)

---

## 5. 核心功能

深入了解核心功能。

### 5.1 执行模式概览

ultrapower 提供 4 种主要执行模式：

| 模式 | 触发词 | 特点 | 适用场景 |
| ------ | -------- | ------ | --------- |
| **Team** | "team", "coordinated team" | 多 agent 协作，分阶段流水线 | 复杂功能开发、多文件重构 |
| **Autopilot** | "autopilot", "build me" | 全自主执行，从想法到代码 | 快速原型、单一功能实现 |
| **Ralph** | "ralph", "don't stop" | 持续执行直到验证通过 | 需要多次迭代的任务 |
| **Ultrawork** | "ulw", "ultrawork" | 最大并行度 agent 编排 | 独立任务并行执行 |

**决策树**:
```
需求 → 多文件/复杂？
       ├─ 是 → Team 模式
       └─ 否 → 单一功能？
              ├─ 是 → Autopilot
              └─ 否 → 需要持续迭代？
                     ├─ 是 → Ralph
                     └─ 否 → Ultrawork
```

---

### 5.2 Team 流水线

Team 是默认的多 agent 编排器，使用分阶段流水线：

**流水线阶段**:
```
team-plan → team-prd → team-exec → team-verify → team-fix (循环)
```

#### 5.2.1 team-plan（规划阶段）

**负责 agents**: `explore` (haiku) + `planner` (opus)

**任务**:

* 代码库探索，识别相关文件

* 任务分解，生成执行计划

* 依赖分析，确定执行顺序

**示例**:
```
team "重构用户认证模块"
```

**输出**: 任务清单 + 依赖关系 DAG

#### 5.2.2 team-prd（需求阶段）

**负责 agents**: `analyst` (opus)

**任务**:

* 澄清需求，确认验收标准

* 识别边界情况

* 生成 PRD 文档

**输出**: 验收标准 + 范围定义

#### 5.2.3 team-exec（执行阶段）

**负责 agents**: `executor` (sonnet) + 任务适配专家

**任务适配路由**:

* UI/组件 → `designer`

* 构建错误 → `build-fixer`

* 文档 → `writer`

* 测试 → `test-engineer`

* 复杂任务 → `deep-executor`

**示例**:
```typescript
// executor 自动生成代码
export class AuthService {
  async login(credentials: Credentials): Promise<User> {
    // 实现登录逻辑
  }
}
```

#### 5.2.4 team-verify（验证阶段）

**负责 agents**: `verifier` (sonnet) + 专项审查

**验证项**:

* [ ] 功能完整性（所有任务完成）

* [ ] 测试通过（单元测试 + 集成测试）

* [ ] 代码质量（`quality-reviewer`）

* [ ] 安全性（`security-reviewer`，按需）

* [ ] 性能（`performance-reviewer`，按需）

**输出**: 验证报告 + 缺陷清单

#### 5.2.5 team-fix（修复阶段）

**负责 agents**: 根据缺陷类型路由

**修复路由**:

* 构建错误 → `build-fixer`

* 逻辑错误 → `executor`

* 性能问题 → `debugger`

**循环控制**: 最多 3 次修复尝试，超出则转为 `failed` 状态

**终态**: `complete` | `failed` | `cancelled`

---

### 5.3 Autopilot 模式

**特点**: 全自主执行，从想法到可运行代码

**示例**:
```
autopilot "创建一个 REST API 端点"
```

**流程**:
1. 分析需求
2. 生成代码
3. 运行测试
4. 验证完成

**适用**: 单一功能、快速原型

---

### 5.4 Ralph 模式

**特点**: 持续执行直到 verifier 验证通过

**示例**:
```
ralph "修复所有类型错误"
```

**流程**:
1. 执行任务
2. 运行验证
3. 如果失败，分析原因并重试
4. 重复直到通过

**适用**: 需要多次迭代的任务

---

### 5.5 Ultrawork 模式

**特点**: 最大并行度 agent 编排

**示例**:
```
ultrawork "并行重构 3 个模块"
```

**流程**:

* 识别独立任务

* 并行启动多个 agents

* 等待所有任务完成

**适用**: 独立任务并行执行

---

### 5.6 Hook 系统配置

Hooks 提供事件驱动的自动化。

**Hook 类型**（15 种）:

* `PreToolUse` - 工具调用前

* `PostToolUse` - 工具调用后

* `SessionStart` - 会话开始

* `SessionEnd` - 会话结束

* `PermissionRequest` - 权限请求

* 等等...

**配置示例**:
```json
// .claude/hooks/pre-tool-use.json
{
  "name": "auto-format",
  "event": "PreToolUse",
  "condition": "tool_name === 'Edit'",
  "action": "prettier --write {{file_path}}"
}
```

**常见用例**:

* 代码保存时自动格式化

* 提交前运行测试

* 会话开始时加载项目上下文

---

### 5.7 MCP 集成

MCP（Model Context Protocol）提供外部工具集成。

**可用提供商**:

* **Codex** (OpenAI gpt-5.3-codex) - 代码分析、规划验证

* **Gemini** (Google gemini-3-pro-preview) - 大上下文任务（1M token）

**使用示例**:
```
ask codex "审查这个架构设计"
```

**配置**:
```json
// ~/.claude/.omc-config.json
{
  "mcpServers": {
    "codex": { "enabled": true, "apiKey": "..." },
    "gemini": { "enabled": true, "apiKey": "..." }
  }
}
```

---

### 5.8 Axiom 自我进化系统

Axiom 提供自我学习和工作流优化能力。

**核心功能**:

* **知识收割**: 从任务执行中提取经验

* **模式检测**: 识别重复模式并优化

* **工作流优化**: 自动改进执行策略

* **跨会话记忆**: 持久化项目知识

**Axiom 工作流**:
```
/ax-draft → /ax-review → /ax-decompose → /ax-implement → /ax-reflect
```

**示例**:
```
/ax-draft "添加用户认证功能"
```

**输出**: Draft PRD → 专家评审 → 任务拆解 → 自动实施 → 知识收割

---

## 6. 进阶功能

完整功能参考。

### 6.1 Agents 参考

ultrapower 提供 50 个专业 agents，按通道分类。

#### 6.1.1 Build/Analysis Lane（构建/分析通道）

##### explore (haiku)

代码库发现、符号/文件映射

**使用示例**:
```
Task(subagent_type="ultrapower:explore", prompt="找到所有认证相关的文件")
```

**适用场景**: 不熟悉的代码库、快速定位文件

##### analyst (opus)

需求澄清、验收标准、隐性约束识别

**使用示例**:
```
Task(subagent_type="ultrapower:analyst", prompt="分析用户登录需求")
```

**适用场景**: 需求模糊、需要明确验收标准

##### planner (opus)

任务排序、执行计划、风险标记

**使用示例**:
```
Task(subagent_type="ultrapower:planner", prompt="规划重构认证模块")
```

**适用场景**: 复杂任务分解、多步骤规划

##### architect (opus)

系统设计、边界定义、接口设计、长期权衡

**使用示例**:
```
Task(subagent_type="ultrapower:architect", prompt="设计微服务架构")
```

**适用场景**: 架构决策、系统设计

##### debugger (sonnet)

根因分析、回归隔离、故障诊断

**使用示例**:
```
Task(subagent_type="ultrapower:debugger", prompt="分析登录失败原因")
```

**适用场景**: Bug 调查、性能问题排查

##### executor (sonnet)

代码实现、重构、功能开发

**使用示例**:
```
Task(subagent_type="ultrapower:executor", prompt="实现用户登录功能")
```

**适用场景**: 标准代码实现、多文件修改

##### deep-executor (opus)

复杂自主目标导向任务

**使用示例**:
```
Task(subagent_type="ultrapower:deep-executor", prompt="重构整个认证系统")
```

**适用场景**: 复杂重构、跨模块变更

##### verifier (sonnet)

完成证据收集、声明验证、测试充分性检查

**使用示例**:
```
Task(subagent_type="ultrapower:verifier", prompt="验证登录功能完整性")
```

**适用场景**: 任务完成验证、质量保证

#### 6.1.2 Review Lane（审查通道）

##### style-reviewer (haiku)

格式、命名、惯用法、lint 规范检查

**使用示例**:
```
Task(subagent_type="ultrapower:style-reviewer", prompt="审查代码风格")
```

**适用场景**: 代码规范检查、格式化验证

##### quality-reviewer (sonnet)

逻辑缺陷、可维护性、反模式识别

**使用示例**:
```
Task(subagent_type="ultrapower:quality-reviewer", prompt="审查代码质量")
```

**适用场景**: 代码质量评估、重构建议

##### api-reviewer (sonnet)

API 契约、版本控制、向后兼容性

**使用示例**:
```
Task(subagent_type="ultrapower:api-reviewer", prompt="审查 API 设计")
```

**适用场景**: API 设计审查、接口变更评估

##### security-reviewer (sonnet)

漏洞、信任边界、认证/授权检查

**使用示例**:
```
Task(subagent_type="ultrapower:security-reviewer", prompt="安全审查")
```

**适用场景**: 安全漏洞扫描、权限检查

##### performance-reviewer (sonnet)

热点、复杂度、内存/延迟优化

**使用示例**:
```
Task(subagent_type="ultrapower:performance-reviewer", prompt="性能审查")
```

**适用场景**: 性能瓶颈识别、优化建议

##### code-reviewer (opus)

跨关注点的综合审查

**使用示例**:
```
Task(subagent_type="ultrapower:code-reviewer", prompt="全面代码审查")
```

**适用场景**: PR 审查、发布前检查

#### 6.1.3 Domain Specialists（领域专家）

##### dependency-expert (sonnet)

外部 SDK/API/包评估

**使用示例**:
```
Task(subagent_type="ultrapower:dependency-expert", prompt="评估 React Query 使用")
```

**适用场景**: 第三方库选型、API 集成

##### test-engineer (sonnet)

测试策略、覆盖率、不稳定测试加固

**使用示例**:
```
Task(subagent_type="ultrapower:test-engineer", prompt="设计测试策略")
```

**适用场景**: 测试设计、TDD 实践

##### quality-strategist (sonnet)

质量策略、发布就绪性、风险评估

**使用示例**:
```
Task(subagent_type="ultrapower:quality-strategist", prompt="评估发布风险")
```

**适用场景**: 发布决策、质量门禁

##### build-fixer (sonnet)

构建/工具链/类型失败修复

**使用示例**:
```
Task(subagent_type="ultrapower:build-fixer", prompt="修复 TypeScript 错误")
```

**适用场景**: 构建失败、类型错误

##### designer (sonnet)

UX/UI 架构、交互设计

**使用示例**:
```
Task(subagent_type="ultrapower:designer", prompt="设计登录界面")
```

**适用场景**: UI 设计、用户体验优化

##### writer (haiku)

文档、迁移说明、用户指南

**使用示例**:
```
Task(subagent_type="ultrapower:writer", prompt="编写 API 文档")
```

**适用场景**: 文档编写、README 更新

##### qa-tester (sonnet)

交互式 CLI/服务运行时验证

**使用示例**:
```
Task(subagent_type="ultrapower:qa-tester", prompt="测试 CLI 命令")
```

**适用场景**: 手动测试、集成测试

##### scientist (sonnet)

数据/统计分析

**使用示例**:
```
Task(subagent_type="ultrapower:scientist", prompt="分析用户行为数据")
```

**适用场景**: 数据分析、实验评估

##### document-specialist (sonnet)

外部文档和参考查找

**使用示例**:
```
Task(subagent_type="ultrapower:document-specialist", prompt="查找 React 最佳实践")
```

**适用场景**: 技术调研、文档搜索

##### git-master (sonnet)

提交策略、历史整洁

**使用示例**:
```
Task(subagent_type="ultrapower:git-master", prompt="整理提交历史")
```

**适用场景**: Git 操作、提交优化

##### database-expert (sonnet)

数据库设计、查询优化和迁移

**使用示例**:
```
Task(subagent_type="ultrapower:database-expert", prompt="优化 SQL 查询")
```

**适用场景**: 数据库设计、性能优化

##### devops-engineer (sonnet)

CI/CD、容器化、基础设施即代码

**使用示例**:
```
Task(subagent_type="ultrapower:devops-engineer", prompt="配置 GitHub Actions")
```

**适用场景**: CI/CD 配置、部署自动化

##### i18n-specialist (sonnet)

国际化、本地化和多语言支持

**使用示例**:
```
Task(subagent_type="ultrapower:i18n-specialist", prompt="添加多语言支持")
```

**适用场景**: 国际化实现、翻译管理

##### accessibility-auditor (sonnet)

Web 无障碍审查和 WCAG 合规

**使用示例**:
```
Task(subagent_type="ultrapower:accessibility-auditor", prompt="审查无障碍性")
```

**适用场景**: 无障碍审查、WCAG 合规

##### api-designer (sonnet)

REST/GraphQL API 设计和契约定义

**使用示例**:
```
Task(subagent_type="ultrapower:api-designer", prompt="设计 RESTful API")
```

**适用场景**: API 设计、接口规范

#### 6.1.4 Product Lane（产品通道）

##### product-manager (sonnet)

问题定义、用户画像/JTBD、PRD

**使用示例**:
```
Task(subagent_type="ultrapower:product-manager", prompt="编写功能 PRD")
```

**适用场景**: 需求定义、产品规划

##### ux-researcher (sonnet)

启发式审计、可用性、无障碍

**使用示例**:
```
Task(subagent_type="ultrapower:ux-researcher", prompt="用户体验审计")
```

**适用场景**: UX 评估、可用性测试

##### information-architect (sonnet)

分类、导航、可发现性

**使用示例**:
```
Task(subagent_type="ultrapower:information-architect", prompt="设计信息架构")
```

**适用场景**: 信息架构、导航设计

##### product-analyst (sonnet)

产品指标、漏斗分析、实验

**使用示例**:
```
Task(subagent_type="ultrapower:product-analyst", prompt="分析转化率")
```

**适用场景**: 数据分析、A/B 测试

#### 6.1.5 Coordination（协调）

##### critic (opus)

计划/设计批判性挑战

**使用示例**:
```
Task(subagent_type="ultrapower:critic", prompt="挑战架构设计")
```

**适用场景**: 设计评审、风险识别

##### vision (sonnet)

图片/截图/图表分析

**使用示例**:
```
Task(subagent_type="ultrapower:vision", prompt="分析 UI 截图")
```

**适用场景**: 视觉分析、设计评审

#### 6.1.6 Axiom Lane（Axiom 通道）

##### ax-drafter (sonnet)

Draft PRD 生成

**使用示例**:
```
/ax-draft "添加用户认证功能"
```

**适用场景**: 快速需求草稿

##### ax-domain-expert (opus)

领域专家评审

**使用示例**:
```
/ax-review --domain
```

**适用场景**: 技术可行性评审

##### ax-product-expert (opus)

产品专家评审

**使用示例**:
```
/ax-review --product
```

**适用场景**: 产品价值评审

##### ax-ux-expert (opus)

UX 专家评审

**使用示例**:
```
/ax-review --ux
```

**适用场景**: 用户体验评审

##### ax-critic (opus)

批判性评审

**使用示例**:
```
/ax-review --critic
```

**适用场景**: 全面挑战评审

##### ax-decomposer (opus)

任务拆解

**使用示例**:
```
/ax-decompose
```

**适用场景**: 复杂任务分解

##### ax-implementer (sonnet)

自动实施

**使用示例**:
```
/ax-implement
```

**适用场景**: 按 manifest 执行

##### ax-error-analyzer (sonnet)

错误分析

**使用示例**:
```
/ax-analyze-error
```

**适用场景**: 错误诊断、修复建议

##### ax-reflector (opus)

反思总结

**使用示例**:
```
/ax-reflect
```

**适用场景**: 知识收割、经验总结

##### ax-knowledge-curator (sonnet)

知识库管理

**使用示例**:
```
/ax-knowledge --add "React Hooks 最佳实践"
```

**适用场景**: 知识管理、经验沉淀

##### ax-pattern-detector (sonnet)

模式检测

**使用示例**:
```
/ax-evolution patterns
```

**适用场景**: 重复模式识别

##### ax-workflow-optimizer (opus)

工作流优化

**使用示例**:
```
/ax-evolution optimize
```

**适用场景**: 流程改进

##### ax-context-manager (haiku)

上下文管理

**使用示例**:
```
/ax-status
```

**适用场景**: 状态查询、上下文切换

##### ax-gate-keeper (haiku)

门禁检查

**使用示例**:
自动触发（Expert Gate、User Gate、CI Gate、Scope Gate）
```

**适用场景**: 质量门禁、流程控制

---

### 6.2 Skills 参考

ultrapower 提供 70 个 skills，按类型分类。

#### 6.2.1 Workflow Skills（工作流 Skills）

##### autopilot

**触发词**: "autopilot", "build me", "I want a"

**描述**: 全自主执行，从想法到可运行代码

**使用示例**:
```
autopilot "创建一个 REST API"
```

##### ralph

**触发词**: "ralph", "don't stop", "must complete"

**描述**: 持续执行直到 verifier 验证通过

**使用示例**:
```
ralph "修复所有类型错误"
```

##### ultrawork

**触发词**: "ulw", "ultrawork"

**描述**: 最大并行度 agent 编排

**使用示例**:
```
ultrawork "并行重构 3 个模块"
```

##### team

**触发词**: "team", "coordinated team", "team ralph"

**描述**: 多 agent 协作，分阶段流水线

**使用示例**:
```
team "重构用户认证模块"
```

##### pipeline

**触发词**: "pipeline", "chain agents"

**描述**: 顺序 agent 链式执行

**使用示例**:
```
pipeline "分析 -> 设计 -> 实现"
```

##### ultraqa

**触发词**: 由 autopilot 自动激活

**描述**: QA 循环——测试、验证、修复、重复

**使用示例**:
```
ultraqa "验证登录功能"
```

##### plan

**触发词**: "plan this", "plan the"

**描述**: 战略规划，支持 --consensus 和 --review 模式

**使用示例**:
```
plan "重构认证系统"
plan --consensus "架构设计"
```

##### ralplan

**触发词**: "ralplan", "consensus plan"

**描述**: 与 Planner、Architect、Critic 迭代规划直至达成共识

**使用示例**:
```
ralplan "微服务架构"
```

##### sciomc

**触发词**: "sciomc"

**描述**: 并行 scientist agents 进行全面分析

**使用示例**:
```
sciomc "分析用户行为数据"
```

##### external-context

**触发词**: 手动调用

**描述**: 并行 document-specialist agents 进行网络搜索

**使用示例**:
```
/ultrapower:external-context "React 最佳实践"
```

##### deepinit

**触发词**: "deepinit"

**描述**: 使用分层 AGENTS.md 进行深度代码库初始化

**使用示例**:
```
deepinit
```

##### next-step-router

**触发词**: 手动调用

**描述**: 分析产出，推荐最优下一步 agent/skill

**使用示例**:
```
/ultrapower:next-step-router
```

#### 6.2.2 Axiom Skills（Axiom 工作流）

##### ax-draft

**触发词**: 手动调用

**描述**: 生成 Draft PRD

**使用示例**:
```
/ax-draft "添加用户认证功能"
```

##### ax-review

**触发词**: 手动调用

**描述**: 专家评审（domain/product/ux/critic）

**使用示例**:
```
/ax-review
/ax-review --domain
```

##### ax-decompose

**触发词**: 手动调用

**描述**: 任务拆解，生成 manifest.md

**使用示例**:
```
/ax-decompose
```

##### ax-implement

**触发词**: 手动调用

**描述**: 按 manifest 自动实施

**使用示例**:
```
/ax-implement
```

##### ax-analyze-error

**触发词**: 手动调用

**描述**: 错误分析和修复建议

**使用示例**:
```
/ax-analyze-error
```

##### ax-reflect

**触发词**: 手动调用

**描述**: 反思总结，知识收割

**使用示例**:
```
/ax-reflect
```

##### ax-status

**触发词**: 手动调用

**描述**: 查看 Axiom 状态

**使用示例**:
```
/ax-status
```

##### ax-suspend

**触发词**: 手动调用

**描述**: 保存状态并退出

**使用示例**:
```
/ax-suspend
```

##### ax-rollback

**触发词**: 手动调用

**描述**: 回滚到上一个状态

**使用示例**:
```
/ax-rollback
```

##### ax-evolution

**触发词**: 手动调用

**描述**: 知识库/模式库管理

**使用示例**:
```
/ax-evolution knowledge "React Hooks"
/ax-evolution patterns
```

##### ax-knowledge

**触发词**: 手动调用

**描述**: 知识库管理

**使用示例**:
```
/ax-knowledge --add "最佳实践"
```

##### ax-export

**触发词**: 手动调用

**描述**: 导出工作流

**使用示例**:
```
/ax-export
```

#### 6.2.3 Agent Shortcuts（Agent 快捷方式）

##### analyze

**触发词**: "analyze", "debug", "investigate"

**描述**: 调用 debugger agent

**使用示例**:
```
analyze "登录失败原因"
```

##### deepsearch

**触发词**: "search", "find in codebase"

**描述**: 调用 explore agent

**使用示例**:
```
deepsearch "认证相关文件"
```

##### tdd

**触发词**: "tdd", "test first", "red green"

**描述**: 调用 test-engineer agent

**使用示例**:
```
tdd "登录功能"
```

##### build-fix

**触发词**: "fix build", "type errors"

**描述**: 调用 build-fixer agent

**使用示例**:
```
build-fix
```

##### code-review

**触发词**: "review code"

**描述**: 调用 code-reviewer agent

**使用示例**:
```
code-review
```

##### security-review

**触发词**: "security review"

**描述**: 调用 security-reviewer agent

**使用示例**:
```
security-review
```

##### frontend-ui-ux

**触发词**: 自动检测 UI/组件/样式工作

**描述**: 调用 designer agent

**使用示例**:
```
frontend-ui-ux "设计登录界面"
```

##### git-master

**触发词**: 自动检测 git/提交工作

**描述**: 调用 git-master agent

**使用示例**:
```
git-master "整理提交历史"
```

##### review

**触发词**: "review plan", "critique plan"

**描述**: 调用 plan --review

**使用示例**:
```
review "架构设计"
```

#### 6.2.4 MCP 委派 Skills

##### ask-codex

**触发词**: "ask codex", "use codex", "delegate to codex"

**描述**: 委派给 OpenAI Codex（gpt-5.3-codex）

**使用示例**:
```
ask codex "审查架构设计"
```

##### ask-gpt

**触发词**: "ask gpt", "use gpt", "delegate to gpt"

**描述**: 委派给 OpenAI GPT（映射到 Codex）

**使用示例**:
```
ask gpt "代码审查"
```

##### ask-gemini

**触发词**: "ask gemini", "use gemini", "delegate to gemini"

**描述**: 委派给 Google Gemini（1M 上下文）

**使用示例**:
```
ask gemini "分析大型代码库"
```

#### 6.2.5 Utility Skills（工具类）

##### cancel

**触发词**: 手动调用

**描述**: 取消执行模式

**使用示例**:
```
/ultrapower:cancel
/ultrapower:cancel --force
```

##### note

**触发词**: 手动调用

**描述**: 添加笔记到 notepad

**使用示例**:
```
/ultrapower:note "重要提醒"
```

##### learner

**触发词**: 手动调用

**描述**: 学习模式

**使用示例**:
```
/ultrapower:learner
```

##### omc-setup

**触发词**: "setup omc"

**描述**: 安装向导

**使用示例**:
```
/ultrapower:omc-setup
```

##### mcp-setup

**触发词**: 手动调用

**描述**: MCP 配置向导

**使用示例**:
```
/ultrapower:mcp-setup
```

##### hud

**触发词**: 手动调用

**描述**: 显示状态面板

**使用示例**:
```
/ultrapower:hud
```

##### omc-doctor

**触发词**: 手动调用

**描述**: 诊断工具

**使用示例**:
```
/ultrapower:omc-doctor
```

##### omc-help

**触发词**: 手动调用

**描述**: 帮助文档

**使用示例**:
```
/ultrapower:omc-help
```

##### trace

**触发词**: 手动调用

**描述**: 追踪执行日志

**使用示例**:
```
/ultrapower:trace
```

##### release

**触发词**: 手动调用

**描述**: 发布管理

**使用示例**:
```
/ultrapower:release
```

##### project-session-manager (psm)

**触发词**: 手动调用

**描述**: 项目会话管理

**使用示例**:
```
/ultrapower:psm
```

##### skill

**触发词**: 手动调用

**描述**: Skill 管理

**使用示例**:
```
/ultrapower:skill list
```

##### writer-memory

**触发词**: 手动调用

**描述**: 写作记忆管理

**使用示例**:
```
/ultrapower:writer-memory
```

##### ralph-init

**触发词**: 手动调用

**描述**: Ralph 初始化

**使用示例**:
```
/ultrapower:ralph-init
```

##### learn-about-omc

**触发词**: 手动调用

**描述**: 学习 ultrapower

**使用示例**:
```
/ultrapower:learn-about-omc
```

##### configure-discord

**触发词**: "configure discord", "setup discord"

**描述**: 配置 Discord 通知

**使用示例**:
```
/ultrapower:configure-discord
```

##### configure-telegram

**触发词**: "configure telegram", "setup telegram"

**描述**: 配置 Telegram 通知

**使用示例**:
```
/ultrapower:configure-telegram
```

##### swarm

**触发词**: "swarm"

**描述**: Team 的兼容性外观（已废弃，使用 team）

**使用示例**:
```
swarm "任务"
```

##### ultrapilot

**触发词**: "ultrapilot", "parallel build"

**描述**: Team 的兼容性外观（已废弃，使用 team）

**使用示例**:
```
ultrapilot "任务"
```

---

### 6.3 Hook Types 参考

ultrapower 提供 15 种 Hook 类型。

#### PreToolUse

**触发时机**: 工具调用前

**配置示例**:
```json
{
  "event": "PreToolUse",
  "condition": "tool_name === 'Edit'",
  "action": "prettier --write {{file_path}}"
}
```

**常见用例**: 代码格式化、权限检查

#### PostToolUse

**触发时机**: 工具调用后

**配置示例**:
```json
{
  "event": "PostToolUse",
  "condition": "tool_name === 'Write'",
  "action": "git add {{file_path}}"
}
```

**常见用例**: 自动提交、通知发送

#### SessionStart

**触发时机**: 会话开始

**配置示例**:
```json
{
  "event": "SessionStart",
  "action": "echo 'Welcome to ultrapower'"
}
```

**常见用例**: 加载项目上下文、初始化环境

#### SessionEnd

**触发时机**: 会话结束

**配置示例**:
```json
{
  "event": "SessionEnd",
  "action": "npm run cleanup"
}
```

**常见用例**: 清理临时文件、保存状态

#### PermissionRequest

**触发时机**: 权限请求时

**配置示例**:
```json
{
  "event": "PermissionRequest",
  "condition": "action === 'file_write'",
  "action": "echo 'File write requested'"
}
```

**常见用例**: 权限审计、安全检查

#### AgentStart

**触发时机**: Agent 启动时

**配置示例**:
```json
{
  "event": "AgentStart",
  "action": "echo 'Agent {{agent_name}} started'"
}
```

**常见用例**: Agent 监控、日志记录

#### AgentComplete

**触发时机**: Agent 完成时

**配置示例**:
```json
{
  "event": "AgentComplete",
  "action": "echo 'Agent {{agent_name}} completed'"
}
```

**常见用例**: 结果通知、指标收集

#### AgentError

**触发时机**: Agent 错误时

**配置示例**:
```json
{
  "event": "AgentError",
  "action": "echo 'Agent error: {{error_message}}'"
}
```

**常见用例**: 错误告警、自动重试

#### StateChange

**触发时机**: 状态变更时

**配置示例**:
```json
{
  "event": "StateChange",
  "condition": "new_state === 'EXECUTING'",
  "action": "echo 'Execution started'"
}
```

**常见用例**: 状态监控、流程控制

#### FileModified

**触发时机**: 文件修改时

**配置示例**:
```json
{
  "event": "FileModified",
  "condition": "file_path.endsWith('.ts')",
  "action": "tsc --noEmit {{file_path}}"
}
```

**常见用例**: 类型检查、自动测试

#### TestRun

**触发时机**: 测试运行时

**配置示例**:
```json
{
  "event": "TestRun",
  "action": "npm test"
}
```

**常见用例**: 测试报告、覆盖率收集

#### BuildComplete

**触发时机**: 构建完成时

**配置示例**:
```json
{
  "event": "BuildComplete",
  "action": "echo 'Build completed'"
}
```

**常见用例**: 部署触发、通知发送

#### CommitPrepare

**触发时机**: 提交准备时

**配置示例**:
```json
{
  "event": "CommitPrepare",
  "action": "npm run lint"
}
```

**常见用例**: Lint 检查、测试运行

#### ErrorDetected

**触发时机**: 错误检测时

**配置示例**:
```json
{
  "event": "ErrorDetected",
  "action": "echo 'Error: {{error_type}}'"
}
```

**常见用例**: 错误日志、告警通知

#### CustomEvent

**触发时机**: 自定义事件

**配置示例**:
```json
{
  "event": "CustomEvent",
  "eventName": "my-event",
  "action": "echo 'Custom event triggered'"
}
```

**常见用例**: 自定义工作流、特殊场景

---

### 6.4 自定义扩展指南

#### 6.4.1 创建自定义 Agent

**步骤**:

1. 在 `agents/` 目录创建 Markdown 文件

```bash
touch agents/my-custom-agent.md
```

1. 定义 agent 提示词

```markdown

# My Custom Agent

你是一个专门处理 X 任务的 agent。

## 职责

* 任务 1

* 任务 2

## 约束

* 约束 1

* 约束 2
```

1. 在 `src/agents/definitions.ts` 注册

```typescript
export const agentDefinitions = {
  'my-custom-agent': {
    model: 'sonnet',
    promptFile: 'agents/my-custom-agent.md'
  }
};
```

1. 使用自定义 agent

```
Task(subagent_type="ultrapower:my-custom-agent", prompt="执行任务")
```

#### 6.4.2 创建自定义 Skill

**步骤**:

1. 在 `skills/` 目录创建文件夹

```bash
mkdir skills/my-custom-skill
```

1. 创建 `SKILL.md` 定义

```markdown

# My Custom Skill

触发词: "my-skill"

## 执行逻辑

1. 步骤 1
2. 步骤 2
```

1. 创建实现文件 `index.ts`

```typescript
export async function myCustomSkill(input: string) {
  // 实现逻辑
}
```

1. 使用自定义 skill

```
/ultrapower:my-custom-skill "参数"
```

#### 6.4.3 创建自定义 Hook

**步骤**:

1. 在 `.claude/hooks/` 创建配置

```bash
touch .claude/hooks/my-hook.json
```

1. 定义触发条件和动作

```json
{
  "name": "my-hook",
  "event": "PostToolUse",
  "condition": "tool_name === 'Edit'",
  "action": "echo 'File edited: {{file_path}}'"
}
```

1. Hook 自动生效（无需重启）

#### 6.4.4 扩展最佳实践

**Agent 扩展**:

* 明确单一职责

* 提供清晰的约束

* 包含使用示例

**Skill 扩展**:

* 定义明确的触发词

* 避免与现有 skill 冲突

* 提供错误处理

**Hook 扩展**:

* 使用精确的条件判断

* 避免阻塞操作

* 记录执行日志

**调试技巧**:
```bash

# 查看 agent 日志

cat .omc/logs/agent-*.log

# 查看 hook 执行记录

cat .omc/logs/hook-*.log

# 诊断工具

/ultrapower:omc-doctor
```

---

## 7. 配置指南

配置 ultrapower 以适应你的工作流。

**本章节内容**:

* MCP 服务器配置

* Hooks 配置

* Steering 规则

* Axiom 系统配置

*（待补充）*

---

## 8. 故障排查

常见问题和解决方案。详细内容请参考 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)。

### 8.1 常见错误代码

| 错误代码 | 描述 | 解决方案 |
| --------- | ------ | --------- |
| E001 | 命令未找到 | 检查 Claude Code 安装和 PATH |
| E002 | Marketplace 未找到 | 验证 URL 和网络连接 |
| E003 | omc-setup 失败 | 检查 Node.js 版本，清除缓存 |
| E004 | Agent 执行超时 | 使用 ralph 模式或拆分任务 |
| E005 | Skill 触发失败 | 检查触发词，运行 omc-setup |
| E006 | Hook 执行失败 | 检查 hook 配置，查看日志 |
| E007 | MCP 连接失败 | 检查 API key，验证网络 |
| E008 | Steering 规则未生效 | 验证文件路径和格式 |
| E009 | 执行速度慢 | 使用更快的模型或并行模式 |
| E010 | 内存占用高 | 清理日志，限制并发数 |

### 8.2 日志查看指南

```bash

# Agent 执行日志

cat .omc/logs/agent-execution.log

# Hook 执行日志

cat .omc/logs/hook-execution.log

# Team 状态

cat .omc/state/team-state.json

# 查看所有日志

ls -la .omc/logs/
```

### 8.3 调试工具

* `/ultrapower:omc-doctor` - 系统诊断，检查配置和依赖

* `/ultrapower:trace timeline` - 执行追踪，查看 agent 调用链

* `/ultrapower:hud` - 实时状态监控，显示当前执行状态

### 8.4 概念澄清

**Agent vs Skill**:

* **Agent**: 执行单元（如 executor、debugger），专注单一职责

* **Skill**: 工作流编排（如 autopilot、team），内部调用多个 Agents

* **关系**: Skill 内部调用多个 Agents 完成复杂任务

**决策树**:
```
需求 → 单步任务？
       ├─ 是 → 使用 Agent（executor/debugger）
       └─ 否 → 使用 Skill（autopilot/team）

需要自动化？
       ├─ 是 → 配置 Hook
       └─ 否 → 手动调用
```

---

## 9. FAQ

常见问题快速解答。详细内容请参考 [FAQ.md](FAQ.md)。

### 9.1 安装问题（5 个）

**Q1: 支持哪些操作系统？**
A: macOS、Linux、Windows（WSL）

**Q2: 需要什么版本的 Node.js？**
A: Node.js >= 18

**Q3: 可以离线使用吗？**
A: 部分功能可以，MCP 工具需要网络

**Q4: 如何更新到最新版本？**
A: `npm install -g @liangjie559567/ultrapower@latest`

**Q5: 安装失败怎么办？**
A: 查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md#e003)

### 9.2 使用问题（10 个）

**Q6: Agent 和 Skill 有什么区别？**
A: Agent 是执行单元，Skill 是工作流编排

**Q7: 什么时候用 Team 模式？**
A: 多文件、复杂功能开发

**Q8: 如何查看可用的 agents？**
A: `/ultrapower:omc-help agents`

**Q9: 如何取消正在执行的任务？**
A: `/ultrapower:cancel`

**Q10: 支持哪些编程语言？**
A: TypeScript、Python、Rust、Go、Java、C/C++ 等

**Q11: 如何自定义 agent？**
A: 参考 [USER_GUIDE.md 第 6.4 节](USER_GUIDE.md#64-自定义扩展指南)

**Q12: 执行速度慢怎么办？**
A: 使用 haiku 模型或 ultrawork 并行模式

**Q13: 如何查看执行日志？**
A: `cat .omc/logs/agent-execution.log`

**Q14: 支持多项目吗？**
A: 支持，每个项目独立配置

**Q15: 如何备份配置？**
A: 备份 `.omc/` 和 `.claude/` 目录

### 9.3 配置问题（5 个）

**Q16: 如何配置 MCP？**
A: 编辑 `~/.claude/.omc-config.json`

**Q17: Hook 配置在哪里？**
A: `.claude/hooks/*.json`

**Q18: 如何禁用某个 hook？**
A: 设置 `"enabled": false`

**Q19: Steering 规则如何生效？**
A: 放在 `.kiro/steering/*.md`

**Q20: 如何配置默认执行模式？**
A: 在 `~/.claude/.omc-config.json` 设置 `defaultExecutionMode`

### 9.4 性能问题（3 个）

**Q21: 如何减少 API 成本？**
A: 使用 haiku 模型，避免不必要的 agent 调用

**Q22: 内存占用高怎么办？**
A: 限制并发数，清理日志文件

**Q23: 如何提升执行速度？**
A: 使用并行模式（ultrawork/team）

---

## 10. 版本更新指南

如何更新到最新版本。

**本章节内容**:

* 更新步骤

* 破坏性变更

* 迁移指南

*（待补充）*

---

## 相关文档

* [REFERENCE.md](REFERENCE.md) - 完整功能参考

* [CLAUDE.md](../CLAUDE.md) - 开发规范

* [ARCHITECTURE.md](ARCHITECTURE.md) - 架构设计

* [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 故障排查

* [FAQ.md](FAQ.md) - 常见问题

---

**贡献**: 欢迎提交 PR 改进文档
**许可**: MIT
