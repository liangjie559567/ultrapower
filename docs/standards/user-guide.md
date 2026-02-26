# 用户指南：Skill 决策树与 Agent 路由

> **ultrapower-version**: 5.0.21
> **优先级**: P1（推荐遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-08（Skill 决策树 + Agent 路由指南）

---

## 目录

1. [Skill 决策树](#1-skill-决策树)
   - 1.1 第一层：意图识别
   - 1.2 第二层：规模判断
   - 1.3 第三层：模式选择
2. [Agent 路由指南](#2-agent-路由指南)
   - 2.1 构建/分析通道
   - 2.2 审查通道
   - 2.3 领域专家通道
   - 2.4 产品通道
3. [常见场景速查](#3-常见场景速查)
4. [模型路由规则](#4-模型路由规则)

---

## 1. Skill 决策树

### 1.1 第一层：意图识别（5 个分支）

```
用户输入
  │
  ├─ 意图：新功能 / 需求实现
  │     └─ → 分支 A：功能开发
  │
  ├─ 意图：Bug 修复 / 问题排查
  │     └─ → 分支 B：调试修复
  │
  ├─ 意图：代码审查 / 质量检查
  │     └─ → 分支 C：审查验证
  │
  ├─ 意图：规划 / 架构设计
  │     └─ → 分支 D：规划设计
  │
  └─ 意图：信息查询 / 文档搜索
        └─ → 分支 E：研究探索
```

### 1.2 第二层：规模判断

**分支 A：功能开发**

```
功能开发
  │
  ├─ 规模：单文件 / 小改动（< 3 文件）
  │     └─ executor (sonnet)
  │
  ├─ 规模：多文件 / 中等复杂度（3-20 文件）
  │     └─ team skill → executor + test-engineer + verifier
  │
  └─ 规模：跨模块 / 高复杂度（> 20 文件）
        └─ ralph skill → deep-executor + verifier 循环
```

**分支 B：调试修复**

```
调试修复
  │
  ├─ 已知根因
  │     └─ executor (sonnet)
  │
  ├─ 未知根因
  │     └─ debugger (sonnet) → executor → verifier
  │
  └─ 构建/类型错误
        └─ build-fixer (sonnet)
```

**分支 C：审查验证**

```
审查验证
  │
  ├─ 代码质量
  │     └─ quality-reviewer (sonnet)
  │
  ├─ 安全审查
  │     └─ security-reviewer (sonnet)
  │
  ├─ API 兼容性
  │     └─ api-reviewer (sonnet)
  │
  └─ 综合审查（多维度）
        └─ code-reviewer (opus)
```

**分支 D：规划设计**

```
规划设计
  │
  ├─ 任务规划
  │     └─ plan skill → planner (opus)
  │
  ├─ 架构设计
  │     └─ architect (opus)
  │
  └─ 共识规划（需多方确认）
        └─ ralplan skill → planner + architect + critic
```

**分支 E：研究探索**

```
研究探索
  │
  ├─ 代码库内部搜索
  │     └─ explore (haiku)
  │
  ├─ 外部文档查找
  │     └─ document-specialist (sonnet)
  │
  └─ 深度分析（多维度）
        └─ sciomc skill → 并行 scientist agents
```

### 1.3 第三层：模式选择

根据执行模式关键词自动路由：

| 关键词 | 触发模式 | 适用场景 |
|--------|---------|---------|
| `autopilot` / `build me` | autopilot skill | 从想法到代码的全自主执行 |
| `ultrawork` / `ulw` | ultrawork skill | 最大并行度，多任务同时执行 |
| `ralph` / `don't stop` | ralph skill | 持续执行直到 verifier 验证通过 |
| `team` / `coordinated` | team skill | N 个协调 agents，分阶段流水线 |
| `pipeline` / `chain` | pipeline skill | 顺序 agent 链，数据传递 |
| `swarm` | swarm skill | Team 兼容外观，分阶段流水线 |

**互斥规则**（来源：`docs/standards/state-machine.md` §5）：

- `autopilot`、`ultrapilot`、`swarm`、`pipeline` 四者互斥
- `ralph`、`ultrawork`、`ultraqa`、`team` 可与其他模式组合

---

## 2. Agent 路由指南

### 2.1 构建/分析通道

| Agent | 模型 | 触发条件 | 典型输入 |
|-------|------|---------|---------|
| `explore` | haiku | 需要了解代码库结构、查找文件/符号 | "找到处理 X 的文件" |
| `analyst` | opus | 需求模糊、验收标准不明确 | "分析这个需求的隐性约束" |
| `planner` | opus | 需要任务排序、执行计划 | "规划这个功能的实现步骤" |
| `architect` | opus | 系统设计、接口定义、长期权衡 | "设计这个模块的架构" |
| `debugger` | sonnet | 根因未知、需要回归隔离 | "为什么这个测试失败了" |
| `executor` | sonnet | 已知实现方案、需要代码变更 | "实现这个功能" |
| `deep-executor` | opus | 复杂自主任务、多步骤实现 | "完整实现这个系统" |
| `verifier` | sonnet | 验证完成声明、检查测试充分性 | "验证这个功能是否完整" |

### 2.2 审查通道

| Agent | 模型 | 触发条件 | 关注点 |
|-------|------|---------|-------|
| `style-reviewer` | haiku | 格式/命名/lint 问题 | 代码风格一致性 |
| `quality-reviewer` | sonnet | 逻辑缺陷、可维护性 | 代码质量 |
| `api-reviewer` | sonnet | API 变更、版本兼容性 | 向后兼容 |
| `security-reviewer` | sonnet | 安全漏洞、信任边界 | OWASP Top 10 |
| `performance-reviewer` | sonnet | 性能热点、复杂度 | 内存/延迟 |
| `code-reviewer` | opus | 综合审查（多维度） | 跨关注点 |

**审查通道组合**（来源：`docs/CLAUDE.md` team_compositions）：

```
代码审查：style-reviewer + quality-reviewer + api-reviewer + security-reviewer
```

### 2.3 领域专家通道

| Agent | 模型 | 触发条件 |
|-------|------|---------|
| `dependency-expert` | sonnet | 使用外部 SDK/API/包前 |
| `test-engineer` | sonnet | 测试策略、覆盖率、不稳定测试 |
| `build-fixer` | sonnet | 构建失败、类型错误 |
| `designer` | sonnet | UI/UX 设计、交互设计 |
| `writer` | haiku | 文档、迁移说明 |
| `qa-tester` | sonnet | 交互式 CLI/服务运行时验证 |
| `git-master` | sonnet | 提交策略、历史整洁 |
| `database-expert` | sonnet | 数据库设计、查询优化 |
| `devops-engineer` | sonnet | CI/CD、容器化 |

### 2.4 产品通道

| Agent | 模型 | 触发条件 |
|-------|------|---------|
| `product-manager` | sonnet | 问题定义、用户画像、PRD |
| `ux-researcher` | sonnet | 可用性审计、无障碍 |
| `information-architect` | sonnet | 分类、导航、可发现性 |
| `product-analyst` | sonnet | 产品指标、漏斗分析 |

---

## 3. 常见场景速查

### 场景 1：实现新功能

```
1. analyst (opus)    — 澄清需求、确认验收标准
2. planner (opus)    — 任务排序、执行计划
3. executor (sonnet) — 代码实现
4. test-engineer     — 测试覆盖
5. verifier (sonnet) — 完成验证
```

### 场景 2：修复 Bug

```
1. explore (haiku)   — 定位相关文件
2. debugger (sonnet) — 根因分析
3. executor (sonnet) — 修复实现
4. test-engineer     — 回归测试
5. verifier (sonnet) — 验证修复
```

### 场景 3：代码审查

```
并行执行：
  style-reviewer (haiku)    — 格式/命名
  quality-reviewer (sonnet) — 逻辑/可维护性
  api-reviewer (sonnet)     — API 兼容性
  security-reviewer (sonnet)— 安全漏洞
```

### 场景 4：架构设计

```
1. explore (haiku)   — 了解现有结构
2. architect (opus)  — 系统设计
3. critic (opus)     — 批判性挑战
4. planner (opus)    — 执行计划
```

### 场景 5：全自主执行

```
触发词：autopilot / build me / I want a
流程：autopilot skill → analyst → planner → executor → ultraqa → verifier
```

---

## 4. 模型路由规则

来源：`docs/CLAUDE.md` model_routing 章节

| 模型 | 适用场景 | 成本 |
|------|---------|------|
| `haiku` | 快速查找、轻量扫描、范围较窄的检查 | 低 |
| `sonnet` | 标准实现、调试、审查 | 中 |
| `opus` | 架构、深度分析、复杂重构 | 高 |

**路由原则**：

1. 默认使用 `sonnet`（平衡质量与成本）
2. 简单查找/扫描降级到 `haiku`
3. 架构/深度分析升级到 `opus`
4. 在 Task 调用中通过 `model` 参数显式指定

**示例**：

```typescript
// 轻量扫描
Task(subagent_type="ultrapower:explore", model="haiku", prompt="找到处理 mode 参数的文件")

// 标准实现
Task(subagent_type="ultrapower:executor", model="sonnet", prompt="实现 validateMode 函数")

// 复杂架构
Task(subagent_type="ultrapower:architect", model="opus", prompt="设计状态机迁移方案")
```

---

## 差异点说明

本文档无新增差异点。所有路由规则均来自 `docs/CLAUDE.md` 和 `docs/standards/audit-report.md` 的已确认内容。
