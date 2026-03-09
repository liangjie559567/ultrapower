# ADR-003: 渐进式迁移方案

**状态**: 接受

**日期**: 2026-03-05

**作者**: P1-5 Architecture Team

---

## 背景

### 问题陈述

WorkerStateAdapter 抽象层创建后，需要将现有 MCP 和 Team 模块迁移到新接口。直接迁移风险高：

* 可能破坏现有功能

* 无法快速回滚

* 难以隔离问题

### 约束条件

* 必须保持 100% 向后兼容

* 每个阶段必须独立可验证

* 迁移期间不能中断服务

* 需要支持快速回滚

---

## 决策

采用分阶段迁移策略，每个阶段独立交付，保留回退机制。

### 选择的方案

**四阶段迁移**:

| 阶段 | 目标 | 耗时 | 风险 |
| ------ | ------ | ------ | ------ |
| Phase 1 | 创建抽象层 | 1 周 | 低 |
| Phase 2 | MCP 迁移 | 1 周 | 中 |
| Phase 3 | Team 迁移 | 1 周 | 中 |
| Phase 4 | 优化清理 | 1 周 | 低 |

**Phase 1: 基础抽象层**

* 创建 `src/workers/` 目录

* 实现 SQLite 和 JSON 适配器

* 单元测试覆盖率 > 90%

* 不修改现有代码，零风险

**Phase 2: MCP 迁移**

* 修改 `src/mcp/job-management.ts`

* 环境变量 `WORKER_BACKEND=auto | sqlite | json | legacy` 控制

* 失败时自动回退到旧实现

* 迁移工具转换现有 jobs.db 数据

**Phase 3: Team 迁移**

* 修改 `src/team/worker-health.ts` 和 `worker-restart.ts`

* 优先查询适配器，不存在时回退 JSON 文件

* 完全向后兼容，无需迁移数据

**Phase 4: 优化清理**

* 实现缓存层和并发控制

* 移除 Swarm 遗留代码

* 性能基准测试达标

* 文档更新

### 实施方式

**环境变量控制**:
```bash

# 使用新适配器（自动选择 SQLite 或 JSON）

WORKER_BACKEND=auto

# 强制使用 SQLite

WORKER_BACKEND=sqlite

# 强制使用 JSON

WORKER_BACKEND=json

# 回退到旧实现

WORKER_BACKEND=legacy
```

**回退机制**:
```typescript
// Phase 2: MCP 迁移
const adapter = await createWorkerAdapter('auto', cwd);
if (!adapter) {
  // 自动回退到旧实现
  return legacyUpsertJobStatus(cwd, jobStatus);
}

// Phase 3: Team 迁移
const workers = await adapter.list({ workerType: 'team', teamName });
if (workers.length === 0) {
  // 回退到 JSON 文件
  return getWorkersFromJsonFiles(teamName);
}
```

---

## 后果

### 正面影响

✅ **风险可控**: 每阶段独立可验证，问题隔离
✅ **快速回滚**: 环境变量切换，无需代码变更
✅ **零中断**: 迁移期间服务持续运行
✅ **学习机会**: 每阶段完成后可调整策略
✅ **团队信心**: 渐进式交付，持续获得反馈

### 负面影响

⚠️ **迁移周期长**: 4 周完成（vs 一次性 2 周）
⚠️ **维护复杂**: 需要同时维护新旧两套实现
⚠️ **测试成本**: 需要测试回退路径
⚠️ **文档负担**: 需要记录每个阶段的状态

---

## 替代方案

### 方案 A: 一次性迁移

**优点**:

* 迁移周期短（2 周）

* 无需维护两套实现

**缺点**:

* 风险高，问题难以隔离

* 无法快速回滚

* 可能中断服务

**为什么未采用**: 风险无法接受

### 方案 B: 并行运行（新旧同时）

**优点**:

* 可以对比验证

* 问题隔离

**缺点**:

* 维护成本极高

* 数据一致性难以保证

* 迁移周期更长

**为什么未采用**: 维护成本过高

---

## 迁移检查清单

### Phase 1 完成标准

* [ ] `src/workers/types.ts` 定义完整

* [ ] SQLite 和 JSON 适配器实现

* [ ] 单元测试覆盖率 > 90%

* [ ] 工厂函数支持自动回退

* [ ] 文档完整

### Phase 2 完成标准

* [ ] `job-management.ts` 集成适配器

* [ ] 环境变量控制生效

* [ ] 迁移工具验证数据一致性

* [ ] MCP 任务完整流程测试通过

* [ ] 性能基准测试达标

### Phase 3 完成标准

* [ ] `worker-health.ts` 和 `worker-restart.ts` 迁移

* [ ] Team 健康检查功能正常

* [ ] 回退机制验证

* [ ] 所有 Team 测试通过

### Phase 4 完成标准

* [ ] 缓存层实现并测试

* [ ] 性能基准全部达标

* [ ] 文档同步更新

* [ ] 遗留代码清理

---

## 相关决策

* ADR-001: WorkerStateAdapter 抽象层设计

* ADR-002: 缓存层实现策略

---

## 参考资源

* `.omc/p1-5/worker-backend-design.md` §7 - 分阶段实施计划

* `.omc/p1-5/phase1-3-summary.md` - 实施总结

* `docs/standards/contribution-guide.md` - 贡献规范
