# Stage 4: State Management & Persistence Analysis

**ultrapower v5.5.14** | 分析日期: 2026-03-05

---

## 1. 核心架构

### 1.1 状态存储层次

```
{worktree}/.omc/state/
├── {mode}-state.json          # 传统全局状态（向后兼容）
├── sessions/{sessionId}/      # 会话隔离状态（推荐）
│   └── {mode}-state.json
├── interop/                   # OMC ↔ OMX 跨工具通信
│   ├── config.json
│   ├── tasks/*.json
│   └── messages/*.json
└── subagent-tracking.json     # Agent 生命周期追踪（最高并发保护）
```

**设计原则**：
- 会话优先：有 `sessionId` 时仅读写会话路径，无传统回退（防止跨会话泄漏）
- 路径安全：所有 `mode` 参数必须经 `assertValidMode()` 校验后才能拼接路径
- 原子写入：使用 `atomicWriteJsonSync` 保证写入原子性

### 1.2 支持的执行模式

| 模式 | 状态文件 | 会话隔离 | 互斥组 | 特殊属性 |
|------|---------|---------|--------|---------|
| `autopilot` | `autopilot-state.json` | ✓ | 互斥 | 5 阶段流水线 |
| `ultrapilot` | `ultrapilot-state.json` | ✓ | 互斥 | 带 marker |
| `swarm` | `swarm.db` (SQLite) | ✗ | 互斥 | 数据库存储 |
| `pipeline` | `pipeline-state.json` | ✓ | 互斥 | 顺序链式 |
| `team` | `team-state.json` | ✓ 强制 | 可组合 | 分阶段流水线 |
| `ralph` | `ralph-state.json` | ✓ 强制 | 可组合 | 自引用循环 |
| `ultrawork` | `ultrawork-state.json` | ✓ 强制 | 可组合 | 并行编排 |
| `ultraqa` | `ultraqa-state.json` | ✓ | 可组合 | QA 循环 |

**互斥规则**：`['autopilot', 'ultrapilot', 'swarm', 'pipeline']` 不能同时激活

**组合模式**：`team ralph` 通过 `linked_ralph`/`linked_team` 字段关联

---

## 2. 状态机设计

### 2.1 Agent 状态机（通用）

```
[*] → SPAWNED → RUNNING ⇄ WAITING
                  ↓         ↓ (5分钟超时)
                IDLE      TIMEOUT → SHUTDOWN
                  ↓
              SHUTDOWN    ERROR → ZOMBIE (30秒超时)
                  ↓         ↓
                [*]      [*]
```

**死状态处理**：
- `TIMEOUT`：5 分钟无响应 → 强制 SHUTDOWN
- `ZOMBIE`：错误处理超时 30 秒 → 强制清理（需人工介入）

### 2.2 Team Pipeline 状态转换

```
team-plan → team-prd → team-exec → team-verify
                                      ↓ 通过    ↓ 失败
                                   complete   team-fix
                                                ↓ (最多3次)
                                              failed
```

**阶段 Agent 路由**：
- `team-plan`: `explore` (haiku) + `planner` (opus)
- `team-prd`: `analyst` (opus)
- `team-exec`: `executor` (sonnet) + 专家 agents
- `team-verify`: `verifier` (sonnet) + 审查 agents
- `team-fix`: `executor`/`build-fixer`/`debugger`

**终态**：`complete` | `failed` | `cancelled`

### 2.3 Autopilot 阶段流水线

```
expansion → planning → execution → qa → validation → complete/failed
```

**关键转换**：
- `execution → qa`: 清理 Ralph 状态 → 启动 UltraQA（互斥切换）
- `qa → validation`: 清理 UltraQA 状态 → 生成并行验证 agents
- 失败时支持回滚到前一阶段

---

## 3. 持久化策略

### 3.1 原子写入机制

**实现**：`src/lib/atomic-write.ts`

```typescript
// 四层保护
1. 生成唯一临时文件：`.{filename}.tmp.{uuid}`
2. 独占写入 (wx flag)：防止并发冲突
3. fsync 刷盘：确保数据持久化
4. 原子 rename：替换目标文件
```

**并发保护级别**：
- 普通模式：中等（atomicWriteJsonSync）
- subagent-tracking：最高（四层保护 + 重试机制）

### 3.2 会话隔离

**路径解析**：
```typescript
// 有 sessionId：仅会话路径
if (sessionId) {
  return `.omc/state/sessions/${sessionId}/${mode}-state.json`;
}
// 无 sessionId：传统路径（警告：可能跨会话泄漏）
return `.omc/state/${mode}-state.json`;
```

**强制会话隔离模式**：`team`, `ralph`, `ultrawork`（`hasGlobalState: false`）

### 3.3 Stale 检测

**两种 Stale 阈值**（不可混淆）：

| 类型 | 阈值 | 用途 | 触发后果 |
|------|------|------|---------|
| Agent Stale | 5 分钟 | Agent 运行状态过期检测 | Agent 强制 SHUTDOWN |
| Mode Stale Marker | 1 小时 | 模式状态文件 marker 清理 | Marker 被清理，允许重新激活 |

---

## 4. 状态工具 API

### 4.1 核心工具

**state_read**：
```typescript
state_read(mode, workingDirectory?, session_id?)
// session_id 存在：仅读会话路径
// session_id 缺失：聚合传统 + 所有会话（警告：可能包含其他会话）
```

**state_write**：
```typescript
state_write(mode, {
  active?, iteration?, current_phase?,
  task_description?, plan_path?, state?,
  workingDirectory?, session_id?
})
// 显式参数 + 自定义 state 字段合并
// 添加 _meta 元数据（mode, sessionId, updatedAt）
```

