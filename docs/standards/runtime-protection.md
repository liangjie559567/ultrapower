# 运行时防护规范

> **ultrapower-version**: 6.0.0
> **优先级**: P0（必须遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-03a（Hook 输入防护）+ T-03b（State/Mode 防护）
> **更新日期**: 2026-03-10

---

## 目录

1. [Hook 输入防护（T-03a）](#1-hook-输入防护t-03a)
   - 1.1 全部 15 类 HookType 严格白名单（v6.0.0 新增）
   - 1.2 bridge-normalize.ts 扩展要求
   - 1.3 未知字段处理规则
   - 1.4 permission-request 强制阻塞要求（v6.0.0 修复）
   - 1.5 安全审计日志（v6.0.0 新增）
1. [State/Mode 防护（T-03b）](#2-statemode-防护t-03b)
   - 2.1 原子写入强制要求（v6.0.0 增强）
   - 2.2 状态文件并发保护级别对照表
   - 2.3 Windows 平台差异说明
   - 2.4 路径安全：mode 参数白名单
   - 2.5 状态文件损坏恢复流程
   - 2.6 敏感数据处理

---

## 1. Hook 输入防护（T-03a）

### 1.1 全部 15 类 HookType 严格白名单（v6.0.0）

**重大变更**: v6.0.0 将白名单验证扩展到所有 15 类 HookType。

来源：`src/hooks/bridge-normalize.ts` (`STRICT_WHITELIST` 常量)

| HookType | 允许字段 | 处理方式 |
| ---------- | ---------- | ------------ |
| `permission-request` | `sessionId`, `toolName`, `toolInput`, `directory`, `permission_mode`, `tool_use_id`, `transcript_path`, `agent_id` | 严格白名单，丢弃未知字段 + 审计日志 |
| `setup-init` | `sessionId`, `directory` | 严格白名单，丢弃未知字段 + 审计日志 |
| `setup-maintenance` | `sessionId`, `directory` | 严格白名单，丢弃未知字段 + 审计日志 |
| `session-end` | `sessionId`, `directory` | 严格白名单，丢弃未知字段 + 审计日志 |
| `tool-call` | `toolName`, `toolInput`, `timestamp` | 严格白名单，丢弃未知字段 + 审计日志 |
| `tool-response` | `toolName`, `toolOutput`, `success`, `error`, `duration` | 严格白名单，丢弃未知字段 + 审计日志 |
| `agent-start` | `agent_type`, `agent_id`, `prompt` | 严格白名单，丢弃未知字段 + 审计日志 |
| `agent-stop` | `agent_id`, `success`, `output`, `duration` | 严格白名单，丢弃未知字段 + 审计日志 |
| `session-start` | `sessionId`, `directory`, `timestamp` | 严格白名单，丢弃未知字段 + 审计日志 |
| `message-sent` | `message`, `role`, `timestamp` | 严格白名单，丢弃未知字段 + 审计日志 |
| `state-change` | `mode`, `from_state`, `to_state`, `timestamp` | 严格白名单，丢弃未知字段 + 审计日志 |
| `error-occurred` | `error`, `context`, `timestamp`, `severity` | 严格白名单，丢弃未知字段 + 审计日志 |
| `file-read` | `file_path`, `success` | 严格白名单，丢弃未知字段 + 审计日志 |
| `file-write` | `file_path`, `success`, `bytes_written` | 严格白名单，丢弃未知字段 + 审计日志 |
| `custom-hook` | `hook_name`, `data` | 严格白名单，丢弃未知字段 + 审计日志 |

### 1.2 bridge-normalize.ts 实现（v6.0.0）

**已实现**：白名单覆盖全部 15 类 HookType。

**实现位置**：`src/hooks/bridge-normalize.ts` 中的 `STRICT_WHITELIST` 常量。

**过滤逻辑**：
```typescript
function filterPassthrough(input: Record<string, unknown>, hookType?: string): Record<string, unknown> {
  const hasWhitelist = hookType != null && STRICT_WHITELIST[hookType] != null;
  // 有白名单定义的 hook：严格过滤
  // 无白名单定义的 hook：透传（向后兼容）
}
```

### 1.3 未知字段处理规则（v6.0.0）

所有定义了白名单的 HookType：
- 未知字段被丢弃
- 记录 `[SECURITY]` 警告日志
- 写入安全审计日志（`.omc/logs/security-audit.jsonl`）

### 1.4 permission-request 强制阻塞（v6.0.0 修复 D-05）

**修复前**：始终返回 `{ continue: true }`，存在权限绕过漏洞。

**修复后**（`src/hooks/processors/permissionRequest.ts`）：
```typescript
export async function processPermissionRequest(input: HookInput): Promise<HookOutput> {
  // 失败优先逻辑：只有明确成功才放行
  if (input.result && (input.result as any).success === true) {
    return { continue: true };
  }

  // 阻塞所有其他情况：null/undefined/false/missing
  return {
    continue: false,
    reason: '权限验证失败，操作已阻止',
    message: '❌ 权限验证失败，操作已阻止。请检查文件权限或联系管理员。'
  };
}
```

**边界情况处理**：
| 输入 | v5.x 行为 | v6.0.0 行为 |
|------|-----------|-------------|
| `result = null` | ✅ 放行（漏洞） | ❌ 阻塞 |
| `result = undefined` | ✅ 放行（漏洞） | ❌ 阻塞 |
| `result.success = false` | ✅ 放行（漏洞） | ❌ 阻塞 |
| `result.success = true` | ✅ 放行 | ✅ 放行 |

### 1.5 安全审计日志（v6.0.0 新增）

**位置**：`.omc/logs/security-audit.jsonl`

**格式**：JSONL（每行一个 JSON 对象）

**记录事件**：
- `field_filtered`：白名单过滤未知字段
- `permission_blocked`：permission-request 阻塞

**敏感字段脱敏**：
自动脱敏包含以下关键词的字段：`token`, `apiKey`, `password`, `secret`, `accessToken`, `refreshToken`, `privateKey`

**日志轮转**：
- 单文件最大：10MB
- 保留历史：7 个文件（`.1` 到 `.7`）
- 自动轮转：写入前检查文件大小

**示例日志**：
```json
{"timestamp":"2026-03-10T04:00:00Z","event":"field_filtered","data":{"hookType":"tool-call","field":"unknown"}}
{"timestamp":"2026-03-10T04:01:00Z","event":"permission_blocked","data":{"result":null}}
```


### 1.3 未知字段处理规则

```typescript
// 当前实现（bridge-normalize.ts）
function filterPassthrough(input, hookType) {
  const isSensitive = hookType != null && SENSITIVE_HOOKS.has(hookType);
  if (isSensitive) {
    // 严格白名单：只允许 KNOWN_FIELDS，丢弃其他字段
    return filterToKnownFields(input, hookType);
  } else {
    // 非敏感：未知字段透传，仅记录 debug 警告
    logDebugWarning(input, hookType);
    return input;
  }
}
```

**规范要求**：

* 敏感 hook 的未知字段**必须**被丢弃，不得透传

* 非敏感 hook 的未知字段当前透传（v1 可接受），v2 需统一丢弃

### 1.4 permission-request 强制阻塞要求

**当前实现（差异点 D-05）**：

```typescript
// src/hooks/persistent-mode/index.ts
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message | | undefined };
  // 注意：始终返回 { continue: true }，包括 permission-request 失败时
}
```

**规范要求（待实现）**：

`permission-request` 是安全边界，失败时**不得**静默降级。规范要求：

```typescript
// 目标实现（v2）
export function createHookOutput(
  result: PersistentModeResult,
  hookType?: HookType
): { continue: boolean; message?: string } {
  if (hookType === 'permission-request' && result.error) {
    // 安全边界：permission-request 失败时必须阻塞
    return { continue: false, message: result.message };
  }
  return { continue: true, message: result.message | | undefined };
}
```

**当前状态**：v1 记录此不一致性，v2 修复。实现者不得假设 `permission-request` 失败会自动阻塞。

---

## 2. State/Mode 防护（T-03b）

### 2.1 原子写入强制要求（v6.0.0 增强）

来源：`src/lib/atomic-write.ts`

**所有状态文件写入必须使用以下函数之一**：

```typescript
// 同步原子写入（推荐用于状态文件）
atomicWriteJsonSync(filePath: string, data: unknown): void

// 带重试的同步原子写入（v6.0.0 新增）
atomicWriteJsonSyncWithRetry(filePath: string, data: unknown, maxRetries?: number): void

// 异步原子写入
atomicWriteJson(filePath: string, data: unknown): Promise<void>

// 原始文件内容写入（非 JSON）
atomicWriteFileSync(filePath: string, content: string): void
```

**v6.0.0 重试机制**：

`atomicWriteJsonSyncWithRetry` 使用指数退避策略处理临时文件冲突：

```
重试次数：最多 3 次（默认）
退避延迟：100ms → 200ms → 400ms
适用场景：高并发写入、Windows 平台文件锁定
```

**禁止直接使用**：

```typescript
// ❌ 禁止
fs.writeFileSync(filePath, JSON.stringify(data));
fs.writeFile(filePath, content, callback);
```

**原子写入完整流程**：

```
1. ensureDirSync(dir)                    — 确保目录存在
2. 独占创建临时文件                        — wx 标志（O_CREAT | O_EXCL | O_WRONLY），权限 0o600
   tmpPath = path.join(dir, `.${base}.tmp.${randomUUID()}`)
1. writeSync(fd, content, 0, 'utf8')     — 写入内容
2. fsyncSync(fd)                         — 落盘
3. closeSync(fd)                         — 关闭文件描述符
4. renameSync(tmpPath, filePath)         — 原子替换
5. 目录级 fsync（best-effort）            — Windows 上可能失败，已捕获异常
```

**文件权限**：所有原子写入文件权限为 `0o600`（仅所有者可读写）。

### 2.2 状态文件并发保护级别对照表（v6.0.0 更新）

来源：`src/hooks/subagent-tracker/index.ts`、`src/lib/atomic-write.ts`

| 状态文件 | 并发保护机制 | 保护级别 | v6.0.0 变更 |
| --------- | ------------ | --------- | ----------- |
| `subagent-tracking.json` | debounce（100ms）+ flushInProgress Set + mergeTrackerStates + 文件锁（PID:timestamp） | **最高**（四层保护） | 无变更 |
| `team-state.json` | atomicWriteJsonSyncWithRetry | 高（原子写入 + 重试） | ✅ 已升级 |
| `ralph-state.json` | atomicWriteJsonSyncWithRetry | 高（原子写入 + 重试） | ✅ 已升级 |
| `autopilot-state.json` | atomicWriteJsonSyncWithRetry | 高（原子写入 + 重试） | ✅ 已升级 |
| 其他 `*-state.json` | atomicWriteJsonSyncWithRetry | 高（原子写入 + 重试） | ✅ 已升级 |
| subagent-tracker 内部即时写入 | atomicWriteJsonSyncWithRetry | 高（原子写入 + 重试） | ✅ 已修复（D-07） |

**subagent-tracking.json 锁机制详情**：

```
锁文件格式：PID:timestamp
stale 检测：锁持有超过 5 秒（LOCK_TIMEOUT_MS = 5000），或持有进程已死亡
等待机制：Atomics.wait（syncSleep）
```

**mergeTrackerStates 合并策略**：

* 计数器（tool_calls、cost 等）：取 `Math.max`

* 同一 agent_id 的状态：newer timestamp wins

**规范目标**：

* v6.0.0：所有状态文件统一使用 `atomicWriteJsonSyncWithRetry`（已完成）

* 未来：考虑为高频写入场景添加 debounce 层（技术债务 TD-4）

### 2.3 Windows 平台差异说明

来源：`src/lib/atomic-write.ts` 代码注释

**关键差异**：

| 平台 | rename 行为 | 目标文件被占用时 |
| ------ | ------------ | ---------------- |
| POSIX（Linux/macOS） | 原子替换（inode 交换） | 成功（原子操作） |
| Windows | `MoveFileExW with MOVEFILE_REPLACE_EXISTING` | **失败**（抛出错误） |

**当前代码处理方式**：

```typescript
// src/lib/atomic-write.ts
try {
  const dirFd = fs.openSync(dir, 'r');
  fs.fsyncSync(dirFd);
  fs.closeSync(dirFd);
} catch {
  // Some platforms don't support directory fsync - that's okay
  // Windows 上目录级 fsync 失败时静默捕获
}
```

**规范要求**：

* 实现者**不得**假设 Windows 和 POSIX 的 rename 行为一致

* 在 Windows 上，如果目标文件被其他进程持有，`renameSync` 会失败

* 所有涉及文件操作的代码必须考虑 Windows 平台行为差异

#### 2.3.1 Windows 命令注入防护（SEC-H02）

**来源**: v5.5.18 P0 修复 (2026-03-05)

**安全边界（不可协商）**: Windows 平台的命令执行必须使用 `execFile` 而非 `execSync` 字符串拼接。

**反模式（已修复）**:
```typescript
// ❌ 不安全：字符串拼接
const args = ['/T', '/PID', String(pid)];
execSync(`taskkill ${args.join(' ')}`);
```

**正确实现**:
```typescript
// ✅ 安全：使用 execFile，参数不经过 shell
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

async function killProcessTreeWindows(pid: number, force: boolean): Promise<boolean> {
  const args = force
    ? ['/F', '/T', '/PID', String(pid)]
    : ['/T', '/PID', String(pid)];

  await execFileAsync('taskkill', args, {
    timeout: 5000,
    windowsHide: true
  });
}
```

**规范要求**:

* 所有 Windows 命令执行必须使用 `execFile` 或 `spawn`

* 禁止使用 `execSync` 或 `exec` 进行字符串拼接

* 参数必须通过数组传递，不经过 shell 解释

* 必须设置 `timeout` 防止挂起

* 必须设置 `windowsHide: true` 避免弹窗

**参考实现**: `src/platform/process-utils.ts:31-47`

### 2.4 路径安全：mode 参数白名单

**安全边界（不可协商）**：`mode` 参数必须通过白名单校验，禁止直接拼接到文件路径。

**合法 mode 值（8 个，来源：`src/hooks/mode-registry/index.ts`）**：

```typescript
// src/lib/validateMode.ts（T-07 实现）
const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm'
] as const;
```

> **注意（差异点 D-03）**：合法 mode 值为 8 个（含 `swarm`），PRD 原描述为 7 个。

**使用方式**：

```typescript
import { validateMode, assertValidMode } from '../lib/validateMode';

// 校验（返回 boolean）
if (!validateMode(mode)) {
  throw new Error(`Invalid mode: ${mode}`);
}

// 断言（抛出异常）
const validMode = assertValidMode(mode);
const stateFilePath = `.omc/state/${validMode}-state.json`;
```

**禁止模式**：

```typescript
// ❌ 禁止：未校验直接拼接
const path = `.omc/state/${mode}-state.json`;  // 路径遍历风险

// ✅ 正确：先校验再拼接
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;
```

### 2.5 状态文件损坏恢复流程

来源：`src/lib/atomic-write.ts`（`safeReadJson` 函数）

**检测到损坏 JSON 时的恢复流程**：

```
1. 尝试读取文件
2. JSON.parse 失败（或 ENOENT）
   → safeReadJson 返回 null（不崩溃）
1. 调用方检测到 null
   → 记录错误到 last-tool-error.json
   → 使用空状态初始化（不崩溃）
1. 下次写入时原子覆盖损坏文件
```

**部分写入检测**：

* 文件大小为 0：视为损坏

* JSON 不完整（parse 失败）：视为损坏

* 两种情况均返回 null，由调用方决定恢复策略

```typescript
// src/lib/atomic-write.ts
export function safeReadJson<T>(filePath: string): T | null {
  // ENOENT 或 JSON.parse 失败时返回 null（不崩溃）
}
```

### 2.6 敏感数据处理

**`agent-replay-*.jsonl` 文件**包含完整 agent 对话历史，可能含有代码、密钥片段。

**规范要求**：

| 要求 | 说明 |
| ------ | ------ |
| 文件权限 | `0o600`（仅所有者可读写） |
| 数据保留期限 | 7 天，超期自动清理 |
| git 提交 | 禁止提交（`.omc/` 已在 `.gitignore` 中） |
| CI 验证 | 必须验证 `.gitignore` 包含 `.omc/` 目录 |

**验证 `.gitignore` 配置**：

```bash

# CI 检查命令

grep -q "\.omc/" .gitignore | | echo "ERROR: .omc/ not in .gitignore"
```

---

## 差异点说明

本规范记录以下与 PRD 的差异点（来源：`audit-report.md`）：

| 差异点 | 描述 | v6.0.0 状态 | 规范要求 |
| -------- | ------ | --------- | --------- |
| D-01 | 敏感 hook 数量 | 4 类（setup 拆分为 setup-init + setup-maintenance） | 以 4 类为准 |
| D-05 | permission-request 失败处理 | ✅ 已修复为强制阻塞 | 失败时返回 `{ continue: false }` |
| D-06 | 非敏感 hook 未知字段 | ✅ 已统一为丢弃策略 | 所有 15 类 HookType 严格白名单 |
| D-07 | subagent-tracker 内部写入 | ✅ 已修复为原子写入 + 重试 | 使用 atomicWriteJsonSyncWithRetry |
| D-03 | 合法 mode 数量 | 8 个（含 swarm） | 以 8 个为准 |
