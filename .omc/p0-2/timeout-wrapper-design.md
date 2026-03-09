# 超时包装器设计文档 - P0-2.2

**生成时间**: 2026-03-05
**设计者**: team-lead
**状态**: Draft
**优先级**: P0
**工作量**: 2 小时

---

## 1. API 规范

### 1.1 TypeScript 接口

```typescript
/**
 * 超时包装器 - 使用 Promise.race 实现超时控制
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  hookName: string,
  directory?: string
): Promise<T | null>;

/**
 * 超时配置接口
 */
export interface TimeoutConfig {
  preToolUseTimeout: number;
  postToolUseTimeout: number;
  orchestratorTimeout: number;
  strictMode: boolean;
}

/**
 * 从环境变量加载超时配置
 */
export function loadTimeoutConfig(): TimeoutConfig;
```

---

## 2. 实现伪代码

### 2.1 核心包装器

```typescript
// src/hooks/timeout-wrapper.ts
export function loadTimeoutConfig(): TimeoutConfig {
  return {
    preToolUseTimeout: parseInt(process.env.OMC_HOOK_TIMEOUT_MS | | '5000', 10),
    postToolUseTimeout: parseInt(process.env.OMC_HOOK_TIMEOUT_MS | | '5000', 10),
    orchestratorTimeout: parseInt(process.env.OMC_ORCHESTRATOR_TIMEOUT_MS | | '3000', 10),
    strictMode: process.env.OMC_HOOK_TIMEOUT_STRICT === 'true',
  };
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  hookName: string,
  directory?: string
): Promise<T | null> {
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), timeoutMs);
  });

  const result = await Promise.race([promise, timeoutPromise]);

  if (result === null) {
    console.warn(`[hook-timeout] ${hookName} timed out after ${timeoutMs}ms`);
    if (directory) {
      logTimeout(hookName, timeoutMs, directory);
    }
    return null;
  }

  return result;
}
```

### 2.2 PreToolUse 集成

```typescript
// src/hooks/bridge.ts
async function processPreToolUse(input: HookInput): Promise<HookOutput> {
  const config = loadTimeoutConfig();
  const result = await withTimeout(
    processPreToolUseInternal(input),
    config.preToolUseTimeout,
    'PreToolUse',
    input.directory
  );
  return result ?? { continue: true };
}
```

### 2.3 PostToolUse 集成

```typescript
async function processPostToolUse(input: HookInput): Promise<HookOutput> {
  const config = loadTimeoutConfig();
  const result = await withTimeout(
    processPostToolUseInternal(input),
    config.postToolUseTimeout,
    'PostToolUse',
    input.directory
  );
  return result ?? { continue: true };
}
```

---

## 3. 集成点清单

| 文件 | 修改内容 | 行号 | 优先级 |
| ------ | --------- | ------ | -------- |
| `src/hooks/timeout-wrapper.ts` | 新建文件 | - | P0 |
| `src/hooks/bridge.ts` | 包装 processPreToolUse | 715 | P0 |
| `src/hooks/bridge.ts` | 包装 processPostToolUse | 883 | P0 |
| `src/hooks/omc-orchestrator/index.ts` | 包装 PreTool | 363 | P0 |
| `src/hooks/omc-orchestrator/index.ts` | 包装 PostTool | 434 | P0 |

---

## 4. 超时策略

| Hook 类型 | 默认超时 | 环境变量 | 理由 |
| ----------- | --------- | --------- | ------ |
| PreToolUse | 5000ms | `OMC_HOOK_TIMEOUT_MS` | 包含委托检查、背景进程守卫 |
| PostToolUse | 5000ms | `OMC_HOOK_TIMEOUT_MS` | 包含 ralph 激活、dashboard |
| Orchestrator | 3000ms | `OMC_ORCHESTRATOR_TIMEOUT_MS` | 仅委托检查和验证 |

**降级行为**: 超时返回 `{ continue: true }`

**日志文件**: `.omc/logs/hook-timeouts.log`

---

## 5. 环境变量

| 变量名 | 默认值 | 说明 |
| -------- | -------- | ------ |
| `OMC_HOOK_TIMEOUT_MS` | 5000 | PreToolUse/PostToolUse 超时 |
| `OMC_ORCHESTRATOR_TIMEOUT_MS` | 3000 | Orchestrator 超时 |
| `OMC_HOOK_TIMEOUT_STRICT` | false | 严格模式 |

---

## 6. 测试场景

| 场景 | 输入 | 期望输出 |
| ------ | ------ | --------- |
| 正常执行 | Hook 1s | 返回正常结果 |
| PreToolUse 超时 | Hook 6s | `{ continue: true }` |
| PostToolUse 超时 | Hook 6s | `{ continue: true }` |
| 工具不阻塞 | 超时 | 工具继续执行 |

---

## 7. 风险评估

| 风险 | 严重性 | 缓解措施 |
| ------ | -------- | --------- |
| 超时值过小 | 高 | 环境变量自定义 |
| 内存泄漏 | 中 | Promise 自然完成 |
| 日志增长 | 低 | 后续日志轮转 |

---

## 8. 实现清单

* [ ] 创建 `timeout-wrapper.ts`

* [ ] 实现 `withTimeout()`

* [ ] 实现 `loadTimeoutConfig()`

* [ ] 修改 bridge.ts PreToolUse

* [ ] 修改 bridge.ts PostToolUse

* [ ] 修改 orchestrator

* [ ] 单元测试

* [ ] 集成测试

---

## 9. 总结

**设计亮点**: 简洁、非侵入、可配置、降级友好

**实现路径**: 核心包装器 → PreToolUse/PostToolUse → Orchestrator

**工作量**: 2 小时

**下一步**: 实现 `src/hooks/timeout-wrapper.ts`
