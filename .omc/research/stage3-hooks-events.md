# Stage 3: Hooks & Event System Analysis

**ultrapower v5.5.14** | 分析日期: 2026-03-05

---

## 1. 系统架构概览

### 1.1 核心组件

```
Claude Code (IDE)
    ↓ stdin (JSON)
templates/hooks/*.mjs (Shell Scripts)
    ↓ --hook=<type>
src/hooks/bridge.ts (TypeScript Router)
    ↓ normalizeHookInput()
src/hooks/bridge-normalize.ts (Security Layer)
    ↓ processHook()
src/hooks/<hook-type>/index.ts (Handler)
    ↓ stdout (JSON)
Claude Code (继续执行)
```

**关键设计**：

* Shell 脚本作为轻量入口点，TypeScript 处理复杂逻辑

* 跨平台支持（Windows/macOS/Linux）通过 Node.js .mjs 脚本

* 安全层在路由前过滤所有输入

---

## 2. HookType 完整枚举（15 类）

### 2.1 分类表

| 阶段 | HookType | 触发时机 | 敏感级别 |
| ------ | ---------- | ---------- | ---------- |
| **UserPromptSubmit** | `keyword-detector` | 用户提交 prompt | 普通 |
| **Stop (P1)** | `ralph` | Stop 事件 + ralph 激活 | 普通 |
| **Stop (P1.5)** | `persistent-mode` | Stop 事件 + ultrawork/autopilot | 普通 |
| **Stop (P2)** | `stop-continuation` | Stop 事件兜底 | 普通 |
| **Session** | `session-start` | 会话启动 | 普通 |
| **Session** | `session-end` | 会话结束 | **敏感** |
| **Tool** | `pre-tool-use` | 工具调用前 | 普通 |
| **Tool** | `post-tool-use` | 工具调用后 | 普通 |
| **Agent** | `autopilot` | autopilot 生命周期 | 普通 |
| **Agent** | `subagent-start` | subagent 启动 | 普通 |
| **Agent** | `subagent-stop` | subagent 停止 | 普通 |
| **System** | `pre-compact` | 上下文压缩前 | 普通 |
| **System** | `setup-init` | 系统初始化 | **敏感** |
| **System** | `setup-maintenance` | 系统维护 | **敏感** |
| **System** | `permission-request` | 权限请求 | **敏感（不可降级）** |

### 2.2 Stop 阶段优先级链

```
Ralph (P1, 最高)
  ↓ 未处理
Autopilot (P1.5)
  ↓ 未处理
Ultrawork/persistent-mode (P2)
  ↓ 未处理
stop-continuation (P3, 兜底)
```

**互斥规则**：高优先级处理后，低优先级跳过同一事件。

---

## 3. 事件路由机制

### 3.1 路由入口（bridge.ts）

```typescript
// 主路由函数
export async function processHook(
  hookType: HookType,
  rawInput: HookInput,
): Promise<HookOutput>

// 路由前置处理
1. 检查终止开关 (DISABLE_OMC, OMC_SKIP_HOOKS)
2. normalizeHookInput() - 安全过滤
3. switch(hookType) - 分发到具体 handler
4. 错误捕获 - 静默降级（permission-request 除外）
```

### 3.2 路由表

| HookType | 路由目标 | 加载方式 |
| ---------- | ---------- | ---------- |
| `keyword-detector` | `processKeywordDetector()` | 热路径（同步） |
| `pre-tool-use` | `processPreToolUse()` | 热路径（同步） |
| `post-tool-use` | `processPostToolUse()` | 热路径（异步） |
| `ralph` | `processRalph()` | 懒加载 |
| `persistent-mode` | `processPersistentMode()` | 懒加载 |
| `session-start` | `processSessionStart()` | 懒加载 |
| `session-end` | `handleSessionEnd()` | 懒加载 |
| `subagent-start` | `processSubagentStart()` | 懒加载 |
| `subagent-stop` | `processSubagentStop()` | 懒加载 |
| `pre-compact` | `processPreCompact()` | 懒加载 |
| `setup-*` | `processSetup()` | 懒加载 |
| `permission-request` | `handlePermissionRequest()` | 懒加载 |

**性能优化**：

* 热路径 hooks（keyword-detector, pre/post-tool-use）在模块顶部导入

* 冷路径 hooks 使用动态 `import()` 懒加载

---

## 4. 输入消毒机制（bridge-normalize.ts）

### 4.1 安全分层

