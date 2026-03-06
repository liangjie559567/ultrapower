# Hook 执行路径审计报告 - P0-2

**生成时间**: 2026-03-05
**审计范围**: PreToolUse 和 PostToolUse hook 调用点、执行流程、超时配置

---

## 1. PreToolUse Hook 调用点

### 1.1 主调用位置

**文件**: `src/hooks/bridge.ts`
**行号**: 1038-1039

```typescript
case "pre-tool-use":
  return processPreToolUse(input);
```

### 1.2 处理函数定义

**文件**: `src/hooks/bridge.ts`
**行号**: 715-853

```typescript
function processPreToolUse(input: HookInput): HookOutput {
  const directory = resolveToWorktreeRoot(input.directory);

  // Check delegation enforcement FIRST
  const enforcementResult = processOrchestratorPreTool({
    toolName: input.toolName || "",
    toolInput: (input.toolInput as Record<string, unknown>) || {},
    sessionId: input.sessionId,
    directory,
  });

  // If enforcement blocks, return immediately
  if (!enforcementResult.continue) {
    return {
      continue: false,
      reason: enforcementResult.reason,
      message: enforcementResult.message,
    };
  }

  // ... 其他处理逻辑
  return {
    continue: true,
    modifiedInput: delegationResult.modifiedInput,
    ...(enforcementResult.message ? { message: enforcementResult.message } : {}),
  };
}
```

### 1.3 PreToolUse 执行流程

```
processHook("pre-tool-use", input)
  ↓
processPreToolUse(input)
  ├─ resolveToWorktreeRoot(input.directory)
  ├─ processOrchestratorPreTool()  [src/hooks/omc-orchestrator/index.ts:363]
  │  ├─ getEnforcementLevel(directory)
  │  ├─ isWriteEditTool(toolName)
  │  ├─ isAllowedPath(filePath, directory)
  │  └─ 返回 { continue, reason?, message? }
  ├─ 检查 AskUserQuestion 工具 → dispatchAskUserQuestionNotification()
  ├─ 检查 pkill -f 风险
  ├─ 背景进程守卫 (background process guard)
  ├─ 追踪 Task 工具调用
  ├─ 追踪 Edit/Write 文件所有权
  ├─ enforceDelegationModel() [src/features/delegation-enforcer.ts:159]
  └─ 返回 HookOutput
```

### 1.4 关键检查点

| 检查项 | 位置 | 目的 |
|--------|------|------|
| 委托强制执行 | 行 719-733 | 阻止非允许路径的直接修改 |
| AskUserQuestion 通知 | 行 737-739 | 在工具阻塞前通知用户 |
| pkill -f 警告 | 行 743-760 | 防止自终止风险 |
| 背景进程限制 | 行 764-789 | 防止 forkbomb (最多 5 个) |
| Task 追踪 | 行 792-810 | HUD 背景任务显示 |
| 文件所有权记录 | 行 813-825 | 会话回放追踪 |

---

## 2. PostToolUse Hook 调用点

### 2.1 主调用位置

**文件**: `src/hooks/bridge.ts`
**行号**: 1041-1042

```typescript
case "post-tool-use":
  return await processPostToolUse(input);
```

### 2.2 处理函数定义

**文件**: `src/hooks/bridge.ts`
**行号**: 883-943

```typescript
async function processPostToolUse(input: HookInput): Promise<HookOutput> {
  const directory = resolveToWorktreeRoot(input.directory);
  const messages: string[] = [];

  // Ensure mode state activation also works when execution starts via Skill tool
  const toolName = (input.toolName || "").toLowerCase();
  if (toolName === "skill") {
    const skillName = getInvokedSkillName(input.toolInput);
    if (skillName === "ralph") {
      const { createRalphLoopHook } = await import("./ralph/index.js");
      const promptText = typeof input.prompt === "string" && input.prompt.trim().length > 0
        ? input.prompt
        : "Ralph loop activated via Skill tool";
      const hook = createRalphLoopHook(directory);
      hook.startLoop(input.sessionId, promptText);
    }
  }

  // Run orchestrator post-tool processing
  const orchestratorResult = processOrchestratorPostTool(
    {
      toolName: input.toolName || "",
      toolInput: (input.toolInput as Record<string, unknown>) || {},
      sessionId: input.sessionId,
      directory,
    },
    String(input.toolOutput ?? ""),
  );

  if (orchestratorResult.message) {
    messages.push(orchestratorResult.message);
  }

  // After Task completion, show updated agent dashboard
  if (input.toolName === "Task") {
    const dashboard = getAgentDashboard(directory);
    if (dashboard) {
      messages.push(dashboard);
    }
  }

  // Non-blocking UsageTracker call
  recordUsage(directory, {
    toolName: input.toolName ?? '',
    agentRole: extractAgentRole(input.toolName ?? '', input.toolInput),
    skillName: extractSkillName(input.toolName ?? '', input.toolInput),
    timestamp: Date.now(),
    sessionId: input.sessionId ?? '',
  }).catch(() => {});

  if (messages.length > 0) {
    return {
      continue: true,
      message: messages.join("\n\n"),
    };
  }

  return { continue: true };
}
```

