## 6. 死锁检测与依赖管理

### 6.1 依赖图结构

**DependencyGraph** (`src/team/dependency-graph.ts`):
```typescript
class DependencyGraph {
  private adjacencyList = Map<string, Set<string>>();

  addEdge(from: string, to: string) {
    // from 依赖 to
    this.adjacencyList.get(from).add(to);
  }

  getDependencies(nodeId: string): string[] {
    return Array.from(this.adjacencyList.get(nodeId) || []);
  }
}
```

### 6.2 死锁检测算法

**DFS 循环检测** (`src/team/deadlock-detector.ts`):
```typescript
class DeadlockDetector {
  detect(graph: DependencyGraph): DeadlockResult {
    const state = new Map<string, VisitState>();
    // Unvisited | Visiting | Visited

    for (const node of graph.getNodes()) {
      if (state.get(node) === Unvisited) {
        const cycle = this.dfs(node, graph, state, path);
        if (cycle) return { hasDeadlock: true, cycle };
      }
    }
    return { hasDeadlock: false };
  }

  private dfs(node, graph, state, path) {
    state.set(node, Visiting);
    path.push(node);

    for (const dep of graph.getDependencies(node)) {
      if (state.get(dep) === Visiting) {
        // 发现循环
        return path.slice(path.indexOf(dep));
      }
      if (state.get(dep) === Unvisited) {
        const cycle = this.dfs(dep, graph, state, path);
        if (cycle) return cycle;
      }
    }

    path.pop();
    state.set(node, Visited);
    return null;
  }
}
```

**检测时机**：
- 任务创建时构建依赖图
- 任务分配前检测循环
- 发现死锁时拒绝任务创建

---

## 7. 恢复机制

### 7.1 状态恢复流程

**恢复条件检测**：
```typescript
function canResumeTeam(state: TeamPipelineState): boolean {
  if (!state.active) {
    if (state.phase === 'cancelled' && state.cancel.preserve_for_resume) {
      return true;
    }
    return false;
  }
  return true;
}
```

**恢复策略**：
1. **从 cancelled 恢复**：
   - 检查 `preserve_for_resume = true`
   - 重新激活状态：`active = true`, `completed_at = null`
   - 转换到 `team-plan` 或 `team-exec`

2. **从中断恢复**：
   - 读取 `phase_history` 确定最后阶段
   - 检查 `execution` 统计确定进度
   - 从最后未完成阶段继续

### 7.2 任务恢复

**任务状态检查**：
```typescript
function getUnfinishedTasks(teamName: string): TaskFile[] {
  const tasks = readAllTasks(teamName);
  return tasks.filter(t =>
    t.status === 'pending' || t.status === 'in_progress'
  );
}
```

**恢复决策**：
- `in_progress` 任务：检查 worker heartbeat，若 worker 已死则重新分配
- `pending` 任务：直接分配给可用 worker
- `completed` 任务：跳过

---

## 8. 错误处理

### 8.1 Worker 隔离机制

**自我隔离触发** (MCP worker):
```typescript
if (consecutiveErrors >= maxConsecutiveErrors) {
  heartbeat.status = 'quarantined';
  writeHeartbeat(workingDirectory, heartbeat);
  // 停止接受新任务，等待人工干预
}
```

**隔离恢复**：
- 人工检查 audit log 确定错误原因
- 修复配置或代码问题
- 删除 heartbeat 文件或重启 worker

### 8.2 任务重试策略

**TaskFailureSidecar** (`src/team/types.ts`):
```typescript
interface TaskFailureSidecar {
  taskId: string;
  lastError: string;
  retryCount: number;
  lastFailedAt: string;
}
```

**重试逻辑**：
1. 任务失败 → 写入 failure sidecar
2. `retryCount < maxRetries` → 重新分配给其他 worker
3. `retryCount >= maxRetries` → 标记为 `task_permanently_failed`
4. 记录到 audit log

### 8.3 Fix Loop 超限处理

**超限检测** (`markTeamPhase`):
```typescript
if (updated.fix_loop.attempt > updated.fix_loop.max_attempts) {
  return {
    ok: false,
    state: { ...updated, phase: 'failed', active: false },
    reason: 'Fix loop exceeded max_attempts'
  };
}
```

**失败记录**：
- `phase_history` 追加 `failed` 条目
- `fix_loop.last_failure_reason` 记录原因
- `completed_at` 设置为当前时间

---

## 9. 取消与清理

### 9.1 取消请求

