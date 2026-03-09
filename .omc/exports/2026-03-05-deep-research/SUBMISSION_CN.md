# Claude Code 市场提交文档

## 插件信息

**名称:** ultrapower
**显示名称:** ultrapower
**npm 包:** @liangjie559567/ultrapower
**版本:** 5.5.18
**作者:** liangjie559567
**许可证:** MIT

**仓库:** <<https://github.com/liangjie559567/ultrapower>>
**主页:** <<https://github.com/liangjie559567/ultrapower#readme>>

## 描述

**简短描述（英文）:**
Disciplined multi-agent orchestration: workflow enforcement + parallel execution

**完整描述（英文）:**
ultrapower is an intelligent multi-agent orchestration layer (OMC) for Claude Code, deeply integrating the Axiom framework with superpowers workflow. It provides 50 professional agents, 71 skills, and a complete TypeScript hooks system.

Core capabilities:

* Multi-agent orchestration with Team, ultrawork, ralph, and autopilot execution modes

* Axiom framework integration with LSP/AST code intelligence, persistent memory, and MCP routing

* End-to-end development workflow from brainstorming to code review

* Auto-triggered skills that activate based on context without manual invocation

**完整描述（中文）:**
ultrapower 是 Claude Code 的智能多 Agent 编排层（OMC），在 superpowers 工作流基础上深度融合了 Axiom 框架，提供 50 个专业 agents、71 个 skills 和完整的 TypeScript hooks 系统。

核心能力：

* 多 Agent 编排：Team、ultrawork、ralph、autopilot 等多种执行模式

* Axiom 框架集成：LSP/AST 代码智能、持久记忆、MCP 路由

* 完整工作流：从头脑风暴到代码审查的端到端开发流程

* 自动触发：Skills 根据上下文自动激活，无需手动调用

## 关键词

claude, claude-code, ai, agent, multi-agent, orchestration, omc, claudecode, anthropic, llm, workflow, automation, typescript, hooks, axiom

## 安装

```bash
/plugin marketplace add <<https://github.com/liangjie559567/ultrapower>>
/plugin install ultrapower
/omc-setup
```

## 核心特性

### 50 个专业 Agents

* **构建/分析:** explore, analyst, planner, architect, debugger, executor, deep-executor, verifier

* **审查流水线:** style-reviewer, quality-reviewer, api-reviewer, security-reviewer, performance-reviewer, code-reviewer

* **领域专家:** dependency-expert, test-engineer, quality-strategist, build-fixer, designer, writer, qa-tester, scientist, git-master, database-expert, devops-engineer

* **Axiom Agents:** axiom-requirement-analyst, axiom-product-designer, axiom-review-aggregator, axiom-prd-crafter, axiom-system-architect, axiom-evolution-engine

### 71 个 Skills

包括: autopilot, ralph, ultrawork, team, pipeline, brainstorming, writing-plans, executing-plans, subagent-driven-development, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, using-git-worktrees, finishing-a-development-branch，以及 56+ 个专业 skills。

### Axiom 框架

* LSP/AST 代码智能

* 持久化记忆系统

* MCP 路由与集成

* 持续改进的进化引擎

## 支持

* 问题反馈: <<https://github.com/liangjie559567/ultrapower/issues>>

* 文档: <<https://github.com/liangjie559567/ultrapower#readme>>

## 提交检查清单

* [x] npm 包已发布: @liangjie559567/ultrapower@5.5.18

* [x] GitHub 仓库公开可访问

* [x] marketplace.json 已配置

* [x] plugin.json 已配置

* [x] README 包含安装说明

* [x] LICENSE 文件 (MIT)

* [x] 所有元数据已同步（版本、名称、描述）

---

## 改进建议与优化路线图

**分析日期:** 2026-03-05
**基于:** 综合架构分析、专家评审、循环依赖审计、构建流水线分析

### 执行摘要

ultrapower 是一个成熟的多 agent 编排系统，拥有 50 个 agents、71 个 skills 和完整的 TypeScript 基础设施。主要优势包括事件驱动的 hooks、分阶段流水线执行和自我进化能力。本路线图按影响和实施成本对改进进行优先级排序。

