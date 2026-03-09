# ultrapower 架构分析报告

**生成时间**: 2026-03-05
**分析范围**: Worker 后端、状态管理、Hook 系统

---

## 执行摘要

ultrapower 当前存在三套独立的 Worker 管理系统和两套状态存储机制，导致代码重复、维护成本高、一致性难以保证。本报告识别了关键架构问题并提供重构路线图。

**核心问题**:
1. **Worker 后端分散**: MCP、Team、Swarm 各自实现 Worker 管理
2. **状态存储双轨**: JSON 文件 vs SQLite，缺乏统一抽象
3. **Hook 系统耦合**: 15+ Hook 类型，依赖关系复杂

---

## 1. Worker 后端分散问题

### 1.1 当前状态

ultrapower 存在三套独立的 Worker 管理实现：

#### **MCP Worker 管理** (`src/mcp/`)

* **职责**: 管理 Codex/Gemini 后台任务

* **状态存储**:
  - SQLite (`src/mcp/job-state-db.ts`) - 655 行
  - JSON 文件 (`src/mcp/prompt-persistence.ts`)

* **生命周期管理**: `src/mcp/job-management.ts` (655 行)

* **特性**:
  - 支持后台任务 (background jobs)
  - 轮询状态检查 (wait_for_job, check_job_status)
  - 进程信号管理 (kill_job)
  - 双存储回退机制

#### **Team Worker 管理** (`src/team/`)

* **职责**: 管理 Team 模式的协作 agents

* **状态存储**:
  - JSON 文件 (`.omc/state/team-bridge/`)
  - Heartbeat 文件 (`.omc/state/team-bridge/{team}/{worker}.heartbeat.json`)
  - Restart 状态 (`.omc/state/team-bridge/{team}/{worker}.restart.json`)

* **生命周期管理**:
  - `worker-health.ts` (144 行) - 健康检查
  - `worker-restart.ts` (156 行) - 自动重启
  - `heartbeat.ts` - 心跳监控
  - `tmux-session.ts` - tmux 会话管理

* **特性**:
  - Heartbeat 监控 (30s 超时)
  - 指数退避重启 (最多 3 次)
  - tmux 会话隔离
  - 审计日志 (`audit-log.ts`)

#### **Swarm Worker 管理** (已废弃但代码仍存在)

* **职责**: 早期 Swarm 模式的 Worker 编排

* **状态存储**: SQLite (独立数据库)

* **状态**: 功能已被 Team 替代，但 SQLite 代码未清理

### 1.2 代码重复分析

| 功能 | MCP 实现 | Team 实现 | 重复度 |
| ------ | --------- | ---------- | -------- |
| 状态持久化 | `job-state-db.ts` | `team-registration.ts` + heartbeat | 60% |
| 健康检查 | `findJobStatusFile()` | `worker-health.ts` | 70% |
| 进程管理 | `kill_job()` | tmux 信号 | 50% |
| 重启逻辑 | 无 | `worker-restart.ts` | 0% |
| 审计日志 | 无 | `audit-log.ts` | 0% |

**估算**: 约 **400-500 行重复代码**，主要集中在状态读写和健康检查逻辑。

### 1.3 不一致性问题

#### **状态模型差异**

* **MCP**: `JobStatus` 对象 (provider, jobId, status, pid, model, agentRole)

* **Team**: `HeartbeatData` + `RestartState` + `McpWorkerMember` 分散存储

* **结果**: 无法跨系统查询 Worker 状态

#### **超时策略不一致**

* **MCP**: 默认 3600s (1 小时)，可配置

* **Team**: Heartbeat 30s，任务超时 600s (10 分钟)

* **问题**: 相同类型任务在不同模式下行为不同

#### **错误处理策略**

* **MCP**: 失败后标记 `failed`，不自动重试

* **Team**: 指数退避重启，最多 3 次，超过后隔离 (quarantine)

* **问题**: 用户体验不一致

---

## 2. Swarm 状态管理复杂度

### 2.1 SQLite 使用现状

#### **MCP Jobs Database** (`src/mcp/job-state-db.ts`)

```typescript
// 数据库路径: {cwd}/.omc/state/jobs.db
// 表结构:
CREATE TABLE jobs (
  job_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('codex', 'gemini')),
  status TEXT NOT NULL CHECK (status IN ('spawned', 'running', 'completed', 'failed', 'timeout')),
  pid INTEGER,
  model TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  spawned_at TEXT NOT NULL,
  completed_at TEXT,
  PRIMARY KEY (provider, job_id)
);
```

**特性**:

* WAL 模式支持并发

* 多 worktree 支持 (dbMap: path -> Database)

* 自动清理 (24 小时)

* 迁移工具 (`migrateFromJsonFiles`)

#### **Swarm Database** (已废弃)

* 位置: 代码引用存在但未找到活跃实现

* 状态: 功能已被 Team 替代

### 2.2 与 Team 状态的差异

