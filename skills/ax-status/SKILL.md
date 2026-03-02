---
name: ax-status
description: "/ax-status — Axiom 状态仪表盘：显示当前任务状态、进度、记忆摘要和系统健康"
---

# Axiom 状态仪表盘

本 skill 提供 Axiom 系统的完整状态概览。

**开始时宣告：** "I'm using the ax-status skill to show the system dashboard."

## 执行步骤

### Step 1: 读取所有状态文件

并行读取：
- `.omc/axiom/active_context.md` — 当前任务状态
- `.omc/axiom/state_machine.md` — 状态机状态
- `.omc/axiom/evolution/learning_queue.md` — 待处理学习素材数量
- `.omc/axiom/evolution/workflow_metrics.md` — 工作流指标

### Step 2: 生成状态报告

输出格式：

```markdown
# Axiom 状态仪表盘 - YYYY-MM-DD HH:MM

## 系统状态
- 当前状态: [IDLE/PLANNING/EXECUTING/...]
- 上次检查点: [checkpoint-xxx]
- 活跃任务: [T-xxx 或 无]

## 任务进度
- 总任务数: X
- 已完成: X (X%)
- 进行中: X
- 阻塞: X

## 记忆系统
- 知识条目: X 条 (活跃: X, 废弃: X)
- 代码模式: X 个 (活跃: X, 待提升: X)
- 学习队列: X 条待处理
- 反思日志: X 条

## 工作流指标
- 最近工作流: [名称] (成功率: X%)
- 平均任务耗时: X 分钟
- 自动修复成功率: X%

## 推荐操作
- [基于当前状态的建议]
```

### Step 2b: 最近模式晋升记录

调用 `getRecentPromotions(7)` 读取 `pattern_library.md` 中最近 7 天内 `status: active` 的条目，输出：

```markdown
## 最近晋升模式（7天内）
- [P-xxx] [模式名称] — [category]
```

若无晋升条目，输出 `（近7天无新晋升）`。

### Step 3: 健康检查

检查以下文件是否存在且格式正确：
- `.omc/axiom/active_context.md`
- `.omc/axiom/project_decisions.md`
- `.omc/axiom/evolution/knowledge_base.md`

若文件缺失，提示用户运行 `/ax-context init` 初始化。

### Step 4: 可观测性摘要

调用 `queryEngine` 查询本 session 的可观测性数据并追加到报告末尾：

```typescript
import { queryEngine } from 'src/hooks/observability/query-engine.js';
const runs  = queryEngine.getAgentRuns({ last: 5 });
const tools = queryEngine.getToolCalls({ last: 5 });
const costs = queryEngine.getCostSummary();
```

输出格式（追加在报告末尾）：

```markdown
## 可观测性快照
- Top agents: [agent_type(avg_ms)] ...
- Top tools:  [tool_name(p95_ms, failure_rate)] ...
- 本次成本:   $X.XXXX USD
```

若数据库无数据则跳过此节。
