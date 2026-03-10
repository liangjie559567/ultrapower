# Stage 6: 执行模式状态机分析

**研究时间**: 2026-03-10
**分析范围**: Autopilot, Ralph, Team Pipeline 状态机设计

---

## [OBJECTIVE]

分析 ultrapower 执行模式的状态机设计、转换规则、持久化机制、取消/恢复逻辑。

---

## [FINDING:STATE-1] Autopilot 状态机设计

**阶段转换流程**:
```
expansion → planning → execution → qa → validation → complete
```

**关键转换点**:

1. **expansion → planning**: 需求和技术设计完成
   - analyst_complete = true
   - architect_complete = true
   - spec_path 已生成

2. **planning → execution**: 计划获得批准
   - plan_path 已生成
   - approved = true

3. **execution → qa**: Ralph 执行完成
   - 需清理 Ralph 和 Ultrawork 状态
   - 使用事务性转换（transitionRalphToUltraQA）
   - 失败时回滚到 execution 阶段

4. **qa → validation**: 所有 QA 检查通过
   - build_status = 'passing'
   - lint_status = 'passing'
   - test_status = 'passing' | 'skipped'

5. **validation → complete**: 所有验证通过
   - all_approved = true
   - 所有 verdicts 为 'APPROVED'

**[STAT:transition_count]** n = 5 个主要转换

**[EVIDENCE:STATE-1]**
- 文件: `src/hooks/autopilot/state.ts`
- 类型: `src/hooks/autopilot/types.ts`
- 转换: `src/hooks/autopilot/state.ts:transitionPhase()`

---

## [FINDING:STATE-2] Ralph 持久循环机制

**状态特征**:
- **自引用循环**: 通过 hook 系统持续注入上下文
- **迭代计数**: iteration 字段跟踪循环次数
- **最大迭代限制**: max_iterations (默认 10)
- **Ultrawork 自动链接**: linked_ultrawork 标志

**完成条件**:

1. **PRD 模式**: 所有 story 标记为 `passes: true`
   ```typescript
   getPrdCompletionStatus(directory).allComplete === true
   ```

2. **Team 模式**: team 状态达到 complete/failed
   ```typescript
   getTeamPhaseDirective(directory, sessionId) === 'complete'
   ```

3. **手动取消**: `/ultrapower:cancel`

**[STAT:default_max_iterations]** n = 10

**[EVIDENCE:STATE-2]**
- 文件: `src/hooks/ralph/loop.ts`
- PRD 集成: `src/hooks/ralph/prd.ts`
- 进度追踪: `src/hooks/ralph/progress.ts`

---

## [FINDING:STATE-3] Team Pipeline 5 阶段转换矩阵

**转换规则** (来源: `src/hooks/team-pipeline/transitions.ts`):

```
ALLOWED 转换矩阵:
  team-plan       → team-prd
  team-prd        → team-exec
  team-exec       → team-verify
  team-verify     → team-fix, complete, failed
  team-fix        → team-exec, team-verify, complete, failed
  complete        → [终态]
  failed          → [终态]
  cancelled       → team-plan, team-exec
```

**转换守卫条件**:

1. **team-exec 守卫**:
   - 需要 `plan_path` 或 `prd_path` artifact
   - 失败消息: "team-exec requires plan_path or prd_path artifact"

2. **team-verify 守卫**:
   - `tasks_total` 必须是非负有限整数
   - `tasks_completed` 必须是非负有限整数
   - `tasks_total > 0`
   - `tasks_completed >= tasks_total`

3. **fix-loop 守卫**:
   - `fix_loop.attempt > max_attempts` 时自动转换到 failed
   - 失败原因: "fix-loop-max-attempts-exceeded"

**[STAT:fix_loop_max]** n = 3

**[EVIDENCE:STATE-3]**
- 文件: `src/hooks/team-pipeline/transitions.ts`
- 类型: `src/hooks/team-pipeline/types.ts`
- 状态: `src/hooks/team-pipeline/state.ts`

---

## [FINDING:STATE-4] 互斥模式检测机制

**互斥模式列表** (来源: `mode-registry/index.ts`):
- autopilot
- ultrapilot
- swarm
- pipeline

**非互斥模式** (可组合):
- ralph
- ultrawork
- ultraqa
- team

**组合模式示例**:
- `team + ralph`: 持久团队执行
- `ralph + ultrawork`: 自动链接并行执行
- `autopilot → ralph → ultraqa`: 阶段转换