### 2.3 PostToolUse 执行流程

```
processHook("post-tool-use", input)
  ↓
processPostToolUse(input)
  ├─ resolveToWorktreeRoot(input.directory)
  ├─ 检查 Skill 工具 → ralph 激活
  ├─ processOrchestratorPostTool() [src/hooks/omc-orchestrator/index.ts:434]
  │  ├─ isWriteEditTool(toolName)
  │  ├─ isAllowedPath(filePath, workDir)
  │  ├─ Task 工具处理
  │  │  ├─ processRememberTags(output, workDir)
  │  │  ├─ getGitDiffStats(workDir)
  │  │  ├─ readBoulderState(workDir)
  │  │  └─ 构建增强输出
  │  └─ 返回 { continue, modifiedOutput?, message? }
  ├─ Task 工具完成后显示 agent dashboard
  ├─ recordUsage() [非阻塞]
  └─ 返回 HookOutput
```

### 2.4 关键处理点

| 处理项 | 位置 | 目的 |
|--------|------|------|
| Ralph 激活 | 行 890-901 | 通过 Skill 工具启动 ralph 循环 |
| 编排器后处理 | 行 904-916 | 添加提醒和验证信息 |
| Agent Dashboard | 行 919-924 | Task 完成后显示并行 agent 状态 |
| 使用追踪 | 行 927-933 | 记录工具/技能使用情况 (非阻塞) |

---

## 3. 当前执行流程图

```
Claude Code 触发工具执行
  ↓
┌─────────────────────────────────────┐
│ PRE-TOOL-USE HOOK                   │
├─────────────────────────────────────┤
│ 1. 委托强制执行检查                 │
│    ├─ 获取强制执行级别              │
│    ├─ 检查是否为写/编辑工具         │
│    ├─ 验证文件路径是否允许          │
│    └─ 返回 continue/block           │
│                                     │
│ 2. 工具特定检查                     │
│    ├─ AskUserQuestion 通知          │
│    ├─ pkill -f 风险警告             │
│    ├─ 背景进程限制                  │
│    └─ 文件所有权追踪                │
│                                     │
│ 3. 模型参数强制执行                 │
│    └─ enforceDelegationModel()      │
│                                     │
│ 返回: HookOutput                    │
└─────────────────────────────────────┘
  ↓
工具执行
  ↓
┌─────────────────────────────────────┐
│ POST-TOOL-USE HOOK                  │
├─────────────────────────────────────┤
│ 1. Ralph 激活检查                   │
│    └─ 如果是 Skill("ralph")         │
│                                     │
│ 2. 编排器后处理                     │
│    ├─ 处理 <remember> 标签          │
│    ├─ 获取 git diff 统计            │
│    ├─ 读取 boulder 状态             │
│    └─ 构建增强输出                  │
│                                     │
│ 3. Agent Dashboard 显示             │
│    └─ 如果是 Task 工具              │
│                                     │
│ 4. 使用追踪 (非阻塞)                │
│    └─ recordUsage()                 │
│                                     │
│ 返回: HookOutput                    │
└─────────────────────────────────────┘
```

---

## 4. 超时配置现状

### 4.1 现有超时配置

**文件**: `src/hooks/omc-orchestrator/index.ts`
**行号**: 168-219

```typescript
export function getGitDiffStats(directory: string): GitFileStat[] {
  try {
    const output = execSync('git diff --numstat HEAD', {
      cwd: directory,
      encoding: 'utf-8',
      timeout: 5000,  // ← 5 秒超时
    }).trim();

    // ...

    const statusOutput = execSync('git status --porcelain', {
      cwd: directory,
      encoding: 'utf-8',
      timeout: 5000,  // ← 5 秒超时
    }).trim();

    // ...
  } catch {
    return [];
  }
}
```

### 4.2 超时覆盖范围

| 操作 | 超时值 | 位置 | 备注 |
|------|--------|------|------|
| git diff | 5s | 行 173 | execSync 超时 |
| git status | 5s | 行 180 | execSync 超时 |
| 其他 hook 操作 | 无 | - | **缺失** |

