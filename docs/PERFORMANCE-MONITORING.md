# 性能监控指南

全面的 Claude Code 和 ultrapower 性能监控、调试与优化指南。

---

## 目录

* [概述](#overview)

* [内置监控](#built-in-monitoring)
  - [Agent Observatory](#agent-observatory)
  - [Token 与费用分析](#token--cost-analytics)
  - [会话回放](#session-replay)

* [HUD 集成](#hud-integration)

* [调试技术](#debugging-techniques)

* [外部资源](#external-resources)

* [最佳实践](#best-practices)

* [故障排除](#troubleshooting)

---

## 概述

ultrapower 提供全面的监控功能，用于追踪 agent 性能、token 使用情况、费用，以及识别多 agent 工作流中的瓶颈。本指南涵盖监控 Claude 性能的内置工具和外部资源。

### 可监控的内容

| 指标 | 工具 | 粒度 |
| -------- | ------ | ------------- |
| Agent 生命周期 | Agent Observatory | 每个 agent |
| 工具计时 | 会话回放 | 每次工具调用 |
| Token 使用量 | 分析系统 | 每个会话/agent |
| API 费用 | 分析系统 | 每个会话/每日/每月 |
| 文件所有权 | Subagent Tracker | 每个文件 |
| 并行效率 | Observatory | 实时 |

---

## 内置监控

### Agent Observatory

Agent Observatory 提供对所有运行中 agent、其性能指标和潜在问题的实时可见性。

#### 访问 Observatory

当 agent 运行时，observatory 会自动显示在 HUD 中。您也可以通过编程方式查询：

```typescript
import { getAgentObservatory } from 'ultrapower/hooks/subagent-tracker';

const obs = getAgentObservatory(process.cwd());
console.log(obs.header);  // "Agent Observatory (3 active, 85% efficiency)"
obs.lines.forEach(line => console.log(line));
```

#### Observatory 输出

```
Agent Observatory (3 active, 85% efficiency)
🟢 [a1b2c3d] executor 45s tools:12 tokens:8k $0.15 files:3
🟢 [e4f5g6h] document-specialist 30s tools:5 tokens:3k $0.08
🟡 [i7j8k9l] architect 120s tools:8 tokens:15k $0.42
   └─ bottleneck: Grep (2.3s avg)
⚠ architect: Cost $0.42 exceeds threshold
```

#### 状态指示器

| 图标 | 含义 |
| ------ | --------- |
| 🟢 | 健康——agent 正常运行 |
| 🟡 | 警告——建议干预 |
| 🔴 | 严重——agent 已停滞（>5 分钟） |

#### 关键指标

| 指标 | 描述 |
| -------- | ------------- |
| `tools:N` | 已进行的工具调用次数 |
| `tokens:Nk` | 近似 token 使用量（千） |
| `$X.XX` | 估算费用（美元） |
| `files:N` | 正在修改的文件数 |
| `bottleneck` | 最慢的重复工具操作 |

### Token 与费用分析

OMC 自动追踪所有会话的 token 使用情况和费用。

#### CLI 命令

```bash

# 查看当前会话统计

omc stats

# 查看每日/每周/每月费用报告

omc cost daily
omc cost weekly
omc cost monthly

# 查看会话历史

omc sessions

# 查看 agent 明细

omc agents

# 导出数据

omc export cost csv ./costs.csv
```

#### 实时 HUD 显示

在状态栏中启用 analytics 预设以获得详细的费用追踪：

```json
{
  "omcHud": {
    "preset": "analytics"
  }
}
```

显示内容：

* 会话费用和 token 数

* 每小时费用

* 缓存效率（来自缓存的 token 百分比）

* 预算警告（>$2 警告，>$5 严重警告）

#### 回填历史数据

分析历史 Claude Code 转录：

```bash

# 预览可用转录

omc backfill --dry-run

# 回填所有转录

omc backfill

# 回填特定项目

omc backfill --project "*my-project*"

# 仅回填最近的

omc backfill --from "2026-01-01"
```

### 会话回放

会话回放将 agent 生命周期事件记录为 JSONL，用于会话后分析和时间线可视化。

#### 事件类型

| 事件 | 描述 |
| ------- | ------------- |
| `agent_start` | Agent 已生成，包含任务信息 |
| `agent_stop` | Agent 已完成/失败，包含持续时间 |
| `tool_start` | 工具调用开始 |
| `tool_end` | 工具完成，包含计时 |
| `file_touch` | 文件被 agent 修改 |
| `intervention` | 系统干预已触发 |

#### 回放文件

回放数据存储在：`.omc/state/agent-replay-{sessionId}.jsonl`

每行是一个 JSON 事件：
```json
{"t":0.0,"agent":"a1b2c3d","agent_type":"executor","event":"agent_start","task":"Implement feature","parent_mode":"ultrawork"}
{"t":5.2,"agent":"a1b2c3d","event":"tool_start","tool":"Read"}
{"t":5.4,"agent":"a1b2c3d","event":"tool_end","tool":"Read","duration_ms":200,"success":true}
```

#### 分析回放数据

```typescript
import { getReplaySummary } from 'ultrapower/hooks/subagent-tracker/session-replay';

const summary = getReplaySummary(process.cwd(), sessionId);

console.log(`Duration: ${summary.duration_seconds}s`);
console.log(`Agents: ${summary.agents_spawned} spawned, ${summary.agents_completed} completed`);
console.log(`Bottlenecks:`, summary.bottlenecks);
console.log(`Files touched:`, summary.files_touched);
```

#### 瓶颈检测

回放系统自动识别瓶颈：

* 平均耗时 >1s 且调用次数 ≥2 的工具

* 每个 agent 的工具计时分析

* 按影响排序（平均时间最长的优先）

---

## HUD 集成

### 预设

| 预设 | 关注点 | 元素 |
| -------- | ------- | ---------- |
| `minimal` | 简洁状态 | 仅上下文栏 |
| `focused` | 任务进度 | Todos、agents、模式 |
| `full` | 全部内容 | 所有元素启用 |
| `analytics` | 费用追踪 | Token、费用、效率 |
| `dense` | 紧凑全部 | 压缩格式 |

### 配置

编辑 `~/.claude/settings.json`：

```json
{
  "omcHud": {
    "preset": "focused",
    "elements": {
      "agents": true,
      "todos": true,
      "contextBar": true,
      "analytics": true
    }
  }
}
```

### 自定义元素

| 元素 | 描述 |
| --------- | ------------- |
| `agents` | 活跃 agent 数量和状态 |
| `todos` | Todo 进度（已完成/总计） |
| `ralph` | Ralph 循环迭代次数 |
| `autopilot` | Autopilot 阶段指示器 |
| `contextBar` | 上下文窗口使用百分比 |
| `analytics` | Token/费用摘要 |

---

## 调试技术

### 识别慢速 Agent

1. **检查 Observatory** 中运行超过 2 分钟的 agent
2. **查找瓶颈指示器**（工具平均耗时 >1s）
3. **查看 agent 状态中的** `tool_usage`

```typescript
import { getAgentPerformance } from 'ultrapower/hooks/subagent-tracker';

const perf = getAgentPerformance(process.cwd(), agentId);
console.log('Tool timings:', perf.tool_timings);
console.log('Bottleneck:', perf.bottleneck);
```

### 检测文件冲突

当多个 agent 修改同一文件时：

```typescript
import { detectFileConflicts } from 'ultrapower/hooks/subagent-tracker';

const conflicts = detectFileConflicts(process.cwd());
conflicts.forEach(c => {
  console.log(`File ${c.file} touched by: ${c.agents.join(', ')}`);
});
```

### 干预系统

OMC 自动检测有问题的 agent：

| 干预 | 触发条件 | 操作 |
| -------------- | --------- | -------- |
| `timeout` | Agent 运行 >5 分钟 | 建议终止 |
| `excessive_cost` | 费用 >$1.00 | 警告 |
| `file_conflict` | 多个 agent 操作同一文件 | 警告 |

```typescript
import { suggestInterventions } from 'ultrapower/hooks/subagent-tracker';

const interventions = suggestInterventions(process.cwd());
interventions.forEach(i => {
  console.log(`${i.type}: ${i.reason} → ${i.suggested_action}`);
});
```

### 并行效率评分

追踪并行 agent 的执行效果：

```typescript
import { calculateParallelEfficiency } from 'ultrapower/hooks/subagent-tracker';

const eff = calculateParallelEfficiency(process.cwd());
console.log(`Efficiency: ${eff.score}%`);
console.log(`Active: ${eff.active}, Stale: ${eff.stale}, Total: ${eff.total}`);
```

* **100%**：所有 agent 都在积极工作

* **<80%**：部分 agent 停滞或等待

* **<50%**：并行化存在重大问题

### 清理停滞 Agent

清理超过超时阈值的 agent：

```typescript
import { cleanupStaleAgents } from 'ultrapower/hooks/subagent-tracker';

const cleaned = cleanupStaleAgents(process.cwd());
console.log(`Cleaned ${cleaned} stale agents`);
```

---

## 外部资源

### Claude 性能追踪平台

#### MarginLab.ai

[MarginLab.ai](https://marginlab.ai) 提供 Claude 模型的外部性能追踪：

* **SWE-Bench-Pro 每日追踪**：监控 Claude 在软件工程基准测试上的表现

* **统计显著性测试**：通过置信区间检测性能下降

* **历史趋势**：追踪 Claude 随时间的能力变化

* **模型对比**：比较不同 Claude 模型版本的性能

#### 用法

访问该平台以：
1. 查看当前 Claude 模型基准测试分数
2. 检查历史性能趋势
3. 设置重大性能变化的警报
4. 跨模型版本比较（Opus、Sonnet、Haiku）

### 社区资源

| 资源 | 描述 | 链接 |
| ---------- | ------------- | ------ |
| Claude Code Discord | 社区支持和技巧 | [discord.gg/anthropic](https://discord.gg/anthropic) |
| OMC GitHub Issues | 错误报告和功能请求 | [GitHub Issues](https://github.com/liangjie559567/ultrapower/issues) |
| Anthropic Documentation | 官方 Claude 文档 | [docs.anthropic.com](https://docs.anthropic.com) |

### 模型性能基准测试

追踪 Claude 在标准基准测试中的表现：

| 基准测试 | 测量内容 | 追踪位置 |
| ----------- | ----------------- | ---------------- |
| SWE-Bench | 软件工程任务 | MarginLab.ai |
| HumanEval | 代码生成准确性 | 公开排行榜 |
| MMLU | 通用知识 | Anthropic 博客 |

---

## 最佳实践

### 1. 主动监控 Token 使用情况

```bash

# 在 HUD 中设置预算警告

/ultrapower:hud

# 选择 "analytics" 预设

```

### 2. 使用合适的模型层级

| 任务类型 | 推荐模型 | 费用影响 |
| ----------- | ------------------ | ------------- |
| 文件查找 | Haiku | 最低 |
| 功能实现 | Sonnet | 中等 |
| 架构决策 | Opus | 最高 |

### 3. 为复杂任务启用会话回放

会话回放自动启用。复杂工作流完成后查看回放：

```bash

# 查找回放文件

ls .omc/state/agent-replay-*.jsonl

# 查看最近事件

tail -20 .omc/state/agent-replay-*.jsonl
```

### 4. 设置费用限制

每个 agent 的默认费用限制为 $1.00 美元。超过此限制的 agent 会触发警告。

### 5. 定期检查瓶颈

完成复杂任务后，检查回放摘要：

```typescript
const summary = getReplaySummary(cwd, sessionId);
if (summary.bottlenecks.length > 0) {
  console.log('Consider optimizing:', summary.bottlenecks[0]);
}
```

### 6. 清理过时状态

定期清理旧的回放文件和过时的 agent 状态：

```typescript
import { cleanupReplayFiles } from 'ultrapower/hooks/subagent-tracker/session-replay';

cleanupReplayFiles(process.cwd()); // 保留最近 10 个会话
```

---

## 故障排除

### Token 使用量过高

**症状**：费用高于预期，上下文窗口快速填满

**解决方案**：
1. 使用 `eco` 模式进行 token 高效执行：`eco fix all errors`
2. 检查 agent 提示词中是否有不必要的文件读取
3. 查看 `omc agents` 获取 agent 级别明细
4. 启用缓存——在分析中检查缓存效率

### Agent 执行缓慢

**症状**：Agent 运行 >5 分钟，并行效率低

**解决方案**：
1. 检查 Observatory 中的瓶颈指示器
2. 查看 tool_usage 中的慢速操作
3. 考虑将大型任务拆分为更小的 agent
4. 对简单验证使用 `architect-low` 而非 `architect`

### 文件冲突

**症状**：合并冲突、意外的文件更改

**解决方案**：
1. 使用 `ultrapilot` 模式自动管理文件所有权
2. 并行执行前检查 `detectFileConflicts()`
3. 查看 agent 状态中的 file_ownership
4. 使用带有明确任务隔离的 `swarm` 模式

### 分析数据缺失

**症状**：费用报告为空，无会话历史

**解决方案**：
1. 运行 `omc backfill` 导入历史转录
2. 验证 HUD 正在运行：`/ultrapower:hud setup`
3. 检查 `.omc/state/` 目录是否存在
4. 查看 `token-tracking.jsonl` 获取原始数据

### Agent 状态停滞

**症状**：Observatory 显示未在运行的 agent

**解决方案**：
1. 以编程方式运行 `cleanupStaleAgents(cwd)`
2. 删除 `.omc/state/subagent-tracking.json` 以重置
3. 检查孤立的锁文件：`.omc/state/subagent-tracker.lock`

---

## 状态文件参考

| 文件 | 用途 | 格式 |
| ------ | --------- | -------- |
| `.omc/state/subagent-tracking.json` | 当前 agent 状态 | JSON |
| `.omc/state/agent-replay-{id}.jsonl` | 会话事件时间线 | JSONL |
| `.omc/state/token-tracking.jsonl` | Token 使用日志 | JSONL |
| `.omc/state/analytics-summary-{id}.json` | 缓存的会话摘要 | JSON |
| `.omc/state/subagent-tracker.lock` | 并发访问锁 | 文本 |

---

## API 参考

### Subagent Tracker

```typescript
// 核心追踪
getActiveAgentCount(directory: string): number
getRunningAgents(directory: string): SubagentInfo[]
getTrackingStats(directory: string): { running, completed, failed, total }

// 性能
getAgentPerformance(directory: string, agentId: string): AgentPerformance
getAllAgentPerformance(directory: string): AgentPerformance[]
calculateParallelEfficiency(directory: string): { score, active, stale, total }

// 文件所有权
recordFileOwnership(directory: string, agentId: string, filePath: string): void
detectFileConflicts(directory: string): Array<{ file, agents }>
getFileOwnershipMap(directory: string): Map<string, string>

// 干预
suggestInterventions(directory: string): AgentIntervention[]
cleanupStaleAgents(directory: string): number

// 显示
getAgentDashboard(directory: string): string
getAgentObservatory(directory: string): { header, lines, summary }
```

### Session Replay

```typescript
// 记录
recordAgentStart(directory, sessionId, agentId, agentType, task?, parentMode?, model?): void
recordAgentStop(directory, sessionId, agentId, agentType, success, durationMs?): void
recordToolEvent(directory, sessionId, agentId, toolName, eventType, durationMs?, success?): void
recordFileTouch(directory, sessionId, agentId, filePath): void

// 分析
readReplayEvents(directory: string, sessionId: string): ReplayEvent[]
getReplaySummary(directory: string, sessionId: string): ReplaySummary

// 清理
cleanupReplayFiles(directory: string): number
```

---

## 另请参阅

* [Analytics System](./ANALYTICS-SYSTEM.md) - 详细的 token 追踪文档

* [Reference](./REFERENCE.md) - 完整功能参考

* [Architecture](./ARCHITECTURE.md) - 系统架构概述