**互斥检测逻辑**:
```typescript
// canStartMode() 检查所有会话
if (EXCLUSIVE_MODES.includes(mode)) {
  for (const exclusiveMode of EXCLUSIVE_MODES) {
    if (exclusiveMode !== mode && isModeActiveInAnySession(exclusiveMode, cwd)) {
      return { allowed: false, blockedBy: exclusiveMode };
    }
  }
}
```

**[STAT:exclusive_count]** n = 4
**[STAT:non_exclusive_count]** n = 4

**[EVIDENCE:STATE-4]**
- 文件: `src/hooks/mode-registry/index.ts`
- 常量: `EXCLUSIVE_MODES`

---

## [FINDING:STATE-5] 状态持久化机制

**存储架构** (来源: `state-adapter.ts`):

1. **会话级状态** (优先):
   ```
   .omc/state/sessions/{sessionId}/{mode}-state.json
   ```

2. **全局状态** (回退):
   ```
   .omc/state/{mode}-state.json
   ```

**并发保护机制**:
- **文件锁**: `withFileLock()` 确保原子性
- **原子写入**: `atomicWriteJsonSync()` 防止部分写入
- **重试机制**: 3 次重试
- **缓存失效**: 写入后 `invalidateStateCache()`
- **文件权限**: mode 0o600 (仅所有者可读写)

**[STAT:retry_attempts]** n = 3

**[EVIDENCE:STATE-5]**
- 文件: `src/lib/state-adapter.ts`
- 原子写入: `src/lib/atomic-write.ts`
- 文件锁: `src/lib/file-lock.ts`

---

## [FINDING:STATE-6] 取消和恢复机制

**取消处理** (来源: `autopilot/cancel.ts`):

**级联清理**:
1. 清理 Ralph 状态 (如果 active)
2. 清理 Ultrawork 状态 (如果 linked)
3. 清理 UltraQA 状态 (如果 active)
4. 标记 `autopilot.active = false`

**状态保留**:
- 保留 phase, iteration, artifacts 等字段
- 用于后续恢复

**恢复守卫条件**:
- 非终态 (complete/failed)
- 中断检测: `active=true` 且超过 5 分钟无更新
- 防止过期: 状态文件不超过 1 小时
- 迭代限制: `iteration < max_iterations`

**[STAT:interrupted_threshold_ms]** n = 300000 (5分钟)
**[STAT:stale_state_max_age_ms]** n = 3600000 (1小时)

**[EVIDENCE:STATE-6]**
- 文件: `src/hooks/autopilot/cancel.ts`
- 函数: `canResumeAutopilot()`, `resumeAutopilot()`

---

## [FINDING:STATE-7] Team Pipeline 取消和恢复

**取消机制** (来源: `team-pipeline/transitions.ts`):

**requestTeamCancel() 行为**:
```typescript
{
  cancel: {
    requested: true,
    requested_at: timestamp,
    preserve_for_resume: true/false
  },
  phase: 'cancelled',
  active: false,
  completed_at: timestamp
}
```

**恢复机制**:
- 从 cancelled 恢复需要 `preserve_for_resume = true`
- 允许转换: `cancelled → team-plan` 或 `team-exec`
- 恢复时重新激活: `active = true`, `completed_at = null`

**[STAT:resume_allowed_phases]** n = 2 (team-plan, team-exec)

**[EVIDENCE:STATE-7]**
- 文件: `src/hooks/team-pipeline/transitions.ts`
- 函数: `requestTeamCancel()`, `transitionTeamPhase()`

---

## [FINDING:STATE-8] 事务性转换机制

**TransactionHelper 设计** (来源: `autopilot/transition-helper.ts`):

**特性**:
- **原子性**: 所有步骤成功或全部回滚
- **回滚顺序**: 逆序执行 `rollback()`
- **最佳努力**: rollback 失败不阻塞后续回滚

**使用场景 - Ralph → UltraQA 转换**:
```typescript
步骤1: 保存 Ralph 进度到 autopilot 状态
步骤2: 清理 Ralph 和 Ultrawork 状态
步骤3: 转换到 qa 阶段
步骤4: 启动 UltraQA
失败时: 回滚到 execution 阶段
```

**[STAT:ralph_to_qa_steps]** n = 4

**[EVIDENCE:STATE-8]**
- 文件: `src/hooks/autopilot/transition-helper.ts`
- 使用: `src/hooks/autopilot/state.ts:transitionRalphToUltraQA()`

---

## [FINDING:STATE-9] 状态验证和守卫

**Team Pipeline 转换守卫** (来源: `transitions.ts`):

**hasRequiredArtifactsForPhase() 检查**:

1. **team-exec 守卫**:
   ```typescript
   if (!state.artifacts.plan_path && !state.artifacts.prd_path) {
     return 'team-exec requires plan_path or prd_path artifact';
   }
   ```

