# Agent Routing Rules

## 专业 Agent 选择标准

**来源**: v5.5.18 P0 修复会话反思 (2026-03-05)

### 规则 1: 问题域明确 → 使用专业 agent

* **安全问题** → `security-fixer` (sonnet)

* **内存泄漏** → `memory-leak-fixer` (sonnet)

* **API 类型** → `api-fixer` (sonnet)

* **Hook 接口** → `hook-interface-fixer` (sonnet)

* **权限检查** → `permission-fixer` (sonnet)

* **JSON 安全** → `json-safety-fixer` (sonnet)

### 规则 2: 问题域模糊 → 使用通用 agent

* 使用 `executor` (sonnet) + 动态工具选择

* 让 agent 自行探索和决策

### 规则 3: 跨域问题 → 先分解

* 使用 `architect` (opus) 先分解为子问题

* 再分配给专业 agents

### 证据

* **v5.5.18 P0 修复**: 所有任务问题域明确

* **首次成功率**: 100%（6/6 agents）

* **零返工**: 无需自动修复循环

### 模型路由策略

* **Haiku**: 快速扫描、简单查找（如 `explore`）

* **Sonnet**: 标准实现、中等复杂度（大部分 agents）

* **Opus**: 复杂推理、架构设计（`architect`, `analyst`, `critic`）

### 预期收益

* 成本降低约 40%（相比全用 Opus）

* 质量无损（专业 agent 针对性强）

---

## 并行任务依赖管理

### 模式: 显式依赖声明

使用 `TaskUpdate addBlockedBy` 显式声明依赖，而非隐式等待。

**示例**:
```typescript
// API-02 依赖 API-01
TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"]
})
```

### 反模式: Agent 内部轮询

❌ 在 agent 内部轮询其他任务状态（导致死锁）

### 阶段性解锁

完成前置任务后批量解锁后续任务，避免资源浪费。

---

## Agent 预分配机制

**改进方向**: 在 `analyst` 阶段就根据问题类型预分配 agent 池

**当前流程**:
```
analyst → planner → team-plan (分配 agents)
```

**优化流程**:
```
analyst (预分配 agent 池) → planner (确认分配) → team-exec
```

**预期收益**: 减少 10-15% 规划时间

**实施状态**: 待开发

---

**最后更新**: 2026-03-05
**置信度**: 高（基于实际会话数据）