```typescript
// 第 1 层：Zod 结构验证
敏感 hooks → StrictHookInputSchema (strict mode)
普通 hooks → HookInputSchema (passthrough mode)

// 第 2 层：字段映射
snake_case (Claude Code) → camelCase (内部)
tool_name → toolName
session_id → sessionId
cwd → directory

// 第 3 层：白名单过滤
敏感 hooks → STRICT_WHITELIST（丢弃未知字段）
普通 hooks → KNOWN_FIELDS（警告但通过）
```

### 4.2 敏感 Hooks 白名单

```typescript
SENSITIVE_HOOKS = [
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end'
]

STRICT_WHITELIST = {
  'permission-request': [
    'sessionId', 'toolName', 'toolInput', 'directory',
    'permission_mode', 'tool_use_id', 'transcript_path', 'agent_id'
  ],
  'setup-init': ['sessionId', 'directory'],
  'setup-maintenance': ['sessionId', 'directory'],
  'session-end': ['sessionId', 'directory']
}
```

### 4.3 快速路径优化

```typescript
// 检测已规范化输入，跳过 Zod 解析
function isAlreadyCamelCase(obj): boolean {
  return hasMarker(obj) && !hasSnakeCaseKeys(obj);
}

// 敏感 hooks 强制走 Zod 验证（类型检查）
if (isAlreadyCamelCase(rawObj) && !isSensitive) {
  return fastPath(rawObj); // 跳过 Zod
}
```

---

## 5. Hook 配置与生命周期

### 5.1 Claude Code 配置（settings.json）

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "node $HOME/.claude/hooks/keyword-detector.mjs"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "node $HOME/.claude/hooks/persistent-mode.mjs"
      }]
    }],
    "PreToolUse": [{ /* ... */ }],
    "PostToolUse": [{ /* ... */ }],
    "SessionStart": [{ /* ... */ }]
  }
}
```

### 5.2 Hook 脚本模板（templates/hooks/）

```
templates/hooks/
├── keyword-detector.mjs      # UserPromptSubmit
├── persistent-mode.mjs        # Stop (统一入口)
├── session-start.mjs          # SessionStart
├── pre-tool-use.mjs           # PreToolUse
├── post-tool-use.mjs          # PostToolUse
├── post-tool-use-failure.mjs  # PostToolUseFailure
└── lib/
    ├── stdin.mjs              # 共享：stdin 读取
    └── atomic-write.mjs       # 共享：原子写入
```

### 5.3 生命周期流程

```
1. Claude Code 触发事件
   ↓
1. 执行 shell 命令（node *.mjs）
   ↓
1. Shell 脚本读取 stdin (JSON)
   ↓
1. 调用 bridge.ts --hook=<type>
   ↓
1. normalizeHookInput() 安全过滤
   ↓
1. processHook() 路由到 handler
   ↓
1. Handler 返回 HookOutput
   ↓
1. Shell 脚本写入 stdout (JSON)
   ↓
1. Claude Code 读取输出并继续
```

---

## 6. 关键 Hook 行为

### 6.1 keyword-detector

**触发**：UserPromptSubmit
**功能**：检测魔法关键词（ralph, ultrawork, autopilot 等）
**行为**：

* 移除代码块防止误触发

* 支持单个 prompt 多关键词

* 激活持久化状态（ralph/ultrawork）

* 注入模式激活消息

### 6.2 persistent-mode (Stop 统一入口)

**触发**：Stop 事件
**功能**：处理所有 Stop 阶段 hooks（ralph/autopilot/ultrawork）
**优先级**：
```typescript
if (isRalphActive()) return handleRalph();      // P1
if (isAutopilotActive()) return handleAutopilot(); // P1.5
if (isUltraworkActive()) return handleUltrawork(); // P2
return handleStopContinuation();                // P3
```

### 6.3 pre-tool-use

**触发**：工具调用前
**功能**：

* 委派强制执行（orchestrator）

* 后台任务限制（防止 forkbomb）

* pkill -f 自杀警告

* AskUserQuestion 通知

* 文件所有权追踪

* Agent dashboard 注入

### 6.4 post-tool-use

**触发**：工具调用后
**功能**：

* Orchestrator 后处理（remember 标签）

* Ralph 模式激活（via Skill tool）

* Agent dashboard 更新

* 使用追踪（非阻塞）

### 6.5 session-start

**触发**：会话启动
**功能**：

* 恢复持久化状态（ralph/ultrawork/autopilot/team）

* 加载 AGENTS.md（deepinit 输出）

* 检查未完成 todos

* 启动通知监听器

* 静默自动更新检查

### 6.6 session-end

**触发**：会话结束
**功能**：

* 清理会话状态

* 发送会话结束通知

* 停止 reply listener

* 审计日志记录

---

## 7. 安全机制

### 7.1 终止开关

```bash

