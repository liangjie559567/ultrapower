# 状态机规范

> **ultrapower-version**: 5.5.5
> **优先级**: P0（必须遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-05（Agent 状态机 + Team Pipeline 转换矩阵）

---

## 目录

1. [Agent 完整状态机](#1-agent-完整状态机)
   - 1.1 状态定义
   - 1.2 状态转换图
   - 1.3 死状态说明（TIMEOUT / ZOMBIE）
2. [Team Pipeline 状态转换矩阵](#2-team-pipeline-状态转换矩阵)
   - 2.1 阶段定义
   - 2.2 阶段转换规则
   - 2.3 终态处理
3. [各模式状态文件路径](#3-各模式状态文件路径)
4. [Stale 检测规则](#4-stale-检测规则)
5. [互斥模式检测规则](#5-互斥模式检测规则)

---

## 1. Agent 完整状态机

### 1.1 状态定义

来源：`src/hooks/subagent-tracker/index.ts`

| 状态 | 描述 | 是否终态 |
|------|------|----------|
| `SPAWNED` | Agent 已创建，等待首次工具调用 | 否 |
| `RUNNING` | Agent 正在执行工具调用 | 否 |
| `WAITING` | Agent 等待用户输入 | 否 |
| `IDLE` | 当前 turn 结束，等待新消息 | 否 |
| `TIMEOUT` | 等待超时（5 分钟），强制退出 | **死状态** |
| `ERROR` | 执行异常，进入错误处理 | 否 |
| `ZOMBIE` | 错误处理超时（30 秒），无法正常退出 | **死状态** |
| `SHUTDOWN` | 正常关闭流程 | **终态** |

### 1.2 状态转换图

```
[*] --> SPAWNED : Task() 调用

SPAWNED --> RUNNING : 工具调用开始

RUNNING --> WAITING : 等待用户输入
RUNNING --> IDLE    : 当前 turn 结束
RUNNING --> ERROR   : 异常/超时

WAITING --> RUNNING : 收到输入
WAITING --> TIMEOUT : 等待超时（5 分钟）

IDLE --> RUNNING  : 收到新消息
IDLE --> SHUTDOWN : shutdown_request 或最大存活时间到期

TIMEOUT --> SHUTDOWN : 超时强制退出

ERROR --> SHUTDOWN : 错误处理完成
ERROR --> ZOMBIE   : 错误处理超时（30 秒）

ZOMBIE   --> [*] : 状态文件清理完成
SHUTDOWN --> [*]
```

### 1.3 死状态说明

**TIMEOUT（超时死状态）**：

| 参数 | 值 | 来源 |
|------|-----|------|
| 触发阈值 | 5 分钟 | `STALE_THRESHOLD_MS = 5 * 60 * 1000` |
| 触发条件 | WAITING 状态超过 5 分钟无响应 | `subagent-tracker/index.ts` |
| 处理策略 | 标记为 stale，触发清理，强制转 SHUTDOWN | subagent-tracker |
| 记录位置 | `last-tool-error.json` | `.omc/state/` |

**ZOMBIE（僵尸死状态）**：

| 参数 | 值 | 来源 |
|------|-----|------|
| 触发阈值 | 30 秒 | 规范要求（代码中未见明确常量） |
| 触发条件 | ERROR 状态超过 30 秒未完成错误处理 | 规范要求 |
| 处理策略 | 强制清理状态文件，记录到 last-tool-error.json | 规范要求 |
| 恢复方式 | 无法自动恢复，需人工介入 | — |

> **注意**：ZOMBIE 状态的 30 秒阈值来自规范要求，当前代码中未见明确的 `ZOMBIE_TIMEOUT_MS` 常量定义。实现者应在 v2 中添加此常量。

---

## 2. Team Pipeline 状态转换矩阵

### 2.1 阶段定义

来源：`docs/CLAUDE.md`（team_pipeline 章节）

| 阶段 | 描述 | 主要 Agent |
|------|------|-----------|
| `team-plan` | 规划与分解 | `explore` (haiku) + `planner` (opus) |
| `team-prd` | 验收标准与范围确认 | `analyst` (opus) |
| `team-exec` | 任务执行 | `executor` (sonnet) + 专家 agents |
| `team-verify` | 验证与质量检查 | `verifier` (sonnet) + 审查 agents |
| `team-fix` | 缺陷修复（循环） | `executor`/`build-fixer`/`debugger` |

**终态**：`complete`、`failed`、`cancelled`

### 2.2 阶段转换规则

```
team-plan
  ↓ 规划/分解完成
team-prd
  ↓ 验收标准和范围已明确
team-exec
  ↓ 所有执行任务达到终态
team-verify
  ↓ 验证通过          ↓ 发现缺陷
complete            team-fix
                      ↓ 修复完成
                    team-exec（重新执行）
                      或
                    team-verify（重新验证）
                      或
                    complete / failed（终止）
```

**转换条件详表**：

| 从 | 到 | 触发条件 |
|----|-----|---------|
| `team-plan` | `team-prd` | 规划/分解完成，任务列表已生成 |
| `team-prd` | `team-exec` | 验收标准和范围已明确，用户确认 |
| `team-exec` | `team-verify` | 所有执行任务达到终态（complete/failed） |
| `team-verify` | `team-fix` | 验证发现缺陷 |
| `team-verify` | `complete` | 验证全部通过 |
| `team-verify` | `failed` | 验证失败且无法修复 |
| `team-fix` | `team-exec` | 修复完成，需重新执行 |
| `team-fix` | `team-verify` | 修复完成，直接重新验证 |
| `team-fix` | `complete` | 修复后验证通过 |
| `team-fix` | `failed` | 超过最大修复次数 |

### 2.3 终态处理

**`team-fix` 循环限制**：

```typescript
// team-fix 循环受最大尝试次数限制
// 超出限制则转换为 failed
if (fix_loop_count >= MAX_FIX_ATTEMPTS) {
  transition('failed');
}
```

**取消处理**：

```typescript
// /ultrapower:cancel 触发
// 1. 请求所有队友关闭
// 2. 将当前阶段标记为 cancelled（active=false）
// 3. 记录取消元数据
// 4. 运行清理
state_write(mode="team", {
  current_phase: "cancelled",
  active: false,
  cancelled_at: timestamp
});
```

**状态持久化字段**：

```typescript
// state_write(mode="team") 写入的字段
{
  current_phase: string,      // 当前阶段
  team_name: string,          // 团队名称
  fix_loop_count: number,     // 修复循环次数
  linked_ralph: string | null, // 关联的 ralph 状态文件
  stage_history: string[],    // 阶段历史记录
  active: boolean,            // 是否活跃
}
```

---

## 3. 各模式状态文件路径

来源：`src/hooks/mode-registry/index.ts`

| 模式 | 状态文件路径 | 并发保护级别 |
|------|------------|------------|
| `autopilot` | `.omc/state/autopilot-state.json` | 中（atomicWriteJsonSync） |
| `ultrapilot` | `.omc/state/ultrapilot-state.json` | 中（atomicWriteJsonSync） |
| `team` | `.omc/state/team-state.json` | 中（atomicWriteJsonSync） |
| `pipeline` | `.omc/state/pipeline-state.json` | 中（atomicWriteJsonSync） |
| `ralph` | `.omc/state/ralph-state.json` | 中（atomicWriteJsonSync） |
| `ultrawork` | `.omc/state/ultrawork-state.json` | 中（atomicWriteJsonSync） |
| `ultraqa` | `.omc/state/ultraqa-state.json` | 中（atomicWriteJsonSync） |
| `swarm` | `.omc/state/swarm-state.json` | 中（atomicWriteJsonSync） |
| subagent 追踪 | `.omc/state/subagent-tracking.json` | **最高**（四层保护） |

**路径构建规则**（安全边界，不可协商）：

```typescript
// ✅ 正确：先校验再拼接
import { assertValidMode } from '../lib/validateMode';
const validMode = assertValidMode(mode);
const stateFilePath = `.omc/state/${validMode}-state.json`;

// ❌ 禁止：未校验直接拼接（路径遍历风险）
const stateFilePath = `.omc/state/${mode}-state.json`;
```

**会话级状态路径**（有 sessionId 时优先使用）：

```
.omc/state/sessions/{sessionId}/{mode}-state.json
```

---

## 4. Stale 检测规则

> **重要（差异点 D-09）**：系统中存在两个不同概念的 stale 阈值，含义不同，不得混淆。

### 4.1 Agent Stale 阈值

| 参数 | 值 | 来源 |
|------|-----|------|
| 常量名 | `STALE_THRESHOLD_MS` | `src/hooks/subagent-tracker/index.ts` |
| 值 | `5 * 60 * 1000`（5 分钟） | 代码定义 |
| 用途 | 检测 agent 运行状态是否过期 | subagent-tracker |
| 触发后行为 | 标记为 stale，触发清理，强制 SHUTDOWN | subagent-tracker |

### 4.2 Mode Stale Marker 阈值

| 参数 | 值 | 来源 |
|------|-----|------|
| 常量名 | `STALE_MARKER_THRESHOLD` | `src/hooks/mode-registry/index.ts` |
| 值 | `60 * 60 * 1000`（1 小时） | 代码定义 |
| 用途 | 检测模式状态文件的 stale marker | mode-registry |
| 触发后行为 | 清理 stale marker，允许模式重新激活 | mode-registry |

**对比总结**：

| 维度 | Agent Stale | Mode Stale Marker |
|------|------------|-------------------|
| 阈值 | **5 分钟** | **1 小时** |
| 检测对象 | agent 运行状态 | 模式状态文件 |
| 触发后果 | agent 被强制终止 | stale marker 被清理 |
| 所在文件 | `subagent-tracker/index.ts` | `mode-registry/index.ts` |

---

## 5. 互斥模式检测规则

来源：`src/hooks/mode-registry/index.ts`

### 5.1 互斥模式列表

```typescript
// 互斥模式（见差异点 D-04）
const EXCLUSIVE_MODES = ['autopilot', 'ultrapilot', 'swarm', 'pipeline'];
```

> **注意（差异点 D-04）**：互斥模式为 4 个，PRD 原描述仅提及 `autopilot` 与 `ultrapilot` 互斥。实际上 `swarm` 和 `pipeline` 也在互斥列表中。

### 5.2 互斥检测逻辑

```typescript
// 伪代码：互斥检测
function checkExclusiveConflict(newMode: string): boolean {
  if (!EXCLUSIVE_MODES.includes(newMode)) {
    return false; // 非互斥模式，无冲突
  }
  const activeExclusiveModes = EXCLUSIVE_MODES.filter(
    mode => isActive(mode) && mode !== newMode
  );
  return activeExclusiveModes.length > 0; // 有冲突返回 true
}
```

### 5.3 非互斥模式

以下模式**不在**互斥列表中，可与其他模式组合使用：

| 模式 | 可组合示例 |
|------|-----------|
| `ralph` | `team ralph`（ralph + team 组合） |
| `ultrawork` | 可与 ralph 组合 |
| `ultraqa` | 由 autopilot 激活，不独立互斥 |
| `team` | 可与 ralph 组合（`team ralph`） |

### 5.4 Team + Ralph 组合状态

当同时检测到 `team` 和 `ralph` 关键词时：

```typescript
// 两者都写入关联状态文件
state_write(mode="team",  { linked_ralph: "ralph-state.json" });
state_write(mode="ralph", { linked_team:  "team-state.json"  });

// 取消任一模式会同时取消两者
// /ultrapower:cancel 触发时检查 linked_* 字段
```

---

## 差异点说明

| 差异点 | 描述 | 当前状态 | 规范要求 |
|--------|------|---------|---------|
| D-03 | 合法 mode 数量 | 8 个（含 swarm） | 以 8 个为准 |
| D-04 | 互斥模式范围 | 4 个互斥模式（autopilot、ultrapilot、swarm、pipeline） | 以 4 个为准 |
| D-09 | stale 阈值含义 | 两个不同概念：mode stale（1 小时）vs agent stale（5 分钟） | 必须区分，不得混淆 |
