# P0-3.2 未覆盖关键路径分析

**生成时间**: 2026-03-05
**分析范围**: Team Pipeline、Hook 系统、MCP 集成、Axiom 工作流
**目标**: 识别高风险未覆盖路径，提供测试场景建议

---

## 1. Team Pipeline 关键路径（83.77% lines, 72.63% branches）

### 1.1 阶段转换逻辑（HIGH RISK）

**未覆盖路径**:

* `plan → prd` 转换：缺少错误恢复分支

* `prd → exec` 转换：缺少验收标准验证失败场景

* `exec → verify` 转换：缺少部分任务完成场景

* `verify → fix` 循环：缺少 fix_loop_count 超限场景

* `fix → complete/failed` 终态：缺少异常终止场景

**风险评估**: 🔴 高

* 影响: 核心工作流状态机

* 后果: 任务可能卡在中间状态，无法恢复

* 覆盖率缺口: 分支覆盖 12.37%

**测试场景**:
```
1. plan 阶段异常 → 自动回滚到 IDLE
2. prd 生成失败 → 重试或转 failed
3. exec 中部分任务超时 → verify 阶段检测并标记
4. fix 循环超过 max_iterations → 转 failed 并记录
5. 并发阶段转换冲突 → 状态锁定防护
```

### 1.2 错误处理与回滚（HIGH RISK）

**未覆盖路径**:

* 状态文件损坏恢复

* 并发写入冲突处理

* 网络中断导致的部分更新

* 磁盘满导致的状态持久化失败

**风险评估**: 🔴 高

* 影响: 数据一致性

* 后果: 状态不可恢复，需手动干预

* 文件: `src/team/unified-team.ts`, `src/team/task-file-ops.ts`

**测试场景**:
```
1. 读取损坏的 state JSON → 降级到默认状态
2. 并发修改同一任务 → 最后写入胜利或合并
3. 写入中断 → 原子性保证（临时文件 + rename）
4. 磁盘满 → 清理旧日志或返回错误
```

### 1.3 状态持久化（MEDIUM RISK）

**未覆盖路径**:

* 大型状态文件序列化性能

* 状态版本迁移（schema 升级）

* 跨 worktree 状态同步

**风险评估**: 🟡 中

* 影响: 性能和兼容性

* 文件: `src/team/task-file-ops.ts`

**测试场景**:
```
1. 100+ 任务状态序列化 → 性能基准
2. 旧版本状态文件读取 → 自动升级
3. 多 worktree 并发访问 → 文件锁定
```

---

## 2. Hook 系统关键路径（68.11% lines）

### 2.1 15 类 HookType 执行顺序（HIGH RISK）

**未覆盖路径**:

* `keyword-detector` → `auto-slash-command` 链式触发

* `permission-request` 阻塞模式（用户确认超时）

* `session-end` 清理顺序（状态保存 → 资源释放）

* Hook 优先级冲突（同时触发多个 hook）

* Hook 间依赖关系（A 的输出作为 B 的输入）

**风险评估**: 🔴 高

* 影响: 所有工作流

* 后果: Hook 执行顺序错误导致状态不一致

* 文件: `src/hooks/bridge.ts`, `src/hooks/omc-orchestrator/index.ts`

**HookType 覆盖清单**:
```
✅ keyword-detector (有测试)
✅ auto-slash-command (有测试)
⚠️ permission-request (缺少超时/拒绝场景)
⚠️ session-end (缺少清理顺序验证)
❌ tool-error (零覆盖)
❌ tool-success (零覆盖)
❌ agent-idle (零覆盖)
❌ agent-error (零覆盖)
❌ mode-transition (零覆盖)
❌ state-change (零覆盖)
❌ file-save (零覆盖)
❌ background-job (零覆盖)
❌ compaction-start (零覆盖)
❌ compaction-end (零覆盖)
❌ custom (零覆盖)
```