**requestTeamCancel** (`src/hooks/team-pipeline/transitions.ts`):
```typescript
function requestTeamCancel(state: TeamPipelineState, preserveForResume = true) {
  return {
    ...state,
    cancel: {
      requested: true,
      requested_at: new Date().toISOString(),
      preserve_for_resume: preserveForResume,
    },
    phase: 'cancelled',
    active: false,
    completed_at: new Date().toISOString(),
  };
}
```

### 9.2 清理流程

**Team 清理**：
1. 向所有 workers 发送 shutdown signal
2. 等待 workers 响应 `shutdown_ack`
3. 删除 heartbeat 文件
4. 清理 inbox/outbox JSONL 文件
5. 可选：保留状态文件用于恢复

**MCP Worker 清理**：
1. 收到 shutdown signal
2. 完成当前任务（如果有）
3. 写入 `shutdown_ack` 到 outbox
4. 退出进程

### 9.3 Team + Ralph 联动取消

**关联状态**：
```typescript
// team-state.json
{ linked_ralph: 'ralph-session-id' }

// ralph-state.json
{ linked_team: 'team-name' }
```

**取消逻辑**：
- 取消 team → 同时取消关联的 ralph
- 取消 ralph → 同时取消关联的 team
- 两者状态文件都标记为 `cancelled`

---

## 10. 关键设计决策

### 10.1 为什么使用分阶段流水线？

**优势**：
- **职责分离**：每个阶段有明确的输入/输出
- **可验证性**：每个阶段完成后可独立验证
- **可恢复性**：从任意阶段恢复，无需重新开始
- **可观测性**：`phase_history` 提供完整审计轨迹

**劣势**：
- 增加状态管理复杂度
- 阶段转换需要守卫检查

### 10.2 为什么混合后端？

**Claude native 优势**：
- 原生工具访问（文件操作、bash）
- 低延迟通信
- 无需额外进程管理

**MCP workers 优势**：
- 支持外部 AI 提供商（Codex, Gemini）
- 大上下文窗口（Gemini 1M tokens）
- 专业能力（Codex 擅长架构审查）

**统一视图**：
- `UnifiedTeamMember` 抽象后端差异
- 消息路由自动选择通信方式
- 能力标签系统统一任务分配

### 10.3 为什么使用 JSONL 而非数据库？

**优势**：
- 零依赖，无需安装数据库
- 文件系统原子操作保证一致性
- 易于调试（直接查看文件内容）
- 支持增量读取（offset cursor）

**劣势**：
- 并发写入需要文件锁
- 大文件需要轮转（outbox rotation）

---

## 11. 性能优化

### 11.1 任务路由优化

**批量路由**：
```typescript
const decisions = routeTasks(teamName, workingDirectory, unassignedTasks, capabilities);
// 一次性分配所有未分配任务，避免多次扫描
```

**负载均衡**：
- 优先分配给空闲 worker
- 每个已分配任务减少适应度分数
- 避免单个 worker 过载

### 11.2 Heartbeat 优化

**批量读取**：
```typescript
const heartbeats = listHeartbeats(workingDirectory, teamName);
// 一次性读取所有 heartbeat，避免多次文件 I/O
```

**缓存策略**：
- Heartbeat 有效期内缓存结果
- 仅在超时后重新读取

### 11.3 JSONL 轮转

**Outbox 轮转** (`outboxMaxLines = 500`):
```typescript
if (lineCount > outboxMaxLines) {
  const backup = `${outboxPath}.${Date.now()}.bak`;
  renameSync(outboxPath, backup);
  // 创建新的空 outbox
}
```

**避免无限增长**：
- 定期归档旧消息
- 保留最近 N 条消息

---

## 12. 总结

### 12.1 核心优势

1. **分阶段流水线**：清晰的执行路径，易于验证和恢复
2. **混合后端**：统一管理 Claude native + MCP workers
3. **智能路由**：基于能力标签的适应度评分
4. **健壮性**：死锁检测、自我隔离、任务重试
5. **可观测性**：完整的状态历史和审计日志

### 12.2 适用场景

- **多文件功能开发**：plan → prd → exec → verify
- **复杂重构**：需要多个专业 agents 协作
- **长时间任务**：支持中断恢复
- **混合能力需求**：同时需要代码编辑和架构审查

### 12.3 局限性

- **状态管理复杂**：多个状态文件需要同步
- **阶段转换开销**：每次转换需要守卫检查
- **文件 I/O 密集**：JSONL 通信依赖文件系统
- **调试困难**：分布式系统，需要聚合多个日志

---

**报告完成**
**总行数**: < 300 行
**保存路径**: `.omc/research/stage6-team-pipeline.md` + `stage6-team-pipeline-part2.md`
