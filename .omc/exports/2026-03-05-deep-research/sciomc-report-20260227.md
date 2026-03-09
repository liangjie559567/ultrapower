# ultrapower v5.2.3 综合分析报告

**Session ID:** sciomc-20260227
**Date:** 2026-02-27
**Status:** 7/7 阶段全部完成

---

## 执行摘要

ultrapower v5.2.3 是一个基于 Claude Agent SDK 的多 agent 编排系统，为 Claude Code 提供完整的 AI 工作流编排能力。系统架构清晰，采用四层洋葱模型，包含 48 个专业 agent、40+ 个事件驱动 hook、3 个 MCP 服务器和 7 种执行模式。

**关键发现：**

* 架构设计成熟，模块边界清晰，依赖方向单向

* Hook 系统存在 1 个已知安全差异点（D-05）和 1 个代码 Bug

* 测试覆盖率整体偏低（25%），team/ 模块零专项测试

* Axiom 工作流系统综合评分 8.2/10，存在 3 处路径引用问题

* 构建系统稳健，双输出格式（ESM + CJS）设计合理

---

## 研究阶段

| 阶段 | 主题 | 层级 | 状态 |
| ------ | ------ | ------ | ------ |
| Stage 1 | 架构概览 | HIGH (opus) | 完成 |
| Stage 2 | Hook 系统分析 | MEDIUM (sonnet) | 完成 |
| Stage 3 | Agent 系统与 MCP 集成 | MEDIUM (sonnet) | 完成 |
| Stage 4 | 安全分析 | HIGH (opus) | 完成 |
| Stage 5 | 测试覆盖率分析 | MEDIUM (sonnet) | 完成 |
| Stage 6 | 构建系统与依赖 | LOW (haiku) | 完成 |
| Stage 7 | Axiom 工作流系统 | MEDIUM (sonnet) | 完成 |

---

## 关键发现

### Finding 1: 四层洋葱架构

**置信度：** HIGH

ultrapower 采用清晰的四层分层架构：

```
Layer 4 — 接口层：cli/, installer/, bridge/
Layer 3 — 编排层：team/, skills/, commands/, hud/
Layer 2 — 核心引擎层：agents/, hooks/, features/, tools/, mcp/
Layer 1 — 基础设施层：lib/, utils/, shared/, constants/
```

依赖方向严格单向（从 Layer 1 到 Layer 4），关键横切依赖：

* `lib/worktree-paths.ts` — 被几乎所有状态相关模块引用

* `lib/validateMode.ts` — 安全关键路径，所有 mode 参数必须经过校验

* `hooks/bridge-normalize.ts` — 安全边界，过滤所有 hook 输入

**核心数据流路径（4 条）：**
1. 用户输入 → keyword-detector → rules-injector → Claude Agent SDK → Agent delegation → MCP tools
2. 工具调用 → PreToolUse hook → 执行 → PostToolUse hook（学习/追踪）
3. 持久模式循环：Ralph/Ultrawork → mode-registry → state file → Stop hook → 继续指令
4. Team Pipeline：plan → prd → exec → verify → fix（循环）

---

### Finding 2: Agent 系统三层路由

**置信度：** HIGH

系统实现了三层独立路由，各层有明确优先级：

**层 1 — 内部模型路由（haiku/sonnet/opus）**

* 17 条规则，优先级 0-100，首匹配获胜

* 关键规则：explicit-model-specified(100) > architect-complex-debugging(85) > security-domain(70) > default-medium(0)

* 所有 agent 均为自适应（adaptive），不再有固定模型绑定

**层 2 — 外部模型路由（Codex/Gemini）**

* 7 级优先级链，从显式参数到硬编码默认值

* Fallback Chain：Codex `gpt-5.3-codex → gpt-5.3 → gpt-5.2-codex → gpt-5.2`

* Fallback Chain：Gemini `gemini-3-pro-preview → gemini-3-flash-preview → gemini-2.5-pro → gemini-2.5-flash`

**层 3 — 委派路由（claude/codex/gemini 提供商）**