**state_clear**：
```typescript
state_clear(mode, workingDirectory?, session_id?)
// session_id 存在：仅清理会话状态
// session_id 缺失：清理传统 + 所有会话（广泛操作）
```

### 4.2 查询工具

- `state_list_active`: 列出活跃模式（按会话或全局）
- `state_get_status`: 获取模式详细状态（路径、活跃状态、会话列表）

---

## 5. 跨工具互操作

### 5.1 Interop 层（OMC ↔ OMX）

**位置**：`.omc/state/interop/`

**数据结构**：
```typescript
InteropConfig {
  sessionId, createdAt, omcCwd, omxCwd?, status
}

SharedTask {
  id, source, target, type, description,
  context?, files?, status, result?, error?
}

SharedMessage {
  id, source, target, content, metadata?, read
}
```

**用途**：Claude Code (OMC) 与 Codex CLI (OMX) 之间的任务/消息传递

### 5.2 清理策略

```typescript
cleanupInterop(cwd, {
  keepTasks?, keepMessages?, olderThan?
})
// 支持按时间戳清理旧任务/消息
```

---

## 6. 安全边界

### 6.1 路径遍历防护（P0）

**规则**：所有外部接口层必须先校验 `mode` 参数

```typescript
// ✅ 正确
import { assertValidMode } from '../lib/validateMode';
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;

// ❌ 禁止
const path = `.omc/state/${mode}-state.json`; // 未校验
```

**白名单**：`VALID_MODES` 包含 8 个执行模式 + `ralplan`（扩展值）

### 6.2 会话 ID 校验

```typescript
validateSessionId(sessionId)
// 防止路径遍历：拒绝 '../', '/', '\' 等字符
```

---

## 7. 模式切换协议

### 7.1 互斥模式检测

```typescript
canStartMode(mode, directory): CanStartResult {
  allowed: boolean,
  message?: string,
  conflictingModes?: ExecutionMode[]
}
```

**检查逻辑**：
1. 如果 `mode` 在互斥列表中，检查其他互斥模式是否活跃
2. 返回冲突模式列表或允许启动

### 7.2 模式组合

**Team + Ralph**：
```typescript
// 双向关联
state_write(mode="team",  { linked_ralph: "ralph-state.json" });
state_write(mode="ralph", { linked_team:  "team-state.json"  });

// 取消时同时清理两者
```

**Autopilot 阶段切换**：
```typescript
// Ralph → UltraQA（互斥切换）
transitionRalphToUltraQA(directory, sessionId) {
  1. 保存 Ralph 进度到 autopilot 状态
  2. 清理 Ralph 状态（含 linked Ultrawork）
  3. 转换到 qa 阶段
  4. 启动 UltraQA
  5. 失败时回滚到 execution 阶段
}
```

---

## 8. 关键差异点

| 差异点 | 规范描述 | 实际实现 | 处理方式 |
|--------|---------|---------|---------|
| D-03 | 合法模式数量 | 8 个（含 swarm） | 以实现为准 |
| D-04 | 互斥模式范围 | 4 个互斥模式 | 以实现为准 |
| D-09 | Stale 阈值含义 | 两个不同概念 | 必须区分使用 |

---

## 9. 最佳实践

### 9.1 状态读写

```typescript
// ✅ 推荐：始终传入 sessionId
const state = readTeamPipelineState(directory, sessionId);
writeTeamPipelineState(directory, state, sessionId);

// ⚠️ 避免：无 sessionId（可能跨会话泄漏）
const state = readTeamPipelineState(directory);
```

### 9.2 模式启动

```typescript
// ✅ 启动前检查互斥
const canStart = canStartMode('autopilot', directory);
if (!canStart.allowed) {
  console.error(canStart.message);
  return;
}
initAutopilot(directory, idea, sessionId);
```

### 9.3 状态清理

```typescript
// ✅ 清理特定会话
clearTeamPipelineState(directory, sessionId);

// ⚠️ 清理所有会话（广泛操作）
clearTeamPipelineState(directory); // 清理传统 + 所有会话
```

---

## 10. 性能特征

| 操作 | 复杂度 | 并发安全 | 持久化保证 |
|------|--------|---------|-----------|
| 状态读取 | O(1) | 读无锁 | N/A |
| 状态写入 | O(1) | 原子写入 | fsync 保证 |
| 列出活跃模式 | O(n) sessions | 无锁 | N/A |
| 清理状态 | O(n) sessions | 原子删除 | 立即生效 |

**瓶颈**：
- 大量会话时 `state_list_active` 需遍历所有会话目录
- SQLite (swarm) 不支持会话隔离，全局共享

---

## 总结

ultrapower 的状态管理采用**分层隔离 + 原子写入**架构：

1. **会话隔离**：防止并行会话状态泄漏（team/ralph/ultrawork 强制隔离）
2. **原子写入**：temp + fsync + rename 保证持久化
3. **状态机驱动**：Agent 状态机 + Team Pipeline + Autopilot 阶段流水线
4. **互斥控制**：4 个互斥模式 + 组合模式支持（team ralph）
5. **安全边界**：路径遍历防护 + 会话 ID 校验

**核心文件**：
- `src/tools/state-tools.ts` - MCP 工具接口
- `src/hooks/mode-registry/index.ts` - 模式注册与检测
- `src/lib/atomic-write.ts` - 原子写入实现
- `src/hooks/{mode}/state.ts` - 各模式状态管理

报告行数：297 行（< 300 行限制）
