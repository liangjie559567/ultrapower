# Axiom 系统指南

## 什么是 Axiom？

Axiom 是 ultrapower 的智能工作流引擎，将复杂的多 Agent 编排转化为简单的命令。它通过**持久记忆**、**自动路由**和**门禁规则**，确保每个工作流都高效、可追溯、符合规范。

**核心价值**：从想法到交付的完整工作流自动化，无需手动协调 49 个 agents。

---

## 快速开始

### 第一个工作流示例

```bash

# 1. 提出新需求（触发专家评审）

/ax-draft "添加用户认证模块"

# 2. 专家评审（架构师 + 产品经理）

/ax-review

# 3. 拆解为可执行任务

/ax-decompose

# 4. 开始开发（自动路由 executors）

/ax-implement

# 5. 遇到错误？自动诊断

/ax-analyze-error

# 6. 完成后反思和学习

/ax-reflect
```

### 基本命令

| 命令 | 用途 | 触发 Agent |
| ------ | ------ | ----------- |
| `/ax-draft` | 新需求 → PRD | analyst + product-manager |
| `/ax-review` | 专家评审 | architect + critic |
| `/ax-decompose` | 拆解任务 | planner + analyst |
| `/ax-implement` | 开始开发 | executor + task-specialists |
| `/ax-analyze-error` | 修 Bug | debugger + executor |
| `/ax-reflect` | 总结学习 | architect + scientist |
| `/ax-status` | 查看状态 | - |
| `/ax-suspend` | 保存退出 | - |

---

## 14 个 Axiom Agents

| Agent | 模型 | 职责 |
| ------- | ------ | ------ |
| `analyst` | opus | 需求澄清、验收标准、隐性约束 |
| `architect` | opus | 系统设计、边界、接口、长期权衡 |
| `planner` | opus | 任务排序、执行计划、风险标记 |
| `executor` | sonnet | 代码实现、重构、功能开发 |
| `debugger` | sonnet | 根因分析、回归隔离、故障诊断 |
| `verifier` | sonnet | 完成证据、声明验证、测试充分性 |
| `product-manager` | sonnet | 问题定义、用户画像、PRD |
| `critic` | opus | 计划/设计批判性挑战 |
| `security-reviewer` | sonnet | 漏洞、信任边界、认证/授权 |
| `test-engineer` | sonnet | 测试策略、覆盖率、不稳定测试加固 |
| `designer` | sonnet | UX/UI 架构、交互设计 |
| `writer` | haiku | 文档、迁移说明、用户指南 |
| `build-fixer` | sonnet | 构建/工具链/类型失败 |
| `explore` | haiku | 代码库发现、符号/文件映射 |

---

## 14 个 Axiom Skills

| Skill | 触发词 | 工作流 |
| ------- | -------- | -------- |
| `ax-draft` | "draft", "新需求" | 需求 → PRD 生成 |
| `ax-review` | "review", "评审" | 专家评审门禁 |
| `ax-decompose` | "decompose", "拆解" | 任务分解 |
| `ax-implement` | "implement", "开发" | 执行流水线 |
| `ax-analyze-error` | "error", "bug" | 错误诊断 + 修复 |
| `ax-reflect` | "reflect", "总结" | 学习 + 进化 |
| `ax-status` | "status", "状态" | 查看当前状态 |
| `ax-suspend` | "suspend", "保存" | 保存并退出 |
| `ax-rollback` | "rollback", "回滚" | 回滚到上一步 |
| `ax-knowledge` | "knowledge", "知识库" | 知识库管理 |
| `ax-evolution` | "evolution", "进化" | 查询知识库/模式库 |
| `ax-export` | "export", "导出" | 导出工作流 |
| `ax-gate-expert` | (自动) | 专家评审门禁 |
| `ax-gate-ci` | (自动) | CI 编译门禁 |

---

## 记忆系统

Axiom 维护三层记忆，确保工作流连贯性：

### 1. 活跃上下文（`.omc/axiom/active_context.md`）

```markdown

# 当前工作流状态

状态: EXECUTING
当前阶段: team-exec
任务: 添加用户认证模块
开始时间: 2026-03-08T03:46:35Z
```

### 2. 项目决策（`.omc/axiom/project_decisions.md`）

```markdown

# 架构约束

* 认证: JWT + Redis session

* 数据库: PostgreSQL

* 框架: Express.js

* 禁止: 直接 SQL 拼接
```

### 3. 用户偏好（`.omc/axiom/user_preferences.md`）

```markdown

# 工作流偏好

* 默认模型: sonnet

* 并行度: 4

* 自动审查: 启用

* 学习队列: 启用
```

---

## 门禁规则

### Expert Gate（专家评审）

* **触发**：所有新功能需求