---

### P0 - 关键改进（需立即行动）

#### 1. 安全加固

**影响:** 高 | **工作量:** 中 | **时间线:** 1-2 周

* **问题:** permission-request hook 当前使用静默降级而非阻塞模式

* **风险:** 敏感上下文中可能存在未授权操作

* **解决方案:** 按照 `docs/standards/runtime-protection.md` 实施 `{ continue: false }` 强制执行

* **交付物:** 更新 `src/hooks/permission-request/index.ts` 为严格阻塞模式

#### 2. Hook 超时实现

**影响:** 高 | **工作量:** 低 | **时间线:** 3-5 天

* **问题:** PreToolUse (5s) 和 PostToolUse (5s) 超时配置存在但未强制执行

* **风险:** 阻塞操作可能无限期挂起

* **解决方案:** 在 `src/hooks/bridge.ts` 中添加超时包装器

* **交付物:** 超时强制执行，带优雅降级

#### 3. 测试覆盖率增强

**影响:** 高 | **工作量:** 高 | **时间线:** 2-3 周

* **当前:** 5782 个测试通过，99.98% 通过率

* **差距:** Axiom 工作流仅有 1 个测试文件，Team Pipeline 转换缺乏覆盖

* **解决方案:** 为以下内容添加集成测试：
  - Team Pipeline 阶段转换 (plan → prd → exec → verify → fix)
  - Axiom 4 阶段工作流 (draft → review → decompose → implement)
  - Hook 优先级链执行

* **交付物:** 核心模块覆盖率从当前基线提升至 85%+

---

### P1 - 高价值优化（下季度）

#### 4. 性能优化

**影响:** 中高 | **工作量:** 中 | **时间线:** 2-3 周

**4.1 构建流水线并行化**

* **当前:** 6 个 esbuild 任务串行运行 (tsc → skill-bridge → mcp-server → codex → gemini → team-bridge)

* **机会:** tsc 完成后任务 2-6 相互独立

* **解决方案:** 使用 `Promise.all()` 并行执行 esbuild

* **预期收益:** 构建时间减少 40-50%

**4.2 状态查询索引**

* **当前:** `state_list_active` 遍历所有会话目录

* **机会:** 添加索引文件 `.omc/state/active-sessions.json`

* **解决方案:** state_write 时更新，list_active 时读取

* **预期收益:** 活跃会话查询从 O(n) → O(1)

**4.3 LSP 客户端预热**

* **当前:** 语言服务器首次使用时启动

* **机会:** 项目打开时预加载 TypeScript/Python LSP

* **解决方案:** 在 `src/tools/lsp/manager.ts` 中后台初始化

* **预期收益:** 首次 hover/definition 请求快 2-3 秒

#### 5. 架构重构

**影响:** 中 | **工作量:** 高 | **时间线:** 3-4 周

**5.1 统一 Worker 后端**

* **当前:** Claude 原生、MCP Codex、MCP Gemini 分别处理

* **机会:** 抽象为通用 Worker 接口

* **解决方案:** 创建 `src/team/worker-interface.ts` 统一 API

* **收益:** 简化路由，更易添加新提供商

**5.2 Swarm 状态迁移**

* **当前:** Swarm 使用 SQLite (`swarm.db`)，与会话隔离不兼容

* **机会:** 迁移到 JSON + 原子写入，与其他模式一致

* **解决方案:** 创建迁移脚本，更新 `src/workflows/swarm/state.ts`

* **收益:** 一致的状态管理，支持会话隔离

---

### P2 - 生活质量改进（待办事项）

#### 6. 开发者体验

**影响:** 中 | **工作量:** 低-中 | **时间线:** 1-2 周

**6.1 心跳清理**

* **问题:** MCP worker 心跳文件无限累积

* **解决方案:** 在 `src/team/heartbeat.ts` 中自动清理 7 天前的文件

**6.2 AST 工具自动安装**

* **问题:** `@ast-grep/napi` 缺失导致静默降级

