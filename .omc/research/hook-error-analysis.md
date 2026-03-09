# Hook 执行错误模式分析报告

## [RESEARCH_STAGE:4] Hook 错误处理与安全防护分析

---

## [FINDING:H1] 全局错误处理存在静默失败风险

**问题描述：**
`bridge.ts` 的 `processHook()` 函数使用全局 try-catch 捕获所有 hook 错误，但默认行为是记录错误后继续执行（`return { continue: true }`）。这可能导致关键错误被静默忽略。

**详细分析：**
```typescript
// src/hooks/bridge.ts:1280-1288
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

**影响范围：**

* 除 `permission-request` 外的所有 hook 类型

* 包括关键的 `session-end`、`pre-compact`、`subagent-start/stop` 等

**潜在后果：**
1. 状态文件写入失败被忽略，导致状态不一致
2. 验证失败的输入继续处理，可能触发下游错误
3. 资源清理失败（如 session-end）不会阻止会话结束

[/FINDING]

[EVIDENCE:H1]

* File: src/hooks/bridge.ts

* Lines: 1280-1288

* Content: 全局 catch 块默认返回 `{ continue: true }`

* Context: 仅 permission-request 实现了 fail-closed 策略
[/EVIDENCE]

[CONFIDENCE:HIGH]
代码明确显示了这一模式，且没有针对不同 hook 类型的差异化错误处理策略。

---

## [FINDING:H2] 输入验证不一致：部分 hook 缺少必需字段校验

**问题描述：**
`bridge.ts` 中仅部分 hook 类型使用 `validateHookInput()` 进行必需字段校验，其他 hook 直接处理可能不完整的输入。

**详细分析：**
```typescript
// 有验证的 hook（src/hooks/bridge.ts:1162-1228）
case "session-end": {
  if (!validateHookInput<SessionEndInput>(input, requiredKeysForHook("session-end"), "session-end")) {
    return { continue: true };
  }
  // ...
}

// 无验证的 hook（src/hooks/bridge.ts:1136-1158）
case "keyword-detector":
  return await processKeywordDetector(input);  // 直接处理，无验证

case "ralph":
  return await processRalph(input);  // 直接处理，无验证
