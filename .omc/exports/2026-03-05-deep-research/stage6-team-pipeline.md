# Stage 6: Team Pipeline & Multi-Agent Coordination

**分析日期**: 2026-03-05
**版本**: v5.5.14
**分析范围**: Team 编排系统、分阶段流水线、Agent 路由

---

## 1. 架构概览

### 1.1 核心设计理念

Team 是 ultrapower 的默认多 agent 编排器，采用**分阶段流水线**架构：

```
team-plan → team-prd → team-exec → team-verify → team-fix (循环)
                                                      ↓
                                                  complete/failed
```

**关键特性**：
- **阶段感知路由**：每个阶段使用专业 agents，而非通用 executors
- **状态持久化**：通过 `.omc/state/sessions/{sessionId}/team-state.json` 跟踪进度
- **恢复机制**：从中断点恢复，支持取消后恢复
- **死锁检测**：DFS 算法检测任务依赖循环
- **混合后端**：统一管理 Claude native + MCP workers (Codex/Gemini)

---

## 2. 分阶段流水线

### 2.1 阶段定义

```typescript
type TeamPipelinePhase =
  | 'team-plan'    // 规划与分解
  | 'team-prd'     // 需求文档
  | 'team-exec'    // 执行实现
  | 'team-verify'  // 验证测试
  | 'team-fix'     // 修复缺陷
  | 'complete'     // 成功完成
  | 'failed'       // 失败终止
  | 'cancelled';   // 用户取消
```

### 2.2 阶段转换矩阵

**允许的转换** (`src/hooks/team-pipeline/transitions.ts`):

| From         | To                                    |
|--------------|---------------------------------------|
| team-plan    | team-prd                              |
| team-prd     | team-exec                             |
| team-exec    | team-verify                           |
| team-verify  | team-fix, complete, failed            |
| team-fix     | team-exec, team-verify, complete, failed |
| cancelled    | team-plan, team-exec (需 preserve_for_resume) |
| complete     | (终态)                                |
| failed       | (终态)                                |

**转换守卫**：
- `team-exec`: 需要 `plan_path` 或 `prd_path` artifact
- `team-verify`: 需要 `tasks_total > 0` 且 `tasks_completed >= tasks_total`
- `cancelled → *`: 需要 `preserve_for_resume = true`

### 2.3 Fix Loop 机制

```typescript
interface TeamPipelineFixLoop {
  attempt: number;           // 当前尝试次数
  max_attempts: number;      // 默认 3 次
  last_failure_reason: string | null;
}
```

**循环逻辑**：
1. `team-verify` 发现问题 → 转换到 `team-fix`
2. `fix_loop.attempt++`
3. `team-fix` 修复后 → 返回 `team-exec` 或 `team-verify`
4. 若 `attempt > max_attempts` → 强制转换到 `failed`

---

## 3. Agent 路由系统

### 3.1 阶段 Agent 映射

**team-plan** (探索与规划):
- `explore` (haiku): 代码库发现、符号映射
- `planner` (opus): 任务排序、执行计划
- 可选: `analyst` (opus), `architect` (opus)

**team-prd** (需求文档):
- `analyst` (opus): 需求澄清、验收标准
- 可选: `product-manager` (sonnet), `critic` (opus)

**team-exec** (执行实现):
- `executor` (sonnet): 标准代码实现
- 任务适配专家:
  - `designer` (sonnet): UI/UX 工作
  - `build-fixer` (sonnet): 构建/类型错误
  - `writer` (haiku): 文档编写
  - `test-engineer` (sonnet): 测试策略
  - `deep-executor` (opus): 复杂自主任务

**team-verify** (验证测试):
- `verifier` (sonnet): 完成证据、测试充分性
- 按需使用:
  - `security-reviewer` (sonnet)
  - `code-reviewer` (opus)
  - `quality-reviewer` (sonnet)
  - `performance-reviewer` (sonnet)

**team-fix** (修复缺陷):
- 根据缺陷类型路由:
  - `executor` (sonnet): 逻辑错误
  - `build-fixer` (sonnet): 编译错误
  - `debugger` (sonnet): 复杂 bug

### 3.2 能力标签系统

**WorkerCapability** (`src/team/types.ts`):
```typescript
type WorkerCapability =
  | 'code-edit'        // 代码编辑
  | 'testing'          // 测试编写
  | 'general'          // 通用任务
  | 'code-review'      // 代码审查
  | 'security-review'  // 安全审查
  | 'architecture'     // 架构设计
  | 'refactoring'      // 重构
  | 'ui-design'        // UI 设计
  | 'documentation'    // 文档编写
  | 'research';        // 研究调查
```