# 禁用所有 hooks

DISABLE_OMC=1 claude

# 跳过特定 hooks

OMC_SKIP_HOOKS=ralph,autopilot claude
```

### 7.2 失败降级策略

| Hook 类型 | 失败行为 | 规范要求 |
| ----------- | --------- | ---------- |
| 普通 hooks (11 类) | 静默降级 `{ continue: true }` | 允许 |
| 敏感 hooks (3 类) | 静默降级 `{ continue: true }` | 允许（v1） |
| `permission-request` | **当前**：静默降级 | **规范**：必须阻塞 `{ continue: false }` |

**差异点 D-05**：permission-request 当前实现与规范不符，v2 需修复。

### 7.3 输入验证

```typescript
// 必需字段验证
function validateHookInput<T>(
  input: unknown,
  requiredFields: string[],
  hookType?: string
): input is T

// 敏感 hooks 必需字段
REQUIRED_KEYS = {
  'session-end': ['sessionId', 'directory'],
  'permission-request': ['toolName']
}
```

---

## 8. 性能优化

### 8.1 懒加载策略

```typescript
// 热路径（顶部导入）
import { removeCodeBlocks, getAllKeywords } from "./keyword-detector/index.js";
import { processOrchestratorPreTool } from "./omc-orchestrator/index.js";

// 冷路径（动态导入）
case "ralph": {
  const { readRalphState } = await import("./ralph/index.js");
  // ...
}
```

### 8.2 缓存机制

```typescript
// OMC_SKIP_HOOKS 缓存（环境变量不变）
let _cachedSkipHooks: string[] | null = null;
function getSkipHooks(): string[] {
  if (_cachedSkipHooks === null) {
    _cachedSkipHooks = process.env.OMC_SKIP_HOOKS?.split(",") ?? [];
  }
  return _cachedSkipHooks;
}
```

### 8.3 快速路径检测

```typescript
// 跳过已规范化输入的 Zod 解析
if (isAlreadyCamelCase(rawObj) && !isSensitive) {
  return fastPath(rawObj); // 节省 ~30% 解析时间
}
```

---

## 9. 已知问题与差异点

### 9.1 与 PRD 的差异

| 差异点 | 描述 | 当前状态 |
| -------- | ------ | --------- |
| D-01 | 敏感 hooks 数量 | 4 类（setup 拆分为 init + maintenance） |
| D-02 | Stop 优先级链 | Ralph > Autopilot > Ultrawork（Todo-Continuation 已移除） |
| D-04 | 互斥模式范围 | 4 个（autopilot/ultrapilot/swarm/pipeline） |
| D-05 | permission-request 失败处理 | 静默降级（应强制阻塞） |

### 9.2 待实现功能

* Hook 超时处理（PreToolUse: 5s, PostToolUse: 5s）

* permission-request 失败强制阻塞（v2）

* Hook 执行时间监控

---

## 10. 关键文件清单

### 10.1 核心路由

* `src/hooks/bridge.ts` (1227 行) - 主路由器

* `src/hooks/bridge-types.ts` (66 行) - 类型定义

* `src/hooks/bridge-normalize.ts` (347 行) - 输入消毒

### 10.2 Hook Handlers（36 个模块）

```
src/hooks/
├── keyword-detector/      # UserPromptSubmit
├── persistent-mode/       # Stop 统一入口
├── ralph/                 # Ralph 循环
├── ultrawork/             # Ultrawork 模式
├── autopilot/             # Autopilot 模式
├── session-start/         # 会话启动
├── session-end/           # 会话结束
├── subagent-tracker/      # Agent 追踪
├── pre-compact/           # 上下文压缩
├── setup/                 # 系统初始化
├── permission-handler/    # 权限请求
├── omc-orchestrator/      # 委派强制
└── [31 other modules]     # 其他功能模块
```

### 10.3 配置与模板

* `src/installer/hooks.ts` (430 行) - Hook 配置生成

* `templates/hooks/*.mjs` (7 个脚本) - Shell 入口点

---

## 总结

ultrapower Hooks 系统是一个**分层、安全、高性能**的事件驱动架构：

1. **15 类 HookType** 覆盖完整生命周期（UserPromptSubmit → Stop → Tool → Agent → System）
2. **3 层安全机制**（Zod 验证 + 字段映射 + 白名单过滤）
3. **优先级路由**（Stop 阶段 4 级优先级链）
4. **性能优化**（懒加载 + 缓存 + 快速路径）
5. **跨平台支持**（Node.js .mjs 脚本）

核心设计原则：**不阻塞用户工作流**（静默降级）+ **安全边界强制**（敏感 hooks 白名单）。