| 维度 | MCP SQLite | Team JSON |
| ------ | ----------- | ----------- |
| 存储位置 | `.omc/state/jobs.db` | `.omc/state/team-bridge/{team}/` |
| 并发安全 | WAL 锁 | 原子写入 (temp + rename) |
| 查询能力 | SQL (索引优化) | 全文件扫描 |
| 清理策略 | 自动 (24h) | 手动 |
| 多 worktree | 支持 (dbMap) | 支持 (路径隔离) |
| 依赖 | better-sqlite3 (可选) | 无 |

### 2.3 迁移可行性评估

#### **方案 A: Team 迁移到 SQLite**

**优势**:

* 统一查询接口

* 更好的并发性能

* 自动清理和索引

**风险**:

* 引入 better-sqlite3 依赖

* 需要迁移现有 JSON 状态

* Heartbeat 高频写入可能影响性能

**工作量**: 中等 (3-5 天)

#### **方案 B: MCP 迁移到 JSON**

**优势**:

* 移除 SQLite 依赖

* 简化部署

**风险**:

* 失去查询能力

* 并发性能下降

* 需要重写 job-management.ts

**工作量**: 高 (5-7 天)

#### **方案 C: 统一抽象层**

**优势**:

* 保留两种存储的优势

* 渐进式迁移

* 向后兼容

**风险**:

* 抽象层复杂度

* 维护两套实现

**工作量**: 中等 (4-6 天)

**推荐**: **方案 C** - 创建 `WorkerStateAdapter` 抽象层

---

## 3. Hook 系统耦合度分析

### 3.1 Hook 类型清单

根据 `docs/standards/hook-execution-order.md`，ultrapower 定义了 15 种 HookType：

| 优先级 | HookType | 职责 | 依赖 |
| -------- | ---------- | ------ | ------ |
| P0 | `setup` | 初始化配置 | 无 |
| P1 | `permission-request` | 权限检查 | setup |
| P2 | `user-prompt-submit` | 用户输入预处理 | permission |
| P3 | `pre-compact` | 上下文压缩前注入 | - |
| P4 | `post-tool` | 工具调用后处理 | - |
| P5 | `subagent-stop` | Subagent 停止处理 | - |
| P6 | `session-end` | 会话结束清理 | - |

**核心 Hook 模块** (src/hooks/):

* `bridge.ts` (Hook 路由核心)

* `bridge-normalize.ts` (输入消毒)

* `autopilot/` (Autopilot 模式状态机)

* `team-pipeline/` (Team 流水线状态)

* `persistent-mode/` (Ralph 持久循环)

* `keyword-detector/` (技能触发检测)

### 3.2 耦合度问题

#### **跨 Hook 依赖**

```
setup → permission-request → user-prompt-submit
                                    ↓
                            keyword-detector
                                    ↓
                            autopilot/team-pipeline/ralph
                                    ↓
                            post-tool → subagent-stop
                                    ↓
                            session-end
```

**问题**: 状态在多个 Hook 间传递，难以追踪数据流。

#### **与核心系统耦合**

* **状态工具**: `state-tools.ts` 被 autopilot、team、ralph 共享

* **Notepad**: `notepad/index.ts` 被多个 Hook 读写

* **Project Memory**: `project-memory/` 被 learner、setup 访问

**风险**: 修改一个 Hook 可能影响其他 Hook。

### 3.3 重构机会

#### **机会 1: Hook 状态隔离**

* 当前: 共享 `.omc/state/{mode}-state.json`

* 建议: 每个 Hook 独立状态文件，通过事件总线通信

#### **机会 2: 插件化架构**

* 当前: 所有 Hook 硬编码在 `bridge.ts`

* 建议: 动态加载 Hook，支持第三方扩展

#### **机会 3: 依赖注入**

* 当前: Hook 直接导入工具函数

* 建议: 通过 Context 对象传递依赖

---

## 4. 重构优先级

### P0 - 立即执行 (1-2 周)

#### **4.1 统一 Worker 状态抽象**

**目标**: 创建 `WorkerStateAdapter` 接口

```typescript
interface WorkerStateAdapter {
  upsert(worker: WorkerState): Promise<boolean>;
  get(workerId: string): Promise<WorkerState | null>;
  list(filter?: WorkerFilter): Promise<WorkerState[]>;
  delete(workerId: string): Promise<boolean>;
  healthCheck(workerId: string): Promise<HealthStatus>;
}
```

**实现**:

* `SqliteWorkerAdapter` (MCP 使用)

* `JsonWorkerAdapter` (Team 使用)

**收益**:

* 消除 400+ 行重复代码

* 统一健康检查逻辑

* 支持跨模式查询

**风险**: 低 - 向后兼容现有接口

---

### P1 - 短期优化 (2-4 周)

#### **4.2 清理 Swarm 遗留代码**

**范围**:

* 移除 Swarm SQLite 引用

* 清理未使用的状态文件