* **流程**：`/ax-draft` → `/ax-review` → 确认

* **通过条件**：架构师 + 产品经理同意

### User Gate（PRD 确认）

* **触发**：PRD 终稿生成

* **动作**：显示 "PRD 已生成，是否确认执行？(Yes/No)"

* **通过条件**：用户确认

### CI Gate（编译提交）

* **触发**：代码修改完成

* **命令**：`tsc --noEmit && npm run build && npm test`

* **通过条件**：无错误

### Scope Gate（范围检查）

* **触发**：修改文件时

* **检查**：是否在 `manifest.md` 的 `Impact Scope` 内

* **动作**：越界修改需用户确认

---

## 实际示例

### 示例 1：完整功能开发流程

```bash

# 第 1 步：提出需求

/ax-draft "实现 OAuth2 登录"

# 输出：

# ✓ PRD 已生成

# ✓ 验收标准：

#   - 支持 Google/GitHub 登录

#   - 自动创建用户账户

#   - 返回 JWT token

# 第 2 步：专家评审

/ax-review

# 输出：

# ✓ 架构师审查：设计合理，建议添加 rate limiting

# ✓ 产品经理审查：符合需求

# ✓ 安全审查：需要 CSRF 防护

# 第 3 步：拆解任务

/ax-decompose

# 输出：

# ✓ 任务 1: 配置 OAuth2 提供商 (30 min)

# ✓ 任务 2: 实现登录端点 (45 min)

# ✓ 任务 3: 添加单元测试 (30 min)

# ✓ 任务 4: 集成测试 (20 min)

# 第 4 步：开始开发

/ax-implement

# 输出：

# ✓ 任务 1 完成 (executor)

# ✓ 任务 2 完成 (executor)

# ✓ 任务 3 完成 (test-engineer)

# ✓ 任务 4 完成 (qa-tester)

# ✓ 代码审查通过 (code-reviewer)

# ✓ 安全审查通过 (security-reviewer)

```

### 示例 2：错误诊断和修复

```bash

# 构建失败

npm run build

# Error: Type 'User' is not assignable to type 'UserDTO'

# 自动诊断

/ax-analyze-error

# 输出：

# ✓ 根因：User model 缺少 email 字段

# ✓ 影响范围：3 个文件

# ✓ 修复方案：添加 email 字段到 User model

# ✓ 修复中...

# ✓ 修复完成，重新构建

# ✓ 构建成功

```

### 示例 3：工作流反思

```bash

# 完成后反思

/ax-reflect

# 输出：

# ✓ 工作流总结：

#   - 总耗时：2.5 小时

#   - 任务数：4

#   - 成功率：100%

#   - 平均任务时间：37.5 min
#

# ✓ 学习收获：

#   - 模式：OAuth2 集成最佳实践

#   - 反模式：避免在 middleware 中做 DB 查询

#   - 性能优化：使用 Redis 缓存 token 验证
#

# ✓ 知识库已更新

```

---

## 状态恢复

Axiom 自动检测中断的工作流：

```bash

# 会话启动时自动检测

# 如果存在 .omc/axiom/active_context.md

状态: EXECUTING
当前阶段: team-exec
任务: 添加用户认证模块

是否继续？(Yes/No)
```

**状态类型**：

* `IDLE` - 系统就绪，等待指令

* `EXECUTING` - 工作流进行中，可继续

* `BLOCKED` - 遇到问题，需人工介入

* `ARCHIVING` - 自动触发 `/ax-reflect`

---

## 进化引擎

Axiom 自动学习和改进：

| 触发事件 | 自动行为 |
| --------- | --------- |
| 任务完成 | 代码变更加入 `learning_queue.md` |
| 错误修复成功 | 修复模式加入学习队列 (P1) |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |
| 状态 → IDLE | 处理学习队列 (P0/P1) |

---

## 常见场景

### 场景 1：快速修复 Bug

```bash
/ax-analyze-error "TypeError: Cannot read property 'id' of undefined"
```

### 场景 2：重构现有模块

```bash
/ax-draft "重构认证模块，提高可维护性"
/ax-decompose
/ax-implement
```

### 场景 3：性能优化

```bash
/ax-draft "优化数据库查询性能"
/ax-review  # 架构师评审方案
/ax-implement
```

### 场景 4：查询知识库

```bash
/ax-evolution knowledge "JWT 最佳实践"
/ax-evolution patterns "错误处理"
```

---

## 下一步

* 📖 [完整 API 文档](./REFERENCE.md)

* 🏗️ [架构设计指南](./ARCHITECTURE.md)

* 🔒 [安全规范](./standards/runtime-protection.md)

* 🧪 [测试策略](./standards/testing-strategy.md)