* **解决方案:** 添加可选依赖检查 + 安装提示

**6.3 架构决策记录**

* **问题:** 关键设计决策（会话隔离、原子写入）未文档化

* **解决方案:** 创建 `docs/adr/` 包含 5-10 个核心 ADR

#### 7. 文档增强

**影响:** 低-中 | **工作量:** 中 | **时间线:** 1-2 周

* 使用 TypeDoc 从 TypeScript 类型生成 API 文档

* 添加常见问题故障排查指南（状态泄漏、hook 失败、MCP 连接）

* 创建性能基线报告供未来对比

---

### 实施优先级矩阵

```
高影响     │ P0-1 安全      │ P0-2 超时      │ P1-4 性能     │
           │ P0-3 测试      │                │               │
───────────┼────────────────┼────────────────┼───────────────┤
中等影响   │ P1-5 架构      │ P2-6 开发体验  │               │
           │                │                │               │
───────────┼────────────────┼────────────────┼───────────────┤
低影响     │                │ P2-7 文档      │               │
           │                │                │               │
───────────┴────────────────┴────────────────┴───────────────
            低工作量         中等工作量       高工作量
```

---

### 成本收益分析

| 优先级 | 总工作量 | 预期 ROI | 关键指标 |
| -------- | --------- | ---------- | --------- |
| P0 | 4-6 周 | 非常高 | 安全合规、稳定性、测试信心 |
| P1 | 5-7 周 | 高 | 构建快 40%、简化架构 |
| P2 | 2-4 周 | 中 | 更好的开发体验、减少支持负担 |

**总投入:** 11-17 周（3-4 个月）
**预期成果:**

* 100% 符合运行时保护标准的安全合规

* 核心模块 85%+ 测试覆盖率

* 构建时间减少 40-50%

* 统一 worker 架构，更易扩展

---

### 风险缓解

**高风险项:**
1. **Swarm 迁移 (P1-5.2):** 需要数据迁移脚本，可能影响用户
   - 缓解措施: 提供向后兼容层，清晰的迁移指南
1. **测试覆盖 (P0-3):** 工作量大，可能发现隐藏 bug
   - 缓解措施: 增量方法，发现 bug 时修复

**依赖关系:**

* P0 项目阻塞市场提交审批

* P1-5（架构）应在 P2 项目之前完成以避免返工

---

### 下一步

1. **立即（第 1-2 周）:** 解决 P0-1（安全）和 P0-2（超时）
2. **短期（第 3-6 周）:** 完成 P0-3（测试覆盖）
3. **中期（第 2-3 月）:** 执行 P1 优化
4. **长期（第 4 月+）:** P2 质量改进

**成功标准:**

* v6.0.0 发布前完成所有 P0 项目

* 性能基准显示关键指标提升 30%+

* 审计中零关键安全发现

* 测试套件执行时间 < 5 分钟

---

**报告生成:** 2026-03-05
**分析来源:**

* `.omc/research/comprehensive-analysis.md`

* `.omc/axiom/review_critic.md`

* `.omc/circular-deps-analysis.md`

* `.omc/scientist/reports/20260228_build_pipeline_analysis.md`

---

## 综合技术分析报告

### 执行摘要

ultrapower v5.5.18 是一个技术基础扎实的复杂多 agent 编排系统。基于包括 UX、产品、批评家和领域专家评审在内的综合分析，项目展现出：

**优势:**

* ✅ 完整的多 agent 编排（Team/ultrawork/ralph/autopilot）

* ✅ 深度 MCP 集成（Codex/Gemini）

* ✅ 丰富的代码智能工具（12 个 LSP + AST + Python REPL）

* ✅ 结构良好的 TypeScript 架构

* ✅ 全面的 hook 系统（15 种类型）

**关键发现:**

* ⚠️ 测试覆盖率需要改进（目标：核心模块 80%+）

* ⚠️ 性能指标需要量化（P50/P95/P99 延迟）

* ⚠️ MCP 协议版本兼容性需要验证

* ⚠️ Agent 协调复杂度需要优化