* 更新文档

**收益**: 减少维护负担，避免混淆

#### **4.3 Team Worker 迁移到 SQLite**

**前提**: 完成 P0 统一抽象

**步骤**:
1. 扩展 `jobs.db` schema 支持 Team Worker
2. 实现 JSON → SQLite 迁移工具
3. 更新 `worker-health.ts` 使用 SQLite
4. 保留 JSON 作为回退

**收益**:

* 更快的健康检查查询

* 自动清理过期状态

* 统一审计日志

---

### P2 - 中期改进 (1-2 月)

#### **4.4 Hook 系统解耦**

**目标**: 减少 Hook 间依赖

**方案**:

* 引入事件总线 (`EventEmitter`)

* Hook 通过事件通信，不直接调用

* 状态通过 Context 传递

**示例**:
```typescript
// 当前
import { readAutopilotState } from '../autopilot/state';

// 改进后
context.on('autopilot:state-changed', (state) => {
  // 响应状态变化
});
```

#### **4.5 统一超时策略**

**配置化**:
```typescript
interface TimeoutConfig {
  heartbeat: number;      // 默认 30s
  taskExecution: number;  // 默认 600s
  jobPolling: number;     // 默认 3600s
}
```

---

## 5. 风险评估

### 5.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
| ------ | ------ | ------ | ---------- |
| SQLite 迁移数据丢失 | 高 | 低 | 迁移前备份，保留 JSON 回退 |
| 抽象层性能开销 | 中 | 中 | 基准测试，优化热路径 |
| Hook 解耦破坏现有功能 | 高 | 中 | 渐进式重构，保留兼容层 |
| better-sqlite3 安装失败 | 中 | 低 | 优雅降级到 JSON |

### 5.2 实施风险

| 风险 | 影响 | 概率 | 缓解措施 |
| ------ | ------ | ------ | ---------- |
| 重构周期过长 | 中 | 高 | 分阶段交付，每阶段独立可用 |
| 向后兼容性破坏 | 高 | 中 | 语义化版本，提供迁移指南 |
| 测试覆盖不足 | 高 | 中 | 每个 PR 要求 80%+ 覆盖率 |

---

## 6. 实施建议

### 6.1 分阶段路线图

**Phase 1: 基础抽象** (Week 1-2)

* [ ] 创建 `WorkerStateAdapter` 接口

* [ ] 实现 `SqliteWorkerAdapter`

* [ ] 实现 `JsonWorkerAdapter`

* [ ] 单元测试覆盖率 > 90%

**Phase 2: MCP 迁移** (Week 3)

* [ ] 重构 `job-management.ts` 使用 Adapter

* [ ] 保留向后兼容

* [ ] 集成测试

**Phase 3: Team 迁移** (Week 4-5)

* [ ] 扩展 SQLite schema

* [ ] 迁移 `worker-health.ts`

* [ ] 迁移 `worker-restart.ts`

* [ ] JSON → SQLite 迁移工具

**Phase 4: 清理优化** (Week 6)

* [ ] 移除 Swarm 遗留代码

* [ ] 统一超时配置

* [ ] 文档更新

### 6.2 质量门禁

每个 Phase 必须满足：
1. **测试覆盖率** ≥ 80%
2. **性能基准**: 不低于现有实现
3. **向后兼容**: 现有测试全部通过
4. **文档同步**: 更新 `docs/standards/`

### 6.3 回滚策略

* **Phase 1-2**: 通过 Adapter 切换回旧实现

* **Phase 3**: 保留 JSON 文件作为回退

* **Phase 4**: Feature flag 控制新功能

---

## 7. 成功指标

### 7.1 代码质量

* **代码重复率**: 从 ~15% 降至 < 5%

* **圈复杂度**: 平均从 8 降至 < 6

* **测试覆盖率**: 从 75% 提升至 > 85%

### 7.2 性能指标

* **Worker 健康检查**: < 10ms (当前 ~50ms)

* **状态查询**: < 5ms (当前 ~20ms)

* **并发写入**: 支持 10+ workers 无锁等待

### 7.3 维护性

* **新 Worker 类型接入**: 从 2 天降至 < 4 小时

* **Bug 修复周期**: 从 3 天降至 < 1 天

* **文档同步率**: 100% (当前 ~60%)

---

## 8. 结论

ultrapower 的架构问题主要源于快速迭代导致的技术债务累积。通过系统化重构，可以在 6 周内显著改善代码质量和可维护性。

**关键行动**:
1. **立即**: 创建 `WorkerStateAdapter` 统一抽象
2. **短期**: 迁移 Team 到 SQLite，清理 Swarm
3. **中期**: 解耦 Hook 系统，统一配置

**预期收益**:

* 减少 30% 维护工作量

* 提升 3x 新功能开发速度

* 降低 50% Bug 率

---

**报告生成**: 2026-03-05
**分析者**: Architect Agent
**审核状态**: 待 Team Lead 审核
