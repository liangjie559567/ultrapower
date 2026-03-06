# P0-1.1 审计报告：permission-request Hook 调用点

**审计日期**: 2026-03-05
**审计范围**: ultrapower v5.5.14 代码库
**任务**: 识别所有 permission-request hook 调用点及敏感操作

---

## 执行摘要

permission-request hook 是 ultrapower 中的关键安全门禁，用于在执行敏感操作前请求用户授权。当前实现存在以下问题：

1. **静默降级行为**：当前 `handlePermissionRequest()` 总是返回 `continue: true`，即使拒绝也不阻塞
2. **缺乏阻塞机制**：无法真正拒绝敏感操作
3. **敏感操作类型不完整**：仅处理 Bash 命令，未覆盖其他工具

---

## 调用点清单

### 1. 主调用点：bridge.ts

**文件**: `src/hooks/bridge.ts`
**行号**: 1130-1162

```typescript
case "permission-request": {
  if (!validateHookInput<PermissionRequestInput>(input, requiredKeysForHook("permission-request"), "permission-request")) {
    return { continue: false };  // ← 验证失败时阻塞
  }
  const { handlePermissionRequest } = await import("./permission-handler/index.js");
  const permInput: PermissionRequestInput = { ... };
  const result = await handlePermissionRequest(permInput);

  auditLogger.log({
    actor: 'agent',
    action: 'permission_request',
    resource: permInput.tool_name,
    result: result.continue ? 'success' : 'failure',
    metadata: { tool_use_id: permInput.tool_use_id, permission_mode: permInput.permission_mode }
  }).catch(() => {});

  return result;
}
```

**关键特性**:
- 验证失败时返回 `continue: false`（阻塞）
- 审计日志记录所有 permission-request 调用
- 支持 snake_case 和 camelCase 字段映射

---

### 2. 处理器实现：permission-handler/index.ts

**文件**: `src/hooks/permission-handler/index.ts`
**行号**: 159-210

```typescript
export function processPermissionRequest(input: PermissionRequestInput): HookOutput {
  // 仅处理 Bash 工具
  const toolName = input.tool_name.replace(/^proxy_/, '');
  if (toolName !== 'Bash') {
    return { continue: true };  // ← 非 Bash 工具直接通过
  }

  const command = input.tool_input.command;
  if (!command || typeof command !== 'string') {
    return { continue: true };
  }

  // 自动允许安全命令
  if (isSafeCommand(command)) {
    return { continue: true, hookSpecificOutput: { ... } };
  }

  // 自动允许安全的 heredoc 命令
  if (isHeredocWithSafeBase(command)) {
    return { continue: true, hookSpecificOutput: { ... } };
  }

  // 默认：让正常权限流程处理
  return { continue: true };  // ← 总是返回 continue: true
}
```

**问题**:
- 所有路径都返回 `continue: true`，无法拒绝
- 非 Bash 工具直接通过，无检查
- 不安全命令也通过（依赖 Claude Code 原生权限流程）

---

## 敏感操作分类

### 当前覆盖的操作

#### 1. Bash 命令（部分覆盖）

**安全命令自动允许**:
- `git status|diff|log|branch|show|fetch`
- `npm|pnpm|yarn test|run (test|lint|build|check|typecheck)`
- `tsc`, `eslint`, `prettier`
- `cargo test|check|clippy|build`
- `pytest`, `python -m pytest`
- `ls`

**安全 Heredoc 命令自动允许**:
- `git commit` (with heredoc body)
- `git tag` (with heredoc body)

**其他 Bash 命令**:
- 包含危险字符的命令被拒绝（`;&|`$()<>\n\r\t\0\\{}[\]*?~!#`）
- 其他命令通过到 Claude Code 原生权限流程

#### 2. 未覆盖的敏感操作