```

**缺少验证的 hook 类型：**

* `keyword-detector`

* `stop-continuation`

* `ralph`

* `persistent-mode`

* `session-start`

* `pre-tool-use`

* `post-tool-use`

* `autopilot`

**潜在后果：**
1. 处理函数内部可能访问 undefined 字段导致运行时错误
2. 类型断言失败导致类型不安全
3. 下游逻辑基于不完整数据做出错误决策

[/FINDING]

[EVIDENCE:H2]

* File: src/hooks/bridge.ts

* Lines: 1136-1228

* Content: switch-case 中仅 4 个 hook 类型调用 validateHookInput

* Pattern: 懒加载的 hook（session-end, subagent-*, pre-compact, setup, permission-request）有验证，热路径 hook 无验证
[/EVIDENCE]

[CONFIDENCE:HIGH]
代码结构清晰显示了验证的不一致性。热路径 hook 可能为了性能跳过验证，但缺少文档说明。

---

## [FINDING:H3] bridge-normalize 的敏感 hook 白名单过于宽松

**问题描述：**
`bridge-normalize.ts` 定义的敏感 hook 白名单（`STRICT_WHITELIST`）包含了可能被滥用的字段，且白名单定义与实际使用场景不匹配。

**详细分析：**
```typescript
// src/hooks/bridge-normalize.ts:114-119
const STRICT_WHITELIST: Record<string, string[]> = {
  'permission-request': ['sessionId', 'toolName', 'toolInput', 'directory',
                         'permission_mode', 'tool_use_id', 'transcript_path', 'agent_id'],
  'setup-init': ['sessionId', 'directory'],
  'setup-maintenance': ['sessionId', 'directory'],
  'session-end': ['sessionId', 'directory'],
};
```

**问题点：**
1. **permission-request 包含 `toolInput`**：允许传递任意工具输入数据，可能包含恶意 payload
2. **缺少字段类型验证**：白名单仅检查字段名，不验证字段值的类型和格式
3. **`agent_id` 字段未验证格式**：可能被注入路径遍历字符

**对比 REQUIRED_KEYS：**
```typescript
// src/hooks/bridge-normalize.ts:122-125
const REQUIRED_KEYS: Record<string, string[]> = {
  'session-end': ['sessionId', 'directory'],
  'permission-request': ['toolName'],
};
```

* `permission-request` 仅要求 `toolName`，但白名单允许 8 个字段

* 多余的 6 个字段（toolInput, directory, permission_mode, tool_use_id, transcript_path, agent_id）未被标记为必需，但可以传递

[/FINDING]

[EVIDENCE:H3]

* File: src/hooks/bridge-normalize.ts

* Lines: 114-125

* Content: STRICT_WHITELIST 与 REQUIRED_KEYS 定义不对称

* Security Impact: toolInput 和 agent_id 字段可能成为攻击向量
[/EVIDENCE]

[CONFIDENCE:MEDIUM]
白名单设计可能有合理的业务需求（如调试、审计），但缺少文档说明这些字段的用途和安全边界。

---

## [FINDING:H4] JSON 解析错误处理不一致

**问题描述：**
代码库中同时存在两种 JSON 解析模式：`safeJsonParse`（安全）和 `JSON.parse`（不安全），后者在错误时可能导致未捕获异常。

**详细分析：**

**安全模式（推荐）：**
```typescript
// src/lib/safe-json.ts:17-30
export function safeJsonParse<T = unknown>(content: string, filePath?: string): SafeJsonResult<T> {
  try {
    const data = JSON.parse(content) as T;
    return { success: true, data };
  } catch (error) {
    const errorMsg = filePath
      ? `Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      : `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`;
    return { success: false, error: errorMsg };
  }
}
```

**不安全模式（存在风险）：**
```typescript
// src/hooks/autopilot/state.ts:98
try {
  const content = readFileSync(stateFile, 'utf-8');
  return JSON.parse(content);  // 直接解析，错误被外层 catch 捕获
} catch {
  return null;  // 静默失败，丢失错误信息
}
```

**使用情况统计：**

* `safeJsonParse` 使用：bridge.ts（2 处）

* 裸 `JSON.parse` 使用：autopilot/state.ts, agent-usage-reminder/storage.ts, 多个测试文件

**潜在后果：**
1. 错误信息丢失，难以调试状态文件损坏问题
2. 静默返回 null 可能导致下游逻辑误判（将"文件不存在"与"文件损坏"混淆）
3. 缺少文件路径上下文，无法定位问题源

[/FINDING]

[EVIDENCE:H4]

* File: src/lib/safe-json.ts (安全实现)

* File: src/hooks/autopilot/state.ts:98 (不安全使用)

* File: src/hooks/agent-usage-reminder/storage.ts:30 (不安全使用)

* Pattern: 状态管理模块普遍使用裸 JSON.parse + 空 catch
[/EVIDENCE]

[CONFIDENCE:HIGH]
代码模式清晰，且 safe-json.ts 的存在表明团队意识到了这个问题，但未在全代码库推广。

---

## [FINDING:H5] 路径遍历防护仅覆盖 mode 参数，其他路径输入未验证

**问题描述：**
`validateMode.ts` 提供了严格的 mode 参数验证，但其他可能构造文件路径的输入（如 `sessionId`、`directory`、`agent_id`）缺少类似的防护。

**详细分析：**

**已防护的路径（mode 参数）：**
```typescript
// src/lib/validateMode.ts:69-94
export function assertValidMode(mode: unknown): ValidMode {
  if (!validateMode(mode)) {
    // 检测路径遍历字符
    if (typeof mode === 'string' && (
      mode.includes('..') | |
      mode.includes('/') | |
      mode.includes('\\') | |
      mode.startsWith('.') | |
      /^[a-zA-Z]:/.test(mode)
    )) {
      throw new Error(`Path traversal attempt detected: "${display}"`);
    }
  }
  return mode;
}
```

**未防护的路径输入：**
```typescript
// src/hooks/bridge.ts:165
join(stateDir, "sessions", sessionId, "team-state.json")
// sessionId 未经验证，可能包含 "../" 等字符

// src/hooks/bridge.ts:1181
const startInput: SubagentStartInput = {
  cwd: (normalized.directory ?? normalized.cwd) as string,  // directory 未验证
  agent_id: normalized.agent_id as string,  // agent_id 未验证
  // ...
};
```

**攻击场景示例：**
```javascript
// 恶意 sessionId
sessionId = "../../etc/passwd"
// 构造的路径：.omc/state/sessions/../../etc/passwd/team-state.json
// 实际路径：.omc/etc/passwd/team-state.json

// 恶意 agent_id
agent_id = "../../../tmp/malicious"
// 可能影响 agent 相关的文件操作
```

**现有防护措施：**

* `path.join()` 会规范化路径，但不会阻止遍历到父目录

* 文件系统权限可能限制实际危害，但不应作为唯一防线

[/FINDING]

[EVIDENCE:H5]

* File: src/lib/validateMode.ts (仅验证 mode)

* File: src/hooks/bridge.ts:165 (sessionId 未验证)

* File: src/hooks/bridge.ts:1181-1186 (directory, agent_id 未验证)

* Reference: docs/standards/runtime-protection.md 应该定义这些验证规则
[/EVIDENCE]

[CONFIDENCE:HIGH]
代码明确显示了验证的不对称性。validateMode 的存在证明团队意识到路径遍历风险，但未扩展到其他输入。

---

## [FINDING:H6] 超时机制实现不完整

**问题描述：**
`timeout-wrapper.ts` 提供了超时机制，但实现存在缺陷：
1. 使用 `AbortController` 但未传递 signal 给实际操作
2. 超时后返回 undefined 或 fallback，可能被误判为正常结果
3. 未在 bridge.ts 中广泛应用

**详细分析：**

**超时实现：**
```typescript
// src/hooks/timeout-wrapper.ts:17-51
export async function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      fn(),  // ❌ fn 不接收 controller.signal，无法真正中断
      new Promise<never>((_, reject) =>
        controller.signal.addEventListener('abort', () =>
          reject(new Error(`Timeout after ${timeoutMs}ms`))
        )
      ),
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    // ...
    return fallback?.();  // ❌ 返回 undefined 或 fallback，调用者无法区分超时与正常返回
  }
}
```

**问题点：**
1. **无法真正中断操作**：`fn()` 不接收 `AbortSignal`，超时后操作仍在后台运行
2. **返回值歧义**：`T | undefined` 类型使得调用者无法区分：
   - 操作成功返回 undefined
   - 操作超时返回 undefined
   - 操作失败返回 fallback
1. **未广泛应用**：bridge.ts 中未见 `withTimeout` 的使用

**正确的超时模式应该是：**
```typescript
// 示例：正确的超时实现
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions
): Promise<{ success: true; data: T } | { success: false; reason: 'timeout' | 'error'; error?: Error }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn(controller.signal);  // 传递 signal
    clearTimeout(timeoutId);
    return { success: true, data: result };
  } catch (error) {
    clearTimeout(timeoutId);
    if (controller.signal.aborted) {
      return { success: false, reason: 'timeout' };
    }
    return { success: false, reason: 'error', error: error as Error };
  }
}
```

[/FINDING]

[EVIDENCE:H6]

* File: src/hooks/timeout-wrapper.ts:17-51

* Issue 1: fn() 不接收 AbortSignal 参数

* Issue 2: 返回类型 T | undefined 存在歧义

* Issue 3: bridge.ts 中未使用 withTimeout
[/EVIDENCE]

[CONFIDENCE:HIGH]
代码清晰显示了实现缺陷。timeout-wrapper.ts 可能是早期设计遗留，未被实际采用。

---

## 总结与建议

### 关键发现优先级

**P0（立即修复）：**
1. [H5] 路径遍历防护不完整 - 扩展 validateMode 逻辑到 sessionId、directory、agent_id
2. [H1] 全局错误处理静默失败 - 为关键 hook（session-end, pre-compact）实现 fail-fast

**P1（短期修复）：**
1. [H2] 输入验证不一致 - 为所有 hook 类型添加必需字段校验
2. [H4] JSON 解析不一致 - 全面采用 safeJsonParse

**P2（中期改进）：**
1. [H3] 敏感 hook 白名单过于宽松 - 审查并收紧 STRICT_WHITELIST
2. [H6] 超时机制不完整 - 重新设计或移除未使用的 timeout-wrapper

### 架构建议

1. **统一错误处理策略**：
   - 定义 hook 错误严重性等级（critical/warning/info）
   - Critical hook 失败应阻止执行（fail-fast）
   - Warning hook 失败应记录但继续（当前行为）

1. **输入验证框架**：
   - 使用 Zod schema 为每个 hook 类型定义输入契约
   - 在 bridge-normalize 中集成 schema 验证
   - 生成类型安全的 HookInput 子类型

1. **路径安全库**：
   - 创建 `validatePathInput(input: string, context: string): string` 通用函数
   - 集成到所有路径构造点
   - 添加审计日志记录可疑输入

[STAGE_COMPLETE:4]