* 4 级优先级：显式工具调用 > 配置 roles 映射 > ROLE_CATEGORY_DEFAULTS > defaultProvider(claude)

---

### Finding 3: Hook 系统已知问题

**置信度：** HIGH

**问题 1（安全差异点 D-05）：** `permission-request` Hook 失败时静默降级
```typescript
// 当前实现：始终返回 continue: true，包括权限请求失败时
export function createHookOutput(result) {
  return { continue: true, message: result.message | | undefined };
}
// 规范要求：permission-request 失败时应返回 { continue: false }
```
影响范围：所有工具权限请求场景。已在 `docs/standards/hook-execution-order.md` 记录为 D-05。

**问题 2（代码 Bug）：** `keyword-detector.mjs` 优先级数组重复条目
```javascript
// pipeline、ralplan、plan、tdd、ultrathink、deepsearch、analyze 各出现两次
// research 出现但不在关键词检测列表中（孤立条目）
const priorityOrder = ['cancel','ralph','autopilot','team','ultrawork','pipeline','ralplan','plan','tdd','ultrathink','deepsearch','analyze',
    'pipeline','ccg','ralplan','plan','tdd','research','ultrathink','deepsearch','analyze', // ← 重复
    'codex','gemini'];
```

**问题 3：** 模板层（`templates/*.mjs`）与 TypeScript 层（`src/hooks/bridge.ts`）输出格式不一致

* 模板层：`{ continue, hookSpecificOutput: { hookEventName, additionalContext } }`

* TS 层：`{ continue, message }`

**Ralph 无限循环风险：** 达到 `max_iterations` 时自动追加 +10 次，无硬性上限。唯一终止路径为显式 cancel 或验证通过。

---

### Finding 4: 测试覆盖率缺口

**置信度：** MEDIUM（基于文件存在性推断，非行级覆盖率）

| 指标 | 数值 |
| ------ | ------ |
| 文件覆盖比 | 104/416 = 25% |
| 总测试用例数 | ~2,860 |
| 总断言数 | 4,119 |
| 使用 mock 的文件比例 | 33.7% |
| 包含错误路径测试的文件 | 9.6% |

**严重缺口（零专项测试）：**

| 模块 | 源文件数 | 风险等级 |
| ------ | --------- | --------- |
| `src/team/` | 25 | 严重 — 核心多 agent 编排层 |
| `src/cli/` | 17 | 高 — CLI 命令入口 |
| `src/agents/` | 21 | 高 — 仅 4 个断言 |
| `src/hooks/` 大部分子模块 | 158 | 高 — 覆盖率约 15% |

**高质量测试（亮点）：**

* `validateMode.test.ts` — 覆盖路径遍历、null 字节注入、原型污染、DoS 等 9 类安全向量

* `compatibility-security.test.ts` — 命令白名单、10 种危险环境变量、ReDoS、路径遍历

* `model-routing.test.ts` — 165 个断言，信号提取→评分→规则→路由全链路

---

### Finding 5: 构建系统

**置信度：** HIGH

5 阶段构建流水线：`tsc → build-skill-bridge → build-mcp-server → build-codex-server → build-gemini-server → build-bridge-entry → compose-docs`

| 指标 | 数值 |
| ------ | ------ |
| 生产依赖 | 14 个 |
| 开发依赖 | 13 个 |
| 原生模块 | 2 个（@ast-grep/napi, better-sqlite3） |
| 输出格式 | ESM (dist/) + CJS (bridge/) |
| Node.js 要求 | >=20.0.0 |
| esbuild target | node18 |

**关键设计：** esbuild banner 注入全局 npm 路径解析，解决原生模块在全局安装场景下的路径问题。Agent prompts 在构建时内联到 `__AGENT_PROMPTS__` 常量，bridge 文件可独立运行无需源码目录。

---

### Finding 6: Axiom 工作流系统

**置信度：** HIGH

综合评分：**8.2/10**

