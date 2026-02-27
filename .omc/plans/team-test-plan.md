# src/team/ 测试规划 v1.0

> ultrapower v5.2.3 | 2026-02-27

## 1. 现状评估

### 已有覆盖
- 25 个测试文件，363 个测试用例，全部通过
- 每个源文件都有对应的 `__tests__/*.test.ts`
- 测试风格统一：vitest + 临时目录隔离 + vi.mock 外部依赖

### 关键覆盖缺口

| 优先级 | 文件 | 行数 | 现有测试 | 缺口描述 |
|--------|------|------|----------|----------|
| **P0** | `mcp-team-bridge.ts` | 785 | 仅 `sanitizePromptContent` | `runBridge` 主循环、`spawnCliProcess`、`handleShutdown`、权限执行流、重试逻辑完全未测 |
| **P1** | `task-file-ops.ts` | 373 | 有基础测试 | 缺少并发竞态、claim 锁定、retry exhaustion 边界 |
| **P1** | `inbox-outbox.ts` | 353 | 有基础测试 | 缺少 rotation 阈值边界、drain signal、cursor 持久化 |
| **P2** | `permissions.ts` | 247 | 有基础测试 | 缺少 glob 匹配边界（ReDoS 防护验证）、`findPermissionViolations` 集成 |
| **P2** | `bridge-entry.ts` | 210 | 源码扫描式测试 | 缺少实际函数调用测试（当前只检查源码字符串包含） |

---

## 2. 测试策略

### 单元测试 vs 集成测试划分

**单元测试**（mock 所有外部依赖）：
- `mcp-team-bridge.ts` 内部纯函数：`buildTaskPrompt`、`parseCodexOutput`、`diffSnapshots`、`captureFileSnapshot`、`buildEffectivePermissions`、`readOutputSummary`
- `permissions.ts`：`matchGlob` 边界、`findPermissionViolations`
- `task-file-ops.ts`：claim 竞态模拟

**集成测试**（使用临时目录，mock 进程/tmux）：
- `mcp-team-bridge.ts`：`runBridge` 主循环（mock `spawn`、`execSync`）
- `bridge-entry.ts`：`validateConfigPath` 实际调用（已有部分）
- 权限执行流端到端：config -> permission check -> violation report

---

## 3. P0: mcp-team-bridge.ts 测试用例清单

这是最大的缺口。785 行代码，是整个模块的核心守护进程。

测试文件：`src/team/__tests__/mcp-team-bridge.test.ts`（新建）

### 3.1 纯函数单元测试（不需要 mock）

**`parseCodexOutput`**（当前未导出，需先导出或通过 `buildTaskPrompt` 间接测试）：
1. 解析标准 Codex JSONL `item.completed` 事件 -> 提取 text
2. 解析 `message` 事件（string content）-> 提取内容
3. 解析 `message` 事件（array content with text parts）-> 提取所有 text
4. 解析 `output_text` 事件 -> 提取 text
5. 跳过非 JSON 行不抛异常
6. 超过 MAX_CODEX_OUTPUT_SIZE (1MB) 时截断并追加 `[output truncated]`
7. 空输入返回原始 output

**`buildTaskPrompt`**（当前未导出，需导出）：
1. 基础 prompt 包含 TASK_SUBJECT、TASK_DESCRIPTION、WORKING DIRECTORY
2. subject 截断到 500 字符
3. description 截断到 10000 字符
4. inbox messages 每条截断到 5000 字符
5. inbox 总大小不超过 MAX_INBOX_CONTEXT_SIZE (20000)
6. 总 prompt 超过 MAX_PROMPT_SIZE (50000) 时截断 description
7. 无 inbox messages 时不包含 CONTEXT FROM TEAM LEAD 段
8. prompt injection 标签被 sanitize（已有 prompt-sanitization.test.ts 覆盖，此处验证集成）

**`diffSnapshots`**：
1. after 中有 before 没有的路径 -> 返回差异
2. 两个相同的 Set -> 返回空数组
3. before 有 after 没有的路径 -> 不返回（只检测新增）

**`readOutputSummary`**：
1. 文件不存在 -> 返回 `(no output file)`
2. 空文件 -> 返回 `(empty output)`
3. 内容 <= 500 字符 -> 返回完整内容
4. 内容 > 500 字符 -> 截断并追加 `... (truncated)`
5. 读取异常 -> 返回 `(error reading output)`

### 3.2 需要 mock 的集成测试