**测试场景**:
```
1. keyword-detector 触发 → auto-slash-command 自动执行
2. permission-request 用户 30s 未响应 → 超时处理
3. permission-request 用户拒绝 → 继续或中止
4. session-end 触发 → 依次执行清理 hooks
5. 同时触发 3+ hooks → 优先级排序执行
6. Hook A 失败 → Hook B 是否继续执行
```

### 2.2 超时与降级逻辑（HIGH RISK）

**未覆盖路径**:

* Hook 执行超时（默认 30s）

* 降级到同步执行

* 降级到跳过 hook

* 环境变量 `DISABLE_OMC` 和 `OMC_SKIP_HOOKS` 交互

**风险评估**: 🔴 高

* 影响: Hook 可靠性

* 文件: `src/hooks/bridge.ts`

**测试场景**:
```
1. Hook 执行 > 30s → 超时中断
2. 超时后自动降级到同步
3. DISABLE_OMC=1 → 所有 hooks 跳过
4. OMC_SKIP_HOOKS=keyword-detector,permission-request → 选择性跳过
5. 环境变量冲突 → DISABLE_OMC 优先级最高
```

### 2.3 Permission-Request 阻塞模式（HIGH RISK）

**未覆盖路径**:

* 用户确认超时处理

* 多个 permission-request 并发

* 权限拒绝后的重试逻辑

* 权限缓存失效

**风险评估**: 🔴 高

* 影响: 安全性和用户体验

* 文件: `src/hooks/bridge.ts`

**测试场景**:
```
1. permission-request 等待用户 → 30s 超时
2. 用户拒绝权限 → 返回 continue:false
3. 用户批准权限 → 缓存 1h
4. 缓存过期 → 重新请求
5. 并发 2+ permission-request → 队列化处理
```

---

## 3. MCP 集成关键路径（58.86% lines）

### 3.1 Worker 生命周期（HIGH RISK）

**未覆盖路径**:

* Worker 启动失败恢复

* Worker 心跳丢失检测

* Worker 自动隔离（quarantine）

* Worker 重启策略

* Worker 资源清理

**风险评估**: 🔴 高

* 影响: 外部集成可靠性

* 文件: `src/mcp/job-management.ts`, `src/team/worker-health.ts`, `src/team/worker-restart.ts`

**测试场景**:
```
1. Worker 启动超时 → 标记为 dead
2. 心跳 3 次连续失败 → 自动隔离
3. 隔离后恢复 → 重启并重新注册
4. Worker 进程崩溃 → 检测并清理资源
5. 并发 3+ worker 故障 → 优先级恢复
```

### 3.2 任务分配与执行（HIGH RISK）

**未覆盖路径**:

* 任务分配到不可用 worker

* 任务执行超时（600s）

* 任务重试策略（max_retries=5）

* 任务优先级抢占

* 任务结果序列化失败

**风险评估**: 🔴 高

* 影响: 任务可靠性

* 文件: `src/mcp/job-management.ts`

**测试场景**:
```
1. 分配任务到 quarantined worker → 自动转移
2. 任务执行 > 600s → 超时中止
3. 任务失败 → 自动重试（指数退避）
4. 重试 5 次仍失败 → 标记为 failed
5. 高优先级任务 → 抢占低优先级
6. 结果 > 1MB → 分片存储
```

### 3.3 心跳机制（MEDIUM RISK）

**未覆盖路径**:

* 心跳间隔变化（3s → 30s）

* 心跳数据损坏

* 心跳文件权限问题

* 心跳时钟偏差

**风险评估**: 🟡 中

* 影响: Worker 状态监控

* 文件: `src/team/heartbeat.ts`

**测试场景**:
```
1. 心跳文件损坏 → 降级到 unknown 状态
2. 心跳时间戳 > 60s → 标记为 dead
3. 并发写入心跳 → 最后写入胜利
4. 心跳文件权限 444 → 读取成功
```

---

## 4. Axiom 工作流关键路径（未独立测试）

### 4.1 4 阶段工作流（HIGH RISK）

**未覆盖路径**:

* `IDLE → EXECUTING` 转换

* `EXECUTING → BLOCKED` 错误恢复