| 工具 | 操作类型 | 当前行为 | 风险 |
|------|--------|--------|------|
| Edit | 文件修改 | 直接通过 | 可修改任意文件 |
| Write | 文件创建 | 直接通过 | 可创建任意文件 |
| Bash | 文件删除 | 直接通过 | 可执行 `rm -rf` |
| Bash | 网络请求 | 直接通过 | 可执行 `curl`, `wget` |
| Bash | 系统命令 | 直接通过 | 可执行 `sudo`, `chmod` |
| Task | 子 agent 创建 | 直接通过 | 可创建无限 agent |
| Bash | 进程管理 | 直接通过 | 可执行 `pkill`, `kill` |

---

## 当前行为分析

### 用户拒绝时的处理

**当前状态**: 无法真正拒绝

```
用户在 Claude Code UI 中拒绝权限
  ↓
Claude Code 返回 permission_denied 错误
  ↓
Agent 收到错误，继续执行其他工作
  ↓
操作被阻止，但无审计记录
```

### 阻塞机制

**当前状态**: 仅在验证失败时阻塞

```typescript
// 仅在这种情况下阻塞：
if (!validateHookInput<PermissionRequestInput>(input, ...)) {
  return { continue: false };  // ← 阻塞
}

// 所有其他情况都通过：
return { continue: true };  // ← 不阻塞
```

---

## 发现的安全问题

### P0 级（严重）

1. **静默降级**（行 202）
   - `processPermissionRequest()` 总是返回 `continue: true`
   - 无法拒绝任何操作
   - 依赖 Claude Code 原生权限流程，但无法验证用户决定

2. **非 Bash 工具无检查**（行 163-164）
   - Edit、Write、Task 等工具直接通过
   - 无敏感操作检测

3. **缺乏操作分类**
   - 无法区分读操作、写操作、删除操作
   - 无法根据操作类型应用不同的权限策略

### P1 级（中等）

4. **审计日志不完整**（bridge.ts 行 1153-1159）
   - 仅记录 `success|failure`，不记录用户决定
   - 不记录被拒绝的操作详情

5. **Heredoc 处理不完整**（行 91-109）
   - 仅允许 `git commit` 和 `git tag`
   - 其他 heredoc 命令被拒绝

---

## 字段白名单

**permission-request 允许的字段**（bridge-normalize.ts 行 115）:

```typescript
'permission-request': [
  'sessionId',
  'toolName',
  'toolInput',
  'directory',
  'permission_mode',
  'tool_use_id',
  'transcript_path',
  'agent_id'
]
```

**必需字段**（bridge-normalize.ts 行 124）:

```typescript
'permission-request': ['toolName']
```

**验证失败时的行为**（bridge.ts 行 1132-1134）:

```typescript
if (!validateHookInput<PermissionRequestInput>(input, requiredKeysForHook("permission-request"), "permission-request")) {
  return { continue: false };  // ← 阻塞
}
```

---

## 建议

### 立即行动（P0）

1. 实现真正的阻塞模式 API
   - 定义 `decision: 'allow' | 'deny' | 'ask'`
   - 在 `continue: false` 时返回拒绝原因

2. 扩展敏感操作检测
   - 覆盖 Edit、Write、Task 工具
   - 检测文件删除、网络请求、系统命令

3. 完善审计日志
   - 记录用户决定（allow/deny/ask）
   - 记录被拒绝的操作详情

### 后续优化（P1）

4. 实现权限策略引擎
   - 支持基于操作类型的权限规则
   - 支持基于文件路径的权限规则

5. 增强 Heredoc 处理
   - 支持更多安全的 heredoc 命令
   - 防止 heredoc 体被存储在 settings.local.json

---

## 附录：依赖关系

**permission-request hook 的依赖**（dependency-analyzer.ts 行 35-39）:

```typescript
{
  hookType: 'permission-request',
  reads: [],
  writes: [],
  callsTools: [],
}
```

**特点**: 无状态依赖，可与其他 hook 并行执行

---

## 审计完成

✅ 调用点清单：已生成
✅ 敏感操作分类：已完成
✅ 当前行为分析：已完成
✅ 安全问题识别：已完成

**下一步**: 执行 P0-1.2 任务（设计阻塞模式 API）
