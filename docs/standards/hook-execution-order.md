# Hook 执行顺序规范

> **ultrapower-version**: 5.0.21
> **优先级**: P0（必须遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-04a（HookType 枚举与路由）+ T-04b（执行顺序与优先级）

---

## 目录

1. [HookType 完整枚举（T-04a）](#1-hooktype-完整枚举t-04a)
   - 1.1 全部 15 类 HookType 分类表
   - 1.2 每类 HookType 路由规则
   - 1.3 HookType 完整性验证方法
2. [执行顺序与优先级（T-04b）](#2-执行顺序与优先级t-04b)
   - 2.1 Stop 阶段优先级链
   - 2.2 互斥规则
   - 2.3 Hook 失败降级策略
   - 2.4 Hook 超时处理
   - 2.5 终止开关

---

## 1. HookType 完整枚举（T-04a）

### 1.1 全部 15 类 HookType 分类表

来源：`src/hooks/bridge.ts`

```typescript
type HookType =
  | "keyword-detector"    // UserPromptSubmit 阶段
  | "stop-continuation"   // Stop 阶段（最低优先级）
  | "ralph"               // Stop 阶段（最高优先级）
  | "persistent-mode"     // Stop 阶段（含 ultrawork，次优先级）
  | "session-start"       // Session 生命周期
  | "session-end"         // Session 生命周期（敏感）
  | "pre-tool-use"        // 工具调用生命周期
  | "post-tool-use"       // 工具调用生命周期
  | "autopilot"           // Agent 生命周期
  | "subagent-start"      // Agent 生命周期
  | "subagent-stop"       // Agent 生命周期
  | "pre-compact"         // 系统维护
  | "setup-init"          // 系统维护（敏感）
  | "setup-maintenance"   // 系统维护（敏感）
  | "permission-request"; // 系统维护（敏感，不可静默降级）
```

**六阶段完整分类表：**

| 阶段 | HookType | 触发时机 | 必需字段 | 敏感级别 |
|------|----------|----------|----------|----------|
| UserPromptSubmit | `keyword-detector` | 用户提交 prompt 时 | `[]`（默认） | 普通 |
| Stop（P1，最高） | `ralph` | Stop 事件，ralph 模式激活时 | `[]`（默认） | 普通 |
| Stop（P1.5） | `persistent-mode` | Stop 事件，ultrawork/autopilot 模式激活时 | `[]`（默认） | 普通 |
| Stop（P2，最低） | `stop-continuation` | Stop 事件，无高优先级 hook 处理时 | `[]`（默认） | 普通 |
| Session 生命周期 | `session-start` | 会话启动时 | `[]`（默认） | 普通 |
| Session 生命周期 | `session-end` | 会话结束时 | `["sessionId", "directory"]` | **敏感** |
| 工具调用生命周期 | `pre-tool-use` | 工具调用前 | `[]`（默认） | 普通 |
| 工具调用生命周期 | `post-tool-use` | 工具调用后 | `[]`（默认） | 普通 |
| Agent 生命周期 | `autopilot` | autopilot agent 启动/停止时 | `[]`（默认） | 普通 |
| Agent 生命周期 | `subagent-start` | subagent 启动时 | `["sessionId", "directory"]` | 普通 |
| Agent 生命周期 | `subagent-stop` | subagent 停止时 | `["sessionId", "directory"]` | 普通 |
| 系统维护 | `pre-compact` | 上下文压缩前 | `["sessionId", "directory"]` | 普通 |
| 系统维护 | `setup-init` | 系统初始化时 | `["sessionId", "directory"]` | **敏感** |
| 系统维护 | `setup-maintenance` | 系统维护时 | `["sessionId", "directory"]` | **敏感** |
| 系统维护 | `permission-request` | 工具权限请求时 | `["sessionId", "directory", "toolName"]` | **敏感，不可静默降级** |

> **注意（差异点 D-01）**：`setup` 已拆分为 `setup-init` 和 `setup-maintenance` 两个独立类型，敏感 hook 共 4 类（非 PRD 原描述的 3 类）。

### 1.2 每类 HookType 路由规则

**路由入口**：`src/hooks/bridge.ts`（`routeHook` 函数）

| HookType | 路由目标 | 路由条件 |
|----------|----------|----------|
| `keyword-detector` | `src/hooks/keyword-detector/` | 所有 UserPromptSubmit 事件 |
| `ralph` | `src/hooks/ralph/` | Stop 事件 + ralph 模式激活 |
| `persistent-mode` | `src/hooks/persistent-mode/` | Stop 事件 + ultrawork/autopilot 模式激活 |
| `stop-continuation` | `src/hooks/stop-continuation/` | Stop 事件 + 无高优先级 hook 处理 |
| `session-start` | `src/hooks/session-start/` | 会话启动事件 |
| `session-end` | `src/hooks/session-end/` | 会话结束事件 |
| `pre-tool-use` | `src/hooks/guards/pre-tool.ts` | 所有工具调用前 |
| `post-tool-use` | `src/hooks/guards/post-tool.ts` | 所有工具调用后 |
| `autopilot` | `src/hooks/autopilot/` | autopilot agent 生命周期事件 |
| `subagent-start` | `src/hooks/subagent-tracker/` | subagent 启动事件 |
| `subagent-stop` | `src/hooks/subagent-tracker/` | subagent 停止事件 |
| `pre-compact` | `src/hooks/pre-compact/` | 上下文压缩前事件 |
| `setup-init` | `src/hooks/setup/` | 系统初始化事件 |
| `setup-maintenance` | `src/hooks/setup/` | 系统维护事件 |
| `permission-request` | `src/hooks/persistent-mode/` | 工具权限请求事件 |

**路由前置处理**：所有 hook 输入在路由前必须经过 `bridge-normalize.ts` 白名单过滤（见 `runtime-protection.md` 第 1 节）。

### 1.3 HookType 完整性验证方法

**目的**：确保规范文档中的 HookType 列表与 `bridge.ts` 实现保持同步。

**自动化验证脚本**（CI 门禁，T-14 实现）：

```bash
#!/bin/bash
# 从 bridge.ts 提取 HookType 定义
BRIDGE_TYPES=$(grep -oP '"[a-z-]+"(?=;?\s*//.*HookType|(?<=\|)\s*"[a-z-]+")' \
  src/hooks/bridge.ts | sort | uniq)

# 从规范文档提取 HookType 列表
DOC_TYPES=$(grep -oP '`[a-z-]+`' \
  docs/standards/hook-execution-order.md | sort | uniq)

# 对比差异
diff <(echo "$BRIDGE_TYPES") <(echo "$DOC_TYPES") || \
  echo "ERROR: HookType 规范与实现不一致"
```

**手动验证步骤**：

1. 打开 `src/hooks/bridge.ts`，找到 `HookType` 类型定义
2. 统计 `|` 分隔的类型数量，应为 **15 个**
3. 与本文档 1.1 节表格逐一对比
4. 如有差异，以 `bridge.ts` 为准，更新本文档

**当前验收状态**：规范覆盖 15 个 HookType，与 `bridge.ts` 定义一一对应 ✅

---

## 2. 执行顺序与优先级（T-04b）

### 2.1 Stop 阶段优先级链

来源：`src/hooks/persistent-mode/index.ts`

**实际优先级（与 PRD 注释存在差异，见差异点 D-02）：**

```
Ralph（P1，最高优先级）
  ↓ 未处理时
Autopilot（P1.5，次优先级）
  ↓ 未处理时
Ultrawork/persistent-mode（P2，最低优先级）
  ↓ 未处理时
stop-continuation（P3，兜底）
```

> **注意（差异点 D-02）**：实际优先级链为 `Ralph > Autopilot > Ultrawork`，PRD 原描述为 `Ralph > Ultrawork > Todo-Continuation`。`Todo-Continuation` 已移除，`Autopilot` 插入 P1.5 位置。

**优先级判断逻辑**（来自 `persistent-mode/index.ts`）：

```typescript
// Stop 阶段路由（伪代码）
if (isRalphActive()) {
  return handleRalph();        // P1：最高优先级
}
if (isAutopilotActive()) {
  return handleAutopilot();    // P1.5：次优先级
}
if (isUltraworkActive()) {
  return handleUltrawork();    // P2：最低优先级
}
return handleStopContinuation(); // P3：兜底
```

**Ralph 自动扩展行为**：

```typescript
// src/hooks/ralph/index.ts
const MAX_TODO_CONTINUATION_ATTEMPTS = 5;
// 当 ralph 达到 max_iterations 限制时，自动追加 +10 次迭代
// 最多追加 MAX_TODO_CONTINUATION_ATTEMPTS 次
```

### 2.2 互斥规则

**Stop 阶段互斥规则**：

高优先级 hook 处理后，低优先级 hook **不得**重复处理同一 Stop 事件。

```
✅ 正确：Ralph 处理 → Autopilot 跳过 → Ultrawork 跳过
❌ 错误：Ralph 处理 → Autopilot 也处理（重复处理同一 Stop 事件）
```

**执行模式互斥规则**（来源：`src/hooks/mode-registry/index.ts`）：

```typescript
// 互斥模式（见差异点 D-04）
const EXCLUSIVE_MODES = ['autopilot', 'ultrapilot', 'swarm', 'pipeline'];
```

> **注意（差异点 D-04）**：互斥模式为 4 个（`autopilot`、`ultrapilot`、`swarm`、`pipeline`），PRD 原描述仅提及 `autopilot` 与 `ultrapilot` 互斥。

**互斥检测规则**：

- `EXCLUSIVE_MODES` 中的任意两个模式不得同时激活
- 检测到互斥冲突时，后激活的模式被拒绝，返回错误
- `ralph` 和 `ultrawork` 不在互斥列表中，可与其他模式组合使用

### 2.3 Hook 失败降级策略

来源：`src/hooks/bridge.ts`

**通用策略（静默降级）**：

```typescript
// src/hooks/bridge.ts
try {
  // hook 执行逻辑
} catch (error) {
  return { continue: true };  // 静默降级，不阻塞用户工作流
}
```

**设计理由**：hook 不应阻塞用户工作流，失败时静默降级是设计选择而非疏漏。

**例外：permission-request（不可静默降级）**

`permission-request` 是安全边界，失败时**不得**静默降级。

| Hook 类型 | 失败时行为 | 规范要求 |
|-----------|-----------|----------|
| 普通 hook（11 类） | 静默降级，返回 `{ continue: true }` | 允许（设计选择） |
| 敏感 hook（session-end、setup-init、setup-maintenance） | 静默降级，返回 `{ continue: true }` | 允许（v1） |
| `permission-request` | **当前**：静默降级（差异点 D-05） | **规范要求**：失败时必须阻塞，返回 `{ continue: false }` |

**当前实现（差异点 D-05）**：

```typescript
// src/hooks/persistent-mode/index.ts（当前实现）
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message || undefined };
  // 注意：始终返回 { continue: true }，包括 permission-request 失败时
}
```

**规范要求（v2 目标）**：

```typescript
// 目标实现（v2）
export function createHookOutput(
  result: PersistentModeResult,
  hookType?: HookType
): { continue: boolean; message?: string } {
  if (hookType === 'permission-request' && result.error) {
    return { continue: false, message: result.message };
  }
  return { continue: true, message: result.message || undefined };
}
```

**实现者注意**：在 v2 修复前，不得假设 `permission-request` 失败会自动阻塞执行。

### 2.4 Hook 超时处理

> **当前状态**：代码中未见明确超时限制实现。以下为规范要求（待实现）。

**PreToolUse hook 超时规则**：

| 参数 | 值 | 说明 |
|------|-----|------|
| 默认超时 | 5 秒 | PreToolUse hook 最长执行时间 |
| 超时行为 | 继续执行工具调用 | 不阻塞，Claude 继续执行工具 |
| 超时记录 | 写入 `last-tool-error.json` | 记录超时事件供后续分析 |

**PostToolUse hook 超时规则**：

| 参数 | 值 | 说明 |
|------|-----|------|
| 默认超时 | 5 秒 | PostToolUse hook 最长执行时间 |
| 超时行为 | 状态写入标记为"待重试" | 不回滚已执行的工具调用 |
| 回滚策略 | 禁止回滚 | 工具调用已完成，不可撤销 |

**超时处理流程**：

```
PreToolUse 超时：
  hook 执行 → 超时（5s）→ 记录到 last-tool-error.json → 继续执行工具调用

PostToolUse 超时：
  工具调用完成 → hook 执行 → 超时（5s）→ 状态标记"待重试" → 不回滚工具调用
```

### 2.5 终止开关

来源：`src/hooks/bridge.ts`

| 环境变量 | 作用 | 示例 |
|----------|------|------|
| `DISABLE_OMC` | 禁用所有 hooks | `DISABLE_OMC=1 claude` |
| `OMC_SKIP_HOOKS` | 按逗号分隔名称跳过特定 hooks | `OMC_SKIP_HOOKS=ralph,autopilot claude` |

**使用场景**：

```bash
# 完全禁用所有 hooks（调试用）
DISABLE_OMC=1 claude

# 跳过特定 hooks（测试用）
OMC_SKIP_HOOKS=permission-request,setup-init claude

# 跳过 Stop 阶段所有 hooks
OMC_SKIP_HOOKS=ralph,persistent-mode,stop-continuation claude
```

**注意**：`DISABLE_OMC` 和 `OMC_SKIP_HOOKS` 仅用于调试和测试，生产环境不得使用。

---

## 差异点说明

本规范记录以下与 PRD 的差异点（来源：`audit-report.md`）：

| 差异点 | 描述 | 当前状态 | 规范要求 |
|--------|------|---------|---------|
| D-01 | 敏感 hook 数量 | 4 类（setup 拆分为 setup-init + setup-maintenance） | 以 4 类为准 |
| D-02 | Stop 阶段优先级链 | Ralph > Autopilot > Ultrawork（Todo-Continuation 已移除） | 以实际代码为准 |
| D-04 | 互斥模式范围 | 4 个互斥模式（含 swarm、pipeline） | 以 4 个为准 |
| D-05 | permission-request 失败处理 | 静默降级（返回 `{ continue: true }`） | v2 修复为强制阻塞 |