**`spawnCliProcess`**（mock `child_process.spawn`）：
1. codex provider -> 使用 `codex exec -m gpt-5.3-codex --json --full-auto` 参数
2. gemini provider -> 使用 `gemini --yolo` 参数
3. 自定义 model 参数正确传递
4. CLI 正常退出 (code=0) -> resolve 响应内容
5. CLI 异常退出 (code!=0) -> reject 并包含 stderr
6. CLI 超时 -> SIGTERM 并 reject timeout 错误
7. spawn 失败 -> reject 并包含错误信息
8. stdin 写入错误 -> kill 子进程并 reject
9. stdout 超过 MAX_BUFFER_SIZE (10MB) -> 停止累积

**`handleShutdown`**（mock spawn、inbox-outbox、team-registration、heartbeat、tmux）：
1. 有活跃子进程 -> SIGTERM，5s 后 SIGKILL
2. 无活跃子进程 -> 跳过 kill 步骤
3. 写入 shutdown_ack 到 outbox
4. 调用 unregisterMcpWorker
5. 删除 shutdown signal 文件
6. 删除 heartbeat 文件
7. 调用 killSession 终止 tmux

### 3.3 runBridge 主循环测试（最高风险）

需要 mock：`child_process.spawn`、`child_process.execSync`、`inbox-outbox`、`task-file-ops`、`heartbeat`、`tmux-session`、`team-registration`、`audit-log`、`permissions`。

策略：mock `sleep` 为立即返回，通过 shutdown signal 控制循环退出。

1. 启动后写入初始 heartbeat
2. 首次成功 poll 后发送 ready outbox + worker_ready audit
3. 无任务时发送 idle outbox（仅一次）
4. 发现 pending 任务 -> 标记 in_progress -> 构建 prompt -> spawn CLI
5. CLI 成功 -> 标记 completed -> 写 outbox task_complete
6. CLI 失败 -> writeTaskFailure -> 设回 pending（可重试）
7. CLI 失败且 retry exhausted -> 标记 completed + permanentlyFailed metadata
8. consecutiveErrors >= maxConsecutiveErrors -> 进入 quarantine 状态
9. quarantine 状态下不处理任务，只检查 shutdown signal
10. 收到 shutdown signal -> 调用 handleShutdown 并退出循环
11. 收到 drain signal -> 写 ack -> handleShutdown 并退出
12. spawn 前再次检查 shutdown（防竞态 race #11）
13. 权限 enforce 模式：violation -> task 标记 permanentlyFailed
14. 权限 audit 模式：violation -> task 正常完成 + audit warning
15. poll 循环异常不崩溃（broad catch）

---

## 4. P1: task-file-ops.ts 补充测试

测试文件：`src/team/__tests__/task-file-ops.test.ts`（追加）

1. `findNextTask` 跳过 claimedBy 其他 worker 的任务
2. `findNextTask` 跳过 blockedBy 未完成的任务（已有部分覆盖）
3. claim 竞态：两个 worker 同时 claim 同一任务，只有一个成功
4. `writeTaskFailure` + `readTaskFailure` 正确递增 retryCount
5. `isTaskRetryExhausted` 在 retryCount >= maxRetries 时返回 true
6. 任务文件 JSON 损坏时 graceful 降级（不抛异常）

---

## 5. P1: inbox-outbox.ts 补充测试

测试文件：`src/team/__tests__/inbox-outbox.test.ts`（追加）

1. `rotateOutboxIfNeeded` 在行数超过阈值时创建 `.rotated` 备份
2. `rotateInboxIfNeeded` 在文件大小超过 10MB 时轮转
3. `writeDrainSignal` / `checkDrainSignal` / `deleteDrainSignal` 完整生命周期
4. `readNewInboxMessages` cursor 持久化：第二次调用只返回新消息
5. `cleanupWorkerFiles` 清理所有 worker 相关文件

---

## 6. P2: permissions.ts 补充测试

测试文件：`src/team/__tests__/permissions.test.ts`（追加）

1. `matchGlob` 边界：`**/*.ts` 匹配深层嵌套路径
2. `matchGlob` 边界：`?` 不匹配 `/`
3. `matchGlob`：Windows 反斜杠自动归一化
4. `getEffectivePermissions` 始终包含 SECURE_DENY_DEFAULTS（`.git/**`、`.env*` 等）
5. `getEffectivePermissions` 不重复添加已存在的 deny 模式
6. `findPermissionViolations` 集成：多路径混合（部分允许、部分拒绝）
7. `findPermissionViolations`：路径逃逸 `../` 始终被拒绝
8. ReDoS 防护：超长路径 + 复杂 glob 不导致指数级回溯