* `BLOCKED → IDLE` 用户干预

* `EXECUTING → ARCHIVING` 完成归档

* 阶段间数据传递

**风险评估**: 🔴 高

* 影响: Axiom 核心工作流

* 文件: `.omc/axiom/active_context.md` (状态文件)

**测试场景**:
```
1. 启动 Axiom 任务 → IDLE → EXECUTING
2. 任务遇到错误 → EXECUTING → BLOCKED
3. 用户确认继续 → BLOCKED → EXECUTING
4. 任务完成 → EXECUTING → ARCHIVING
5. 并发修改状态文件 → 原子性保证
```

### 4.2 Expert Gate（PRD 评审门禁）（HIGH RISK）

**未覆盖路径**:

* `/ax-draft` 生成 PRD

* `/ax-review` 专家评审

* 评审拒绝 → 返回 draft

* 评审通过 → 进入 exec

**风险评估**: 🔴 高

* 影响: 需求质量

* 文件: `src/hooks/axiom-guards/index.ts`

**测试场景**:
```
1. 跳过 /ax-draft 直接 /ax-implement → 被拦截
2. /ax-draft 生成 PRD → 自动触发 /ax-review
3. 评审拒绝 → 返回 draft 阶段
4. 评审通过 → 解锁 /ax-implement
```

### 4.3 CI Gate（编译提交门禁）（HIGH RISK）

**未覆盖路径**:

* `tsc --noEmit` 失败

* `npm run build` 失败

* `npm test` 失败

* 部分失败（e.g., 仅 test 失败）

**风险评估**: 🔴 高

* 影响: 代码质量

* 文件: `src/hooks/axiom-guards/index.ts`

**测试场景**:
```
1. tsc 有错误 → 阻止提交
2. build 成功但 test 失败 → 阻止提交
3. 所有检查通过 → 允许提交
4. 检查超时 → 降级到警告
```

### 4.4 Scope Gate（范围门禁）（MEDIUM RISK）

**未覆盖路径**:

* 修改文件超出 `Impact Scope`

* 用户确认越界修改

* 范围定义更新

**风险评估**: 🟡 中

* 影响: 变更范围控制

* 文件: `src/hooks/axiom-guards/index.ts`

**测试场景**:
```
1. 修改 src/team/index.ts（在范围内）→ 允许
2. 修改 src/cli/index.ts（超出范围）→ 警告
3. 用户确认 → 继续
4. 用户拒绝 → 回滚修改
```

---

## 5. 优先级排序与风险矩阵

### P0 - 关键路径（必须覆盖）

| 路径 | 模块 | 当前覆盖 | 风险 | 工作量 | 优先级 |
| ------ | ------ | --------- | ------ | -------- | -------- |
| Team 阶段转换 | team/ | 72.63% branches | 🔴 高 | 8h | P0-1 |
| Hook 执行顺序 | hooks/ | 68.11% lines | 🔴 高 | 12h | P0-2 |
| MCP Worker 生命周期 | mcp/ | 58.86% lines | 🔴 高 | 10h | P0-3 |
| Axiom 4 阶段工作流 | axiom/ | 0% | 🔴 高 | 8h | P0-4 |
| 状态机边界条件 | state/ | 未知 | 🔴 高 | 6h | P0-5 |

### P1 - 重要功能（应该覆盖）

| 路径 | 模块 | 当前覆盖 | 风险 | 工作量 | 优先级 |
| ------ | ------ | --------- | ------ | -------- | -------- |
| Hook 超时与降级 | hooks/ | 68.11% lines | 🟡 中 | 6h | P1-1 |
| Permission-Request 阻塞 | hooks/ | 68.11% lines | 🟡 中 | 5h | P1-2 |
| 心跳机制 | team/ | 83.77% lines | 🟡 中 | 4h | P1-3 |
| Axiom Expert Gate | axiom/ | 0% | 🟡 中 | 4h | P1-4 |

### P2 - 辅助功能（可选覆盖）