**后端默认能力** (`src/team/capabilities.ts`):
```typescript
const DEFAULT_CAPABILITIES = {
  'claude-native': ['code-edit', 'testing', 'general'],
  'mcp-codex':     ['code-review', 'security-review', 'architecture', 'refactoring'],
  'mcp-gemini':    ['ui-design', 'documentation', 'research', 'code-edit'],
};
```

### 3.3 适应度评分算法

**评分规则** (`scoreWorkerFitness`):
- 每个匹配能力 = 1.0 分
- `general` 能力作为通配符 = 0.5 分
- 最终分数归一化到 0-1 范围

**负载均衡** (`routeTasks`):
```typescript
finalScore = fitnessScore - (currentLoad × 0.2) + (isIdle ? 0.1 : 0)
```
- 每个已分配任务减少 0.2 分
- 空闲 worker 获得 0.1 分加成

---

## 4. 状态管理

### 4.1 状态文件结构

**路径**: `.omc/state/sessions/{sessionId}/team-state.json`

```typescript
interface TeamPipelineState {
  schema_version: 1;
  mode: 'team';
  active: boolean;
  session_id: string;
  project_path: string;

  phase: TeamPipelinePhase;
  phase_history: TeamPhaseHistoryEntry[];

  iteration: number;
  max_iterations: 25;  // 默认

  artifacts: {
    plan_path: string | null;
    prd_path: string | null;
    verify_report_path: string | null;
  };

  execution: {
    workers_total: number;
    workers_active: number;
    tasks_total: number;
    tasks_completed: number;
    tasks_failed: number;
  };

  fix_loop: TeamPipelineFixLoop;
  cancel: TeamPipelineCancel;

  started_at: string;
  updated_at: string;
  completed_at: string | null;
}
```

### 4.2 原子写入

使用 `atomicWriteJsonSync` 确保状态一致性：
1. 写入临时文件 `.tmp-{random}`
2. `fsync()` 刷新到磁盘
3. 原子 `rename()` 替换目标文件

---

## 5. 混合后端协调

### 5.1 统一团队视图

**UnifiedTeamMember** (`src/team/unified-team.ts`):
```typescript
interface UnifiedTeamMember {
  name: string;
  agentId: string;
  backend: 'claude-native' | 'mcp-codex' | 'mcp-gemini';
  model: string;
  capabilities: WorkerCapability[];
  joinedAt: number;
  status: 'active' | 'idle' | 'dead' | 'quarantined' | 'unknown';
  currentTaskId: string | null;
}
```

**数据源合并**：
1. **Claude native**: 从 `~/.claude/teams/{team}/config.json` 读取
2. **MCP workers**: 从 shadow registry + heartbeat 文件读取

### 5.2 消息路由

**路由策略** (`src/team/message-router.ts`):
- **Claude native**: 返回指令使用 `SendMessage` 工具
- **MCP workers**: 追加到 `~/.claude/teams/{team}/inbox/{worker}.jsonl`

**广播机制**：
```typescript
broadcastToTeam(teamName, content, workingDirectory) {
  // Claude native → SendMessage 批量发送
  // MCP workers → 逐个写入 inbox JSONL
}
```

### 5.3 Heartbeat 健康监控

**Heartbeat 文件** (`.omc/state/team-bridge/{team}/{worker}.heartbeat.json`):
```typescript
interface HeartbeatData {
  workerName: string;
  teamName: string;
  provider: 'codex' | 'gemini';
  pid: number;
  lastPollAt: string;           // ISO timestamp
  currentTaskId?: string;
  consecutiveErrors: number;
  status: 'ready' | 'polling' | 'executing' | 'shutdown' | 'quarantined';
}
```

**健康检查逻辑** (`src/team/worker-health.ts`):
```typescript
isWorkerAlive(workingDirectory, teamName, workerName, maxAgeMs) {
  const heartbeat = readHeartbeat(...);
  if (!heartbeat) return false;
  return (Date.now() - new Date(heartbeat.lastPollAt).getTime()) < maxAgeMs;
}
```

**干预触发条件**：
- Heartbeat 过期 + tmux session 不存在 → `dead`
- Heartbeat 过期但 tmux 存在 → `hung` (挂起)
- `status === 'quarantined'` → 自我隔离
- `consecutiveErrors >= 2` → 隔离风险