---

## 7. P2: bridge-entry.ts 补充测试

测试文件：`src/team/__tests__/bridge-entry.test.ts`（重写/追加）

当前问题：现有测试大量使用源码字符串扫描（`readFileSync` + `includes`），而非实际调用函数。需要替换为真正的函数调用测试。

**`validateConfigPath`**（已导出，可直接测试）：
1. 路径在 `~/.claude/` 下 -> 返回 true
2. 路径在 `~/.omc/` 下 -> 返回 true
3. 路径包含 `/.omc/` 组件（worktree 内） -> 返回 true
4. 路径在 home 外 -> 返回 false
5. 路径遍历攻击 `~/.claude/../../etc/passwd` -> resolve 后返回 false
6. 符号链接攻击：parent 目录 realpath 在 home 外 -> 返回 false
7. parent 目录不存在 -> 不抛异常，返回 true（文件即将创建）

**`validateBridgeWorkingDirectory`**（未导出，需通过 `main` 间接测试或导出）：
1. 目录不存在 -> 抛出 "does not exist"
2. 路径是文件而非目录 -> 抛出 "not a directory"
3. 目录在 home 外（通过 symlink） -> 抛出 "outside home directory"
4. 目录不在 git worktree 内 -> 抛出 "not inside a git worktree"

**`main` 函数集成测试**（mock `process.argv`、`process.exit`、`runBridge`）：
1. 缺少 `--config` 参数 -> exit(1)
2. config JSON 解析失败 -> exit(1) + 错误信息
3. 缺少必填字段（teamName/workerName/provider/workingDirectory） -> exit(1)
4. provider 非 codex/gemini -> exit(1)
5. 危险 allowedPaths 模式（`**`、`*`） -> exit(1)
6. 默认值正确应用：pollIntervalMs=3000, taskTimeoutMs=600000, maxRetries=5
7. teamName/workerName 经过 `sanitizeName` 处理

---

## 8. Mock 策略

### 依赖 Mock 映射表

| 被 Mock 模块 | 使用场景 | Mock 方式 |
|-------------|---------|----------|
| `child_process.spawn` | `spawnCliProcess` 测试 | `vi.mock('child_process')` — 返回 fake ChildProcess（EventEmitter + stdout/stderr/stdin） |
| `child_process.execSync` | `captureFileSnapshot`（git status） | `vi.mock('child_process')` — 返回预设 git status 字符串 |
| `./inbox-outbox.js` | runBridge 消息读写 | `vi.mock('./inbox-outbox.js')` — mock `readNewInboxMessages`、`writeOutbox`、`checkShutdownSignal`、`checkDrainSignal` 等 |
| `./task-file-ops.js` | runBridge 任务生命周期 | `vi.mock('./task-file-ops.js')` — mock `findNextTask`、`updateTask`、`writeTaskFailure`、`readTaskFailure`、`isTaskRetryExhausted` |
| `./heartbeat.js` | runBridge 心跳 | `vi.mock('./heartbeat.js')` — mock `writeHeartbeat`、`deleteHeartbeat` |
| `./tmux-session.js` | handleShutdown tmux 清理 | `vi.mock('./tmux-session.js')` — mock `killSession`、`isSessionAlive`、`sanitizeName` |
| `./team-registration.js` | worker 注册/注销 | `vi.mock('./team-registration.js')` — mock `unregisterMcpWorker`、`listMcpWorkers` |
| `./audit-log.js` | 审计事件写入 | `vi.mock('./audit-log.js')` — mock `writeAuditEvent`、`readAuditLog` |
| `./permissions.js` | 权限检查 | `vi.mock('./permissions.js')` — mock `findPermissionViolations`、`getEffectivePermissions` |
| `../utils/paths.js` | Claude config 目录 | `vi.mock('../../utils/paths.js')` — 返回临时目录路径 |
| `../lib/worktree-paths.js` | worktree 根目录 | `vi.mock('../../lib/worktree-paths.js')` — 返回临时目录 |
| `node:fs` | bridge-entry 文件读取 | 部分 mock：仅 mock `realpathSync` 用于 symlink 测试 |

### Mock 最佳实践