| 维度 | 评分 |
| ------ | ------ |
| 架构完整性 | 9/10 |
| 门禁覆盖率 | 7.5/10 |
| 进化引擎安全性 | 9/10 |
| 知识积累质量 | 8/10 |
| 模板设计 | 8.5/10 |
| 一致性 | 7/10 |

**已知问题：**
1. `ax-knowledge` 路径引用错误：SKILL.md 引用 `.omc/knowledge/knowledge_base.md`，实际路径为 `.omc/axiom/evolution/knowledge_base.md`
2. 模式库 pending 比例过高：9 个模式中 7 个（77.8%）处于 pending，均未达到激活阈值（>=3 次出现）
3. Scope Gate 自动化不足：依赖提示词约束而非代码强制，门禁自动化覆盖率 75%（3/4）

**进化引擎安全边界（constitution.md）：**

* Layer 2（自由修改）：`.omc/axiom/evolution/*`、`project-memory.json`

* Layer 1（受审查）：`agents/*.md`、`skills/*/SKILL.md`，需用户确认 + multi-model review

* 不可修改：`constitution.md`、`bridge-normalize.ts`、`validateMode.ts` 等 7 个文件

---

### Finding 7: 安全性分析

**置信度：** HIGH

**整体评级：STRONG** — 7 个安全域全部 PASS，7 层纵深防御体系成熟

| 安全域 | 状态 |
| -------- | ------ |
| 路径遍历防护 | PASS |
| Hook 输入消毒 | PASS |
| Prompt 注入防护 | PASS |
| 权限边界 | PASS |
| 状态文件安全 | PASS |
| 原生模块隔离 | PASS |
| 外部 AI 集成安全 | PASS |

**已知问题：**

| 级别 | 问题 | 位置 |
| ------ | ------ | ------ |
| MEDIUM | D-05：`permission-request` 失败时静默降级（计划 v2 修复） | `src/hooks/persistent-mode/index.ts` |
| LOW | 非敏感 Hook 字段透传（附 debug 警告） | `src/hooks/bridge-normalize.ts` |
| LOW | `subagent-tracker` 未用原子写入 | `src/hooks/subagent-tracker/` |

**最佳实践合规率：87.5%（8 项中 7 项完全合规）**

---

## 改进建议

### 高优先级

1. **修复 Hook D-05 安全差异点**
   - 文件：`src/hooks/persistent-mode/index.ts`
   - 修改：`permission-request` 失败时返回 `{ continue: false }`

1. **修复 keyword-detector.mjs 优先级数组 Bug**
   - 文件：`templates/hooks/keyword-detector.mjs`
   - 修改：去除重复条目，移除孤立的 `research` 条目

1. **修复 ax-knowledge 路径引用**
   - 文件：`skills/ax-knowledge/SKILL.md`
   - 修改：`.omc/knowledge/` → `.omc/axiom/evolution/`

1. **为 team/ 模块添加专项测试**
   - 目标：覆盖 `unified-team.ts`、`task-router.ts`、`merge-coordinator.ts`、`worker-health.ts`
   - 优先级：严重（核心编排层零测试）

### 中优先级

1. **统一 Hook 输出格式**
   - 对齐 `templates/*.mjs` 与 `src/hooks/bridge.ts` 的输出格式

1. **Scope Gate 自动化**
   - 在 CI Gate 前增加 `git diff --name-only` 与 manifest Impact Scope 对比

1. **补全 ax-context / ax-evolution / ax-export 的 SKILL.md**

1. **为 cli/ 和 agents/ 模块增加测试覆盖**

### 低优先级

1. **模式库激活阈值优化**
   - 高置信度（>=0.95）模式允许跳过次数限制

1. **workflow_metrics.md 增加置信区间字段**

---

## 局限性

* 依赖关系图基于代码阅读推断，未使用静态分析工具验证

* 测试覆盖率为文件级推断，非行级覆盖率数据

* 运行时行为（hook 触发频率、agent 调用热点）未通过实际执行数据验证

* `dist/` 编译产物未分析

---

*报告生成时间：2026-02-27 | 安全分析（Stage 4）完成后将更新*