| 路径 | 模块 | 当前覆盖 | 风险 | 工作量 | 优先级 |
| ------ | ------ | --------- | ------ | -------- | -------- |
| Axiom Scope Gate | axiom/ | 0% | 🟢 低 | 3h | P2-1 |
| 状态持久化性能 | team/ | 83.77% lines | 🟢 低 | 4h | P2-2 |

---

## 6. 测试策略建议

### 6.1 Team Pipeline 测试

**文件**: `src/team/__tests__/pipeline-transitions.test.ts` (新建)

```typescript
// 关键测试用例

* plan → prd 正常转换

* plan → prd 异常恢复

* prd → exec 验收标准验证

* exec → verify 部分完成处理

* verify → fix 循环计数

* fix 超限 → failed

* 并发转换冲突

* 状态文件损坏恢复
```

### 6.2 Hook 系统测试

**文件**: `src/hooks/__tests__/hook-priority-chain.test.ts` (新建)

```typescript
// 关键测试用例

* 15 类 HookType 执行顺序

* Hook 优先级冲突

* Hook 超时处理

* permission-request 用户确认

* permission-request 超时

* DISABLE_OMC 全局禁用

* OMC_SKIP_HOOKS 选择性跳过

* Hook 间依赖关系
```

### 6.3 MCP Worker 生命周期测试

**文件**: `src/mcp/__tests__/worker-lifecycle.test.ts` (新建)

```typescript
// 关键测试用例

* Worker 启动失败

* 心跳丢失检测

* 自动隔离与恢复

* 任务分配到不可用 worker

* 任务超时重试

* 并发 worker 故障

* 资源清理
```

### 6.4 Axiom 工作流测试

**文件**: `src/hooks/axiom-guards/__tests__/workflow.test.ts` (新建)

```typescript
// 关键测试用例

* IDLE → EXECUTING 转换

* EXECUTING → BLOCKED 错误恢复

* Expert Gate 拦截

* CI Gate 编译检查

* Scope Gate 范围验证

* 并发状态修改
```

---

## 7. 实施路线图

### 第 1 阶段（P0-3.3 ~ P0-3.5）- 关键路径覆盖

**周期**: 3 周
**目标**: Team + Hook + MCP 达到 85%+ 覆盖率

1. **P0-3.3**: Team Pipeline 阶段转换测试 (8h)
2. **P0-3.4**: Axiom 4 阶段工作流测试 (8h)
3. **P0-3.5**: Hook 优先级链执行测试 (12h)

### 第 2 阶段（P0-3.6 ~ P0-3.7）- 边界条件覆盖

**周期**: 2 周
**目标**: 状态机 + MCP 达到 85%+ 覆盖率

1. **P0-3.6**: 状态机边界条件测试 (6h)
2. **P0-3.7**: MCP worker 生命周期测试 (10h)

### 第 3 阶段（P0-3.8 ~ P0-3.9）- 集成验证

**周期**: 1 周
**目标**: 端到端工作流验证 + 覆盖率达标

1. **P0-3.8**: 集成测试：端到端工作流 (8h)
2. **P0-3.9**: 覆盖率验证（目标 85%+）(4h)

---

## 8. 风险评估总结

| 模块 | 当前覆盖率 | 风险等级 | 影响范围 | 建议行动 |
| ------ | ----------- | --------- | --------- | --------- |
| Team Pipeline | 83.77% | 🟡 中 | 核心工作流 | 补充分支覆盖 |
| Hooks System | 68.11% | 🔴 高 | 所有工作流 | 优先级链测试 |
| MCP Integration | 58.86% | 🔴 高 | 外部集成 | Worker 生命周期测试 |
| Axiom Workflow | 0% | 🔴 高 | 需求工作流 | 4 阶段工作流测试 |
| State Management | 未知 | 🔴 高 | 持久化 | 边界条件测试 |

---

## 9. 下一步

✅ **已完成**: P0-3.2 未覆盖路径分析
⏭️ **下一步**: 执行 P0-3.3 Team Pipeline 阶段转换测试

**预计总工作量**: 55-65 小时
**预计完成时间**: 4-5 周