1. **临时目录隔离**：所有文件系统测试使用 `mkdtempSync` 创建临时目录，`afterEach` 中清理
2. **sleep mock**：runBridge 测试中 mock `setTimeout`/自定义 sleep 为立即返回，避免真实等待
3. **循环退出控制**：通过 `checkShutdownSignal` mock 返回值控制 runBridge 主循环退出（第 N 次调用返回 shutdown signal）
4. **ChildProcess fake**：使用 `EventEmitter` 构造 fake spawn 返回值，手动触发 `close`/`error` 事件
5. **不 mock 纯函数**：`parseCodexOutput`、`buildTaskPrompt`、`diffSnapshots` 等纯函数直接测试，不 mock 内部实现

---

## 9. 工作量预估

### 按模块估算

| 优先级 | 测试文件 | 新增用例数 | 预估行数 | 复杂度 | 前置条件 |
|--------|---------|-----------|---------|--------|---------|
| **P0** | `mcp-team-bridge.test.ts`（新建） | ~45 | 800-1000 | 高 | 需先导出 `parseCodexOutput`、`buildTaskPrompt` 等内部函数 |
| **P1** | `task-file-ops.test.ts`（追加） | ~6 | 120-150 | 中 | 无 |
| **P1** | `inbox-outbox.test.ts`（追加） | ~5 | 100-130 | 中 | 无 |
| **P2** | `permissions.test.ts`（追加） | ~8 | 150-180 | 中 | 无 |
| **P2** | `bridge-entry.test.ts`（重写） | ~14 | 250-300 | 中 | 需导出 `validateBridgeWorkingDirectory` 或通过 main 间接测试 |

**总计**：~78 个新增用例，预估 1420-1760 行测试代码。

---

## 10. 执行顺序

### 阶段 1：源码准备（前置条件）

在编写测试前，需要从 `mcp-team-bridge.ts` 导出以下内部函数：

```
export { parseCodexOutput, buildTaskPrompt, diffSnapshots, readOutputSummary, captureFileSnapshot, buildEffectivePermissions }
```

方式：在文件底部添加命名导出，或将函数声明改为 `export function`。不改变任何逻辑。

### 阶段 2：P0 — mcp-team-bridge.test.ts（新建）

执行顺序：
1. 先写纯函数测试（3.1 节，~23 个用例）— 无 mock 依赖，最快验证
2. 再写 `spawnCliProcess` 测试（3.2 节前半，~9 个用例）— 仅 mock `child_process`
3. 再写 `handleShutdown` 测试（3.2 节后半，~7 个用例）— mock 多模块
4. 最后写 `runBridge` 主循环测试（3.3 节，~15 个用例）— 最复杂，依赖前面的 mock 模式

每步完成后运行 `npx vitest run src/team/__tests__/mcp-team-bridge.test.ts` 确认通过。

### 阶段 3：P1 — 补充测试

并行执行：
- `task-file-ops.test.ts` 追加 6 个用例
- `inbox-outbox.test.ts` 追加 5 个用例

完成后运行 `npx vitest run src/team/__tests__/task-file-ops.test.ts src/team/__tests__/inbox-outbox.test.ts`。

### 阶段 4：P2 — 补充测试

并行执行：
- `permissions.test.ts` 追加 8 个用例
- `bridge-entry.test.ts` 重写/追加 14 个用例

完成后运行全量测试：`npx vitest run src/team/__tests__/`。

---

## 11. 验收标准

### 全局验收

1. 所有新增测试通过：`npx vitest run src/team/__tests__/` 零失败
2. 不破坏现有 363 个测试：`npx vitest run` 全量通过
3. 类型检查通过：`npx tsc --noEmit` 零错误
4. 新增测试文件遵循现有风格：vitest describe/it、临时目录隔离、vi.mock 外部依赖
5. 无 `.only` 或 `.skip` 残留在提交中

### 按优先级验收

| 优先级 | 验收条件 |
|--------|---------|
| P0 | `mcp-team-bridge.test.ts` 存在且 >= 40 个用例通过，覆盖纯函数 + spawnCliProcess + handleShutdown + runBridge 主循环 |
| P1 | `task-file-ops.test.ts` 新增 >= 5 个用例（含 claim 竞态），`inbox-outbox.test.ts` 新增 >= 4 个用例（含 rotation + drain） |
| P2 | `permissions.test.ts` 新增 >= 6 个用例（含 ReDoS 防护），`bridge-entry.test.ts` 新增 >= 10 个实际函数调用测试 |

---

*文档结束。此计划可直接用于指导 executor 按阶段实现测试。*