### 4.3 缺失的超时配置

- **PreToolUse 整体执行**: 无超时限制
- **PostToolUse 整体执行**: 无超时限制
- **orchestrator 处理**: 无超时限制
- **文件所有权记录**: 无超时限制
- **使用追踪**: 无超时限制 (虽然是非阻塞)
- **ralph 激活**: 无超时限制

---

## 5. 需要修改的位置清单

### P0 优先级 (关键)

1. **PreToolUse 整体超时**
   - 位置: `src/hooks/bridge.ts:715-853`
   - 需求: 添加 5s 超时包装
   - 影响: 防止 hook 无限期阻塞工具执行

2. **PostToolUse 整体超时**
   - 位置: `src/hooks/bridge.ts:883-943`
   - 需求: 添加 5s 超时包装
   - 影响: 防止 hook 无限期阻塞工具返回

3. **orchestrator 处理超时**
   - 位置: `src/hooks/omc-orchestrator/index.ts:363-428` (PreTool)
   - 位置: `src/hooks/omc-orchestrator/index.ts:434-496` (PostTool)
   - 需求: 添加 3s 超时包装
   - 影响: 防止委托检查阻塞

### P1 优先级 (重要)

4. **文件所有权记录超时**
   - 位置: `src/hooks/bridge.ts:818-824`
   - 需求: 添加 1s 超时
   - 影响: 防止会话回放追踪阻塞

5. **ralph 激活超时**
   - 位置: `src/hooks/bridge.ts:890-901`
   - 需求: 添加 2s 超时
   - 影响: 防止 ralph 状态初始化阻塞

6. **Agent Dashboard 获取超时**
   - 位置: `src/hooks/bridge.ts:920-924`
   - 需求: 添加 1s 超时
   - 影响: 防止 dashboard 生成阻塞

---

## 6. 错误处理机制

### 6.1 当前错误处理

**文件**: `src/hooks/bridge.ts`
**行号**: 1167-1175

```typescript
try {
  switch (hookType) {
    // ... hook 处理
  }
} catch (error) {
  // Log error but don't block execution
  console.error(`[hook-bridge] Error in ${hookType}:`, error);
  // For permission-request, fail closed on error (security default)
  if (hookType === "permission-request") {
    return { continue: false };
  }
  return { continue: true };
}
```

### 6.2 错误处理特点

- **全局 try-catch**: 捕获所有 hook 处理错误
- **日志记录**: 错误输出到 stderr
- **安全默认**: permission-request 失败关闭，其他继续
- **非阻塞**: 大多数错误不阻塞工具执行

### 6.3 超时错误处理需求

- 超时应视为可恢复错误
- 超时时返回 `{ continue: true }` (允许继续)
- 超时应记录警告日志
- 超时不应阻塞工具执行

---

## 7. 返回值处理

### 7.1 PreToolUse 返回值

```typescript
interface HookOutput {
  continue: boolean;           // 是否继续执行工具
  message?: string;            // 注入的消息
  reason?: string;             // 阻塞原因
  modifiedInput?: unknown;     // 修改后的工具输入
}
```

**处理逻辑**:
- `continue: false` → 工具执行被阻塞
- `continue: true` → 工具继续执行
- `modifiedInput` → 替换原始工具输入
- `message` → 注入到上下文

### 7.2 PostToolUse 返回值

```typescript
interface HookOutput {
  continue: boolean;           // 总是 true
  message?: string;            // 注入的消息
  modifiedOutput?: string;     // 修改后的工具输出
}
```

**处理逻辑**:
- `continue` → 总是 true (不阻塞)
- `modifiedOutput` → 替换原始工具输出
- `message` → 注入到上下文

---

## 8. 总结

### 当前状态

✅ **已实现**:
- PreToolUse 和 PostToolUse 的完整处理流程
- 委托强制执行检查
- 背景进程守卫
- 文件所有权追踪
- 使用追踪
- 全局错误处理

❌ **缺失**:
- PreToolUse 整体执行超时
- PostToolUse 整体执行超时
- orchestrator 处理超时
- 文件所有权记录超时
- ralph 激活超时
- Agent Dashboard 获取超时

### 建议行动

1. **立即实施** (P0): 为 PreToolUse 和 PostToolUse 添加 5s 超时包装
2. **紧接着** (P0): 为 orchestrator 处理添加 3s 超时
3. **后续** (P1): 为各子操作添加细粒度超时
4. **测试**: 验证超时不会导致工具执行中断或数据丢失