2. **team-verify 守卫**:
   ```typescript
   if (!isNonNegativeFiniteInteger(state.execution.tasks_total)) {
     return 'tasks_total must be a non-negative finite integer';
   }
   if (state.execution.tasks_completed < state.execution.tasks_total) {
     return 'tasks_completed < tasks_total';
   }
   ```

3. **fix-loop 守卫**:
   ```typescript
   if (updated.fix_loop.attempt > updated.fix_loop.max_attempts) {
     return { ok: false, state: failed, reason: 'Fix loop exceeded max_attempts' };
   }
   ```

**[STAT:guard_checks]** n = 3 类守卫

**[EVIDENCE:STATE-9]**
- 文件: `src/hooks/team-pipeline/transitions.ts`
- 函数: `hasRequiredArtifactsForPhase()`, `markTeamPhase()`

---

## [FINDING:STATE-10] 会话隔离和路径安全

**会话隔离机制** (来源: `state-adapter.ts`, `worktree-paths.ts`):

**路径解析策略**:
1. **有 sessionId**: 仅检查会话路径，无回退
   ```
   .omc/state/sessions/{sessionId}/{mode}-state.json
   ```

2. **无 sessionId**: 使用全局路径 (向后兼容)
   ```
   .omc/state/{mode}-state.json
   ```

**安全边界** (不可协商):
- `mode` 参数必须通过 `assertValidMode()` 校验
- `sessionId` 必须通过 `assertValidSessionId()` 校验
- 防止路径遍历攻击

**会话验证**:
```typescript
// 读取状态时检查
if (state.session_id && state.session_id !== sessionId) {
  return null; // 防止跨会话泄漏
}
```

**[STAT:validation_layers]** n = 3 (mode, sessionId, state.session_id)

**[EVIDENCE:STATE-10]**
- 文件: `src/lib/state-adapter.ts`
- 验证: `src/lib/validateMode.ts`
- 路径: `src/lib/worktree-paths.ts`

---

## [FINDING:STATE-11] Stale 检测双重阈值

**两个不同的 stale 概念** (来源: `state-machine.md`):

### 1. Agent Stale (5 分钟)
- **常量**: `STALE_THRESHOLD_MS = 5 * 60 * 1000`
- **用途**: 检测 agent 运行状态是否过期
- **触发**: WAITING 状态超过 5 分钟
- **后果**: 强制 SHUTDOWN
- **位置**: `subagent-tracker/index.ts`

### 2. Mode Stale Marker (1 小时)
- **常量**: `STALE_MARKER_THRESHOLD = 60 * 60 * 1000`
- **用途**: 检测模式状态文件的 marker
- **触发**: marker 文件超过 1 小时
- **后果**: 自动清理 marker，允许模式重新激活
- **位置**: `mode-registry/index.ts`

**[STAT:agent_stale_ms]** n = 300000 (5分钟)
**[STAT:mode_stale_ms]** n = 3600000 (1小时)

**[EVIDENCE:STATE-11]**
- 文件: `docs/standards/state-machine.md`
- Agent: `src/hooks/subagent-tracker/index.ts`
- Mode: `src/hooks/mode-registry/index.ts`

---

## [LIMITATION] 分析局限性

### 1. ZOMBIE 状态实现缺失
- 规范要求 30 秒超时检测
- 代码中未见 `ZOMBIE_TIMEOUT_MS` 常量
- 需要在 v2 中补充实现

### 2. 长时间运行的 Swarm
- 1 小时 marker 阈值可能误杀合法的长时间任务
- 无法检查数据库活动 (循环依赖限制)
- 这是已知的权衡

### 3. 跨会话互斥检测
- `canStartMode()` 检查所有会话
- 可能阻止合法的并行会话
- 需要更细粒度的会话级互斥

---

## [CONFIDENCE:HIGH]

**证据充分性**:
- ✅ 状态机设计有完整文档和测试
- ✅ 转换规则有明确的守卫条件
- ✅ 持久化机制有多层保护
- ✅ 取消/恢复逻辑有事务性保证
- ✅ 会话隔离有安全边界

**代码覆盖**:
- Autopilot: 7 个阶段，5 个转换
- Ralph: 持久循环，3 种完成条件
- Team Pipeline: 8 个阶段，转换矩阵完整
- 互斥检测: 4 个互斥模式，4 个可组合模式

---

## [STAGE_COMPLETE:6]

**下一步建议**:
1. 补充 ZOMBIE 状态实现
2. 优化长时间运行任务的 marker 策略
3. 实现会话级互斥检测
