# P0-3.1 测试覆盖率基线报告

**生成时间**: 2026-03-05
**测试框架**: Vitest + v8 coverage
**目标覆盖率**: 85%

---

## 1. 总体覆盖率

| 指标 | 当前值 | 目标值 | 差距 |
| ------ | -------- | -------- | ------ |
| **Lines** | 54.55% | 85% | -30.45% |
| **Statements** | 54.15% | 85% | -30.85% |
| **Functions** | 55.50% | 85% | -29.50% |
| **Branches** | 48.50% | 85% | -36.50% |

**状态**: 🔴 所有指标均未达标

---

## 2. 核心模块覆盖率

### 2.1 Team Pipeline (26 files)

| 指标 | 覆盖率 | 状态 |
| ------ | -------- | ------ |
| Lines | 83.77% | 🟡 接近目标 |
| Statements | 84.10% | 🟡 接近目标 |
| Functions | 90.39% | ✅ 达标 |
| Branches | 72.63% | 🔴 未达标 |

**分析**: Team 模块整体覆盖率较好，但分支覆盖率需要提升 12.37%。

### 2.2 Hooks System (148 files)

| 指标 | 覆盖率 | 状态 |
| ------ | -------- | ------ |
| Lines | 68.11% | 🔴 未达标 |
| Statements | 66.72% | 🔴 未达标 |
| Functions | 65.47% | 🔴 未达标 |
| Branches | 58.49% | 🔴 未达标 |

**分析**: Hooks 系统覆盖率偏低，需要增加 16.89% 行覆盖率。

### 2.3 MCP Integration (40 files)

| 指标 | 覆盖率 | 状态 |
| ------ | -------- | ------ |
| Lines | 58.86% | 🔴 未达标 |
| Statements | 58.77% | 🔴 未达标 |
| Functions | 55.64% | 🔴 未达标 |
| Branches | 54.98% | 🔴 未达标 |

**分析**: MCP 模块覆盖率最低，需要增加 26.14% 行覆盖率。

### 2.4 State Management

**状态**: ⚠️ 未检测到独立的 state 模块文件（可能集成在其他模块中）

---

## 3. 覆盖率 <80% 的模块清单

**总计**: 199 个文件覆盖率低于 80%

### 3.1 零覆盖率文件 (P0 优先级)

以下文件完全未被测试覆盖：

**Agents 模块**:

* `src/agents/delegation-validator.ts`

* `src/agents/preamble.ts`

* `src/agents/prompt-generator.ts`

* `src/agents/prompt-sections/index.ts`

**Analytics 模块**:

* `src/analytics/analytics-summary.ts`

* `src/analytics/backfill-dedup.ts`

* `src/analytics/backfill-engine.ts`

* `src/analytics/export.ts`

* `src/analytics/metrics-collector.ts`

* `src/analytics/query-engine.ts`

**CLI 模块**:

* `src/cli/analytics.ts`

* `src/cli/index.ts`

* `src/cli/interop.ts`

* `src/cli/launch.ts`

* `src/cli/tmux-utils.ts`

* `src/cli/commands/agents.ts`

* `src/cli/commands/backfill.ts`

* `src/cli/commands/cost.ts`

* `src/cli/commands/export.ts`

* `src/cli/commands/plugin.ts`

* `src/cli/commands/sessions.ts`

* `src/cli/commands/stats.ts`

* `src/cli/commands/teleport.ts`

* `src/cli/commands/wait.ts`

* `src/cli/utils/tokscale-launcher.ts`

**其他核心模块**:

* `src/commands/index.ts`

* `src/compatibility/index.ts`

* `src/features/background-agent/concurrency.ts`

* `src/features/boulder-state/storage.ts`

---

## 4. 差距分析

### 4.1 与目标的差距

要达到 85% 覆盖率目标，需要：

* **Lines**: 从 54.55% 提升到 85%，需增加 **30.45%**

* **Statements**: 从 54.15% 提升到 85%，需增加 **30.85%**

* **Functions**: 从 55.50% 提升到 85%，需增加 **29.50%**

* **Branches**: 从 48.50% 提升到 85%，需增加 **36.50%**

### 4.2 覆盖率分布

* **达标模块** (≥85%): 0 个

* **接近达标** (80-84%): Team 模块（部分指标）

* **中等覆盖** (60-79%): Hooks 模块

* **低覆盖** (<60%): MCP 模块、CLI 模块、Analytics 模块

* **零覆盖**: 30+ 文件

---

## 5. 优先级排序

### P0 - 关键路径（必须覆盖）

1. **Team Pipeline 阶段转换** (src/team/)
   - 当前: 83.77% lines, 72.63% branches
   - 目标: 提升分支覆盖率至 85%+
   - 风险: 高 - 核心工作流

1. **Hook 执行引擎** (src/hooks/)
   - 当前: 68.11% lines
   - 目标: 提升至 85%+
   - 风险: 高 - 影响所有工作流

1. **MCP Worker 生命周期** (src/mcp/)
   - 当前: 58.86% lines
   - 目标: 提升至 85%+
   - 风险: 高 - 外部集成

### P1 - 重要功能（应该覆盖）

1. **Agent 委派逻辑** (src/agents/)
   - 当前: 0% (delegation-validator, prompt-generator)
   - 目标: 新增测试至 80%+
   - 风险: 中 - 影响 agent 路由

1. **状态机转换** (src/state/)
   - 当前: 未独立测试
   - 目标: 新增测试至 85%+
   - 风险: 中 - 影响持久化

### P2 - 辅助功能（可选覆盖）

1. **Analytics 引擎** (src/analytics/)
   - 当前: 0%
   - 目标: 60%+
   - 风险: 低 - 非关键路径

1. **CLI 命令** (src/cli/)
   - 当前: 0%
   - 目标: 60%+
   - 风险: 低 - 用户交互层

---

## 6. 建议行动

### 短期目标 (P0-3.2 ~ P0-3.7)

1. **识别未覆盖的关键路径** → Task #1
2. **Team Pipeline 阶段转换测试** → Task #2
3. **Hook 优先级链执行测试** → Task #4
4. **状态机边界条件测试** → Task #7
5. **MCP worker 生命周期测试** → Task #6

### 中期目标 (P0-3.8 ~ P0-3.9)

1. **集成测试：端到端工作流** → Task #9
2. **覆盖率验证（目标 85%+）** → Task #8

### 测试策略

* **Team 模块**: 补充边界条件和错误处理分支

* **Hooks 模块**: 增加优先级链、并发执行、失败恢复测试

* **MCP 模块**: 增加 worker 生命周期、超时、错误处理测试

* **零覆盖文件**: 优先测试核心逻辑路径，跳过 CLI 交互层

---

## 7. 风险评估

| 模块 | 当前覆盖率 | 风险等级 | 影响范围 |
| ------ | ----------- | --------- | --------- |
| Team Pipeline | 83.77% | 🟡 中 | 核心工作流 |
| Hooks System | 68.11% | 🔴 高 | 所有工作流 |
| MCP Integration | 58.86% | 🔴 高 | 外部集成 |
| Agent Delegation | 0% | 🔴 高 | Agent 路由 |
| State Management | 未知 | 🔴 高 | 持久化 |
| Analytics | 0% | 🟢 低 | 非关键 |
| CLI Commands | 0% | 🟢 低 | 用户交互 |

---

## 8. 下一步

✅ **已完成**: 覆盖率基线报告生成
⏭️ **下一步**: 执行 Task #1 - 识别未覆盖的关键路径

**预计工作量**: 完成 P0-3 所有任务需要 **40-60 小时**