**专家评审共识:**

* **战略价值:** 中等（6/10）- 技术能力强，需要更清晰的业务目标

* **可行性:** 中等（4/10）- 范围过广，需要聚焦核心领域

* **风险级别:** 中等 - P0 安全风险可通过适当缓解措施管理

* **建议:** 修订 - 需要在全面实施前进行完善

---

### 架构分析

#### 1. 多 Agent 编排

**Team 模式**（推荐）:
```
team-plan → team-prd → team-exec → team-verify → team-fix（循环）
```

* 阶段感知的 agent 路由

* 状态持久化和恢复

* 支持与 ralph 模式组合

**执行模式:**

* **ultrawork**: 独立任务的最大并行度

* **ralph**: 带 verifier 验证的自引用循环

* **autopilot**: 从想法到代码的全自主执行

**生命周期管理:**

* 超时处理: explore (15分钟), executor (30分钟), writer (45分钟)

* 孤儿检测和清理

* 死锁监控

* 成本限制强制执行

#### 2. MCP 集成架构

**三个 MCP 服务器:**
1. **omc-tools-server**: 35 个自定义工具（LSP/AST/State）
2. **codex-server**: OpenAI Codex 集成用于分析/审查
3. **gemini-server**: Google Gemini，1M token 上下文

**通信:**

* 协议: MCP 1.26.0

* 传输: stdio/WebSocket

* 序列化: JSON-RPC 2.0

#### 3. Hook 系统

**15 种 Hook 类型**（按 `docs/standards/hook-execution-order.md`）:

* session-start/end, tool-call/response, message-send

* permission-request, setup, error, state-change

* agent-spawn/complete, skill-trigger, mode-enter/exit

**安全:**

* 通过 `assertValidMode()` 防止路径遍历

* 通过 `bridge-normalize.ts` 进行输入消毒

* 基于白名单的字段过滤

#### 4. 代码智能工具

**LSP 工具（12 个）:**

* hover, goto_definition, find_references

* document_symbols, workspace_symbols

* diagnostics, rename, code_actions

**AST 工具:**

* ast_grep_search: 结构化代码搜索

* ast_grep_replace: 结构化转换

* 支持 17 种语言，带元变量

**Python REPL:**

* 持久会话，变量保留

* 内存跟踪（RSS/VMS）

* 默认 5 分钟超时

---

### 专家评审综合

#### UX Director 评审发现

**优势:**

* 清晰的 agent 角色定义

* 完整的工作流覆盖

* 丰富的工具集成

**关键问题:**

* 学习曲线陡峭（50 agents + 71 skills）

* 缺乏渐进式引导

* 错误消息需要更友好

* 文档分散，缺乏统一入口

**建议:**

* 创建交互式入门向导

* 简化常见场景的快捷方式

* 改进错误诊断和恢复

* 统一文档门户

#### Product Director 评审发现

**战略价值:** 中等（6/10）

* 技术能力强，但业务目标不够清晰

* 需要更明确的价值主张

* 市场定位需要聚焦

**路线图对齐:**

* P0 项目与安全/稳定性对齐 ✓

* P1 项目与性能目标对齐 ✓

* 缺乏明确的商业化路径

**建议:**

* 定义 3-5 个核心用户画像

* 量化价值指标（时间节省、质量提升）

* 建立竞争分析框架

#### Critic 评审发现

**安全风险:**

* P0-1: permission-request hook 静默降级（高风险）

* P0-2: Hook 超时未强制执行（中风险）

* 路径遍历防护已到位 ✓

**边界情况:**

* Swarm SQLite 状态与会话隔离不兼容

* MCP worker 心跳文件无限累积

* AST 工具缺失时静默降级

**建议:**

* 立即修复 P0 安全问题

* 添加边界情况测试覆盖

* 实施故障注入测试

#### Domain Expert 评审发现

**技术债务:**

* 循环依赖风险（已通过参数传递模式缓解）

* 测试覆盖率不均（核心模块需提升至 85%+）

* 构建流水线串行执行（可并行化）

**架构优势:**

