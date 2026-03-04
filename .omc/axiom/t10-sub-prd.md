# T10: Agent 超时保护机制 - Sub-PRD

**优先级:** P1
**预计工时:** 1 周
**依赖:** T8, T9
**负责角色:** Backend Engineer

---

## 目标

为所有 Agent 类型实现超时保护机制，防止长时间运行的 Agent 阻塞系统，提升系统稳定性和用户体验。

---

## 技术方案

### 1. 超时配置系统

**文件:** `src/agents/timeout-config.ts`

```typescript
export interface TimeoutConfig {
  default: number;
  byAgentType: Record<string, number>;
  byModel: Record<string, number>;
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  default: 300000, // 5 分钟
  byAgentType: {
    'explore': 60000,        // 1 分钟（快速搜索）
    'executor': 600000,      // 10 分钟（代码实现）
    'deep-executor': 1800000, // 30 分钟（复杂任务）
    'architect': 900000,     // 15 分钟（架构设计）
    'planner': 600000,       // 10 分钟（规划）
    'verifier': 300000,      // 5 分钟（验证）
  },
  byModel: {
    'haiku': 120000,   // 2 分钟
    'sonnet': 600000,  // 10 分钟
    'opus': 1800000,   // 30 分钟
  }
};
```

### 2. 超时管理器

**文件:** `src/agents/timeout-manager.ts`

核心功能：
- 启动超时计时器
- 超时后自动中断 Agent
- 支持降级策略（重试/降级模型）
- 记录超时事件

### 3. Agent 调用包装器

**文件:** `src/agents/agent-wrapper.ts`

在现有 Agent 调用点注入超时保护：
- 包装 `Agent` 工具调用
- 自动应用超时配置
- 处理超时异常

---

## 实施步骤

### Step 1: 创建超时配置模块
- 创建 `src/agents/timeout-config.ts`
- 定义默认超时时间
- 支持从环境变量覆盖

### Step 2: 实现超时管理器
- 创建 `src/agents/timeout-manager.ts`
- 实现 `TimeoutManager` 类
- 集成到 Agent 调用流程

### Step 3: 添加降级策略
- 超时后自动重试（最多 1 次）
- 支持降级到更快的模型
- 记录降级事件到日志

### Step 4: 单元测试
- 测试超时触发
- 测试降级策略
- 测试配置加载
- 目标覆盖率 > 90%

### Step 5: 集成测试
- 模拟长时间运行的 Agent
- 验证超时保护生效
- 验证降级策略正确执行

---

## 验收标准

- [ ] 每个 Agent 类型配置独立超时时间
- [ ] 超时后自动降级或重试
- [ ] 支持全局超时配置（环境变量）
- [ ] 性能影响 < 5ms per agent call
- [ ] 单元测试覆盖率 > 90%
- [ ] CI Gate 通过（tsc + build + test）

---

## 影响范围

**新建文件:**
- `src/agents/timeout-config.ts`
- `src/agents/timeout-manager.ts`
- `src/agents/agent-wrapper.ts`
- `src/agents/__tests__/timeout-manager.test.ts`
- `src/agents/__tests__/agent-wrapper.test.ts`

**修改文件:**
- `src/agents/index.ts`（导出新模块）
- `src/hooks/*/index.ts`（集成超时保护）

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 超时时间设置不合理 | 基于历史数据调优 + 支持动态配置 |
| 降级策略影响质量 | 仅在超时时降级，记录所有降级事件 |
| 性能开销过大 | 使用轻量级计时器，避免轮询 |

---

**生成时间:** 2026-03-04
**状态:** 待执行