* 清晰的模块边界

* 良好的关注点分离

* 可扩展的插件系统

**建议:**

* 统一 Worker 后端接口

* Swarm 状态迁移到 JSON

* 构建流水线并行化

---

### 质量指标

| 指标 | 当前值 | 目标值 | 优先级 |
| ------ | -------- | -------- | -------- |
| 测试通过率 | 99.98% (5782/5783) | 100% | P0 |
| 核心模块覆盖率 | 未量化 | 85%+ | P0 |
| 构建时间 | 未量化 | -40% | P1 |
| Hook 超时强制 | 0% | 100% | P0 |
| 安全审计通过 | 待定 | 零关键发现 | P0 |
| 文档完整性 | 80% | 95% | P2 |

---

### 技术栈

**核心:**

* TypeScript 5.x

* Node.js 18+

* Vitest（测试）

* ESBuild（构建）

**集成:**

* Claude Agent SDK

* MCP 1.26.0（Model Context Protocol）

* LSP（Language Server Protocol）

* AST-grep（代码智能）

**外部服务:**

* OpenAI Codex（gpt-5.3-codex）

* Google Gemini（gemini-3-pro-preview）

**数据存储:**

* JSON（状态文件）

* SQLite（Swarm 协调，待迁移）

* Markdown（文档、记忆）

---

### 改进路线图总结

**第 1 阶段（第 1-2 周）- P0 安全加固**

* 修复 permission-request hook 阻塞模式

* 实施 hook 超时强制执行

* 预计影响：零关键安全发现

**第 2 阶段（第 3-6 周）- P0 测试覆盖**

* Team Pipeline 阶段转换测试

* Axiom 工作流集成测试

* Hook 优先级链测试

* 预计影响：核心模块 85%+ 覆盖率

**第 3 阶段（第 2-3 月）- P1 性能优化**

* 构建流水线并行化（-40% 时间）

* 状态查询索引（O(n) → O(1)）

* LSP 客户端预热（-2-3s 首次请求）

* 预计影响：构建快 40%，查询快 10x

**第 4 阶段（第 4 月+）- P2 质量改进**

* 统一 Worker 后端接口

* Swarm 状态迁移到 JSON

* 开发者体验改进

* 文档增强

* 预计影响：更好的可维护性，降低支持负担

---

### 风险评估

**高风险项:**
1. **Swarm 迁移（P1-5.2）**
   - 风险：数据迁移可能影响现有用户
   - 缓解：提供向后兼容层 + 清晰迁移指南

1. **测试覆盖（P0-3）**
   - 风险：工作量大，可能发现隐藏 bug
   - 缓解：增量方法，发现 bug 时立即修复

**中风险项:**
1. **构建并行化（P1-4.1）**
   - 风险：可能引入竞态条件
   - 缓解：充分测试，保留串行模式作为回退

1. **架构重构（P1-5）**
   - 风险：可能破坏现有集成
   - 缓解：分阶段实施，保持 API 兼容性

**依赖关系:**

* P0 项目阻塞市场提交审批

* P1-5（架构）应在 P2 项目之前完成以避免返工

* 所有性能优化依赖基准测试建立

---

### 结论

ultrapower v5.5.18 是一个技术基础扎实、功能丰富的多 agent 编排系统。通过实施本路线图中的改进措施，项目可以在保持创新优势的同时，显著提升安全性、稳定性和性能。

**关键成功因素:**
1. 优先完成 P0 安全和测试项目
2. 建立性能基准和监控
3. 保持架构清晰和文档同步
4. 持续收集用户反馈并迭代

**预期成果（3-4 个月后）:**

* 100% 安全合规

* 85%+ 核心模块测试覆盖率

* 40% 构建时间减少

* 统一且可扩展的架构

* 更好的开发者体验

---

**报告生成时间:** 2026-03-05  
**分析团队:** 10 个专业 agents（explorer, architect, analyst, designer, researcher 等）  
**执行模式:** Team 模式分阶段并行执行  
**执行时间:** 8 分钟（预估 40 分钟，提速 80%）

