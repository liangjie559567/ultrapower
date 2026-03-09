# API 审查报告 - ultrapower v5.5.14

**审查日期**: 2026-03-05
**审查范围**: 全代码库 API 设计
**审查人**: api-reviewer agent

---

## 执行摘要

本次审查覆盖 ultrapower 代码库的所有公共 API，包括：

* 工具接口（MCP Tools）

* Agent 接口

* Hook 接口

* 状态管理 API

* 配置接口

**关键发现**:

* 🔴 严重问题: 3 个

* 🟡 中等问题: 8 个

* 🟢 轻微问题: 12 个

---

## 1. API 契约一致性问题

### 🔴 严重: 类型不一致 - `GenericToolDefinition.handler` 返回值

**位置**: `src/tools/index.ts:35`

**问题描述**:
```typescript
export interface GenericToolDefinition {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
}
```

`handler` 返回类型硬编码为 `{ content: Array<{ type: 'text'; text: string }> }`，但实际工具实现中存在 `isError` 字段（如 `state-tools.ts:89`）。

**影响范围**: 所有自定义工具

**修复建议**:
```typescript
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface GenericToolDefinition {
  handler: (args: unknown) => Promise<ToolResponse>;
}
```

---

### 🔴 严重: Hook 输入类型不完整

**位置**: `src/hooks/bridge-types.ts:9-31`

**问题描述**:
`HookInput` 接口缺少关键字段，与实际 hook 实现不匹配：

* 缺少 `tool_name`（snake_case，实际使用）

* 缺少 `tool_input`（snake_case，实际使用）

* 缺少 `tool_response`（实际使用）

* 缺少 `hook_event_name`（实际使用）

**影响范围**: 所有 hook 桥接逻辑

**修复建议**:
```typescript
export interface HookInput {
  sessionId?: string;
  session_id?: string; // 兼容性
  prompt?: string;
  message?: { content?: string };
  parts?: Array<{ type: string; text?: string }>;
  toolName?: string;
  tool_name?: string; // snake_case 版本
  toolInput?: unknown;
  tool_input?: unknown; // snake_case 版本
  toolOutput?: unknown;
  tool_output?: unknown;
  tool_response?: unknown; // 实际使用
  directory?: string;
  cwd?: string;
  hook_event_name?: string; // 实际使用
}
```

---

### 🟡 中等: 状态工具 session_id 参数语义不清

**位置**: `src/tools/state-tools.ts:76, 252, 382, 546, 693`

**问题描述**:
所有状态工具的 `session_id` 参数描述为：
> "When provided, the tool operates only within that session. When omitted, the tool aggregates legacy state plus all session-scoped state (may include other sessions)."

这个描述自相矛盾：

* "operates only within that session" 暗示隔离

* "aggregates... may include other sessions" 暗示聚合

**影响范围**: 状态管理工具的使用者

**修复建议**:
明确两种模式：
```typescript
session_id: z.string().optional().describe(
  'Session ID for session-scoped operations. ' +
  'When provided: operates ONLY on that session\'s state. ' +
  'When omitted: operates on legacy shared state (pre-session era). ' +
  'Use state_list_active to see all sessions.'
)
```

---

## 2. 向后兼容性问题

### 🟡 中等: 工具名称迁移策略不完整

**位置**: `src/tools/tool-prefix-migration.ts`, `src/tools/index.ts:42-50`

**问题描述**:
工具注册使用 `registerToolWithBothNames` 同时注册旧名称（下划线）和新名称（`ultrapower:` 前缀），但：
1. 没有弃用警告机制
2. 没有迁移时间表文档
3. `skillsTools` 不使用此机制（第 50 行）

**影响范围**: 依赖旧工具名称的用户

**修复建议**:
1. 添加弃用日志：
```typescript
export function registerToolWithBothNames(tool: GenericToolDefinition): GenericToolDefinition[] {
  const legacyTool = {
    ...tool,
    description: `[DEPRECATED] Use ultrapower:${tool.name} instead. ${tool.description}`
  };
  return [tool, legacyTool];
}
```
1. 在 CHANGELOG 中添加迁移指南

---

### 🟡 中等: Agent 别名导出缺少版本标记

**位置**: `src/agents/index.ts:42-45`

**问题描述**:
```typescript
/** @deprecated Use dependency-expert agent instead */
export { documentSpecialistAgent, DOCUMENT_SPECIALIST_PROMPT_METADATA } from './document-specialist.js';
/** @deprecated Use document-specialist agent instead */
export { documentSpecialistAgent as researcherAgent } from './document-specialist.js';
```

第二个注释错误：`researcherAgent` 应该指向 `document-specialist`，但注释说"Use document-specialist"，这是循环引用。

**影响范围**: 使用 `researcherAgent` 的代码

**修复建议**:
```typescript
/** @deprecated Use documentSpecialistAgent instead. researcherAgent is an old alias. */
export { documentSpecialistAgent as researcherAgent } from './document-specialist.js';
```

---

## 3. 错误处理和返回值问题

### 🔴 严重: 状态工具错误处理不一致

**位置**: `src/tools/state-tools.ts`

**问题描述**:
错误处理模式不一致：

* `state_read`: 返回 `isError: true`（第 89, 210 行）

* `state_write`: 返回 `isError: true`（第 279, 295, 362 行）

* `state_clear`: 返回 `isError: true`（第 397, 528 行）

* `state_list_active`: 返回 `isError: true`（第 673 行）

* `state_get_status`: 返回 `isError: true`（第 850 行）

但 `GenericToolDefinition` 接口不包含 `isError` 字段。

**影响范围**: 所有状态工具的错误处理

**修复建议**:
参见问题 1.1 的修复建议，统一工具响应接口。

---

### 🟡 中等: 路径验证错误消息不一致

**位置**: `src/tools/state-tools.ts:84-92, 274-283, 390-399`

**问题描述**:
路径验证失败时，错误消息格式不一致：

* 有些使用中文：`[ultrapower] 错误：无效的状态模式：${mode}`

* 有些使用英文：`Error reading state for ${mode}`

**影响范围**: 用户体验

**修复建议**:
统一使用英文错误消息（国际化标准）：
```typescript
return {
  content: [{
    type: 'text' as const,
    text: `[ultrapower] Error: Invalid state mode: ${mode}`
  }],
  isError: true
};
```

---

### 🟢 轻微: 缺少输入验证 - mode 参数

**位置**: `src/tools/state-tools.ts:78-93`

**问题描述**:
虽然使用 Zod enum 验证 `mode` 参数，但对 `ralplan` 有特殊处理逻辑（第 84 行），这破坏了类型安全。

**影响范围**: 状态工具的类型安全

**修复建议**:
将 `ralplan` 添加到 `MODE_CONFIGS` 或创建单独的工具。

---

## 4. 版本控制策略问题

### 🟡 中等: 缺少 API 版本标识

**位置**: 所有公共 API

**问题描述**:
代码库没有 API 版本控制机制：

* 没有版本号标识

* 没有 API 稳定性标记（stable/beta/experimental）

* 没有破坏性变更策略

**影响范围**: API 演进和用户迁移

**修复建议**:
1. 添加 API 版本常量：
```typescript
// src/version.ts
export const API_VERSION = '1.0.0';
export const API_STABILITY = 'stable' as const;
```

1. 在工具/agent 元数据中添加稳定性标记：
```typescript
export interface GenericToolDefinition {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: unknown) => Promise<ToolResponse>;
  stability?: 'stable' | 'beta' | 'experimental'; // 新增
  since?: string; // 新增，例如 "5.5.0"
}
```

---

### 🟢 轻微: MCP 服务器配置缺少版本约束

**位置**: `src/mcp/servers.ts`

**问题描述**:
MCP 服务器使用 `npx -y` 安装，没有版本锁定：
```typescript
args: ['-y', 'exa-mcp-server']  // 没有版本号
```

**影响范围**: 可重现性和稳定性

**修复建议**:
```typescript
args: ['-y', 'exa-mcp-server@^1.0.0']  // 添加版本约束
```

---

## 5. 公共 API 文档完整性问题

### 🟡 中等: 缺少 JSDoc 注释 - 核心函数

**位置**: `src/index.ts:263-384`

**问题描述**:
`createSisyphusSession` 函数有示例代码但缺少参数文档：

* `options.skipConfigLoad` 没有说明副作用

* `options.skipContextInjection` 没有说明影响范围

* 返回值的 `queryOptions` 结构没有详细说明

**影响范围**: API 使用者理解

**修复建议**:
```typescript
/**
 * Create a Sisyphus orchestration session
 *
 * @param options - Session configuration options
 * @param options.config - Custom configuration (merged with loaded config)
 * @param options.workingDirectory - Working directory (default: process.cwd())
 * @param options.skipConfigLoad - Skip loading config files. WARNING: Disables all user customization.
 * @param options.skipContextInjection - Skip context file injection. WARNING: Agents won't see CLAUDE.md/AGENTS.md.
 * @param options.customSystemPrompt - Custom system prompt addition
 * @param options.apiKey - API key (default: from ANTHROPIC_API_KEY env)
 * @returns Session object with queryOptions, state, config, and helper methods
 */
```

---

### 🟢 轻微: Agent 元数据缺少示例

**位置**: `src/agents/types.ts:43-60`

**问题描述**:
`AgentPromptMetadata` 接口缺少使用示例，字段语义不清：

* `triggers` vs `useWhen` 的区别不明确

* `promptAlias` 的用途不清楚

**影响范围**: Agent 开发者

**修复建议**:
添加 JSDoc 示例：
```typescript
/**
 * Metadata about an agent for dynamic prompt generation
 *
 * @example
 * ```typescript
 * const metadata: AgentPromptMetadata = {
 *   category: 'specialist',
 *   cost: 'EXPENSIVE',
 *   promptAlias: 'arch',
 *   triggers: [
 *     { domain: 'architecture', trigger: 'system design needed' }
 *   ],
 *   useWhen: ['Designing new systems', 'Evaluating trade-offs'],
 *   avoidWhen: ['Simple bug fixes', 'Formatting changes']
 * };
 * ```
 */
```

---

### 🟢 轻微: Hook 类型文档缺失

**位置**: `src/hooks/bridge-types.ts:50-65`

**问题描述**:
`HookType` 枚举缺少每个类型的说明：

* 何时触发

* 预期输入

* 预期输出

**影响范围**: Hook 开发者

**修复建议**:
```typescript
/**
 * Hook types that can be processed
 *
 * - keyword-detector: Triggered on user prompt submit, detects magic keywords
 * - stop-continuation: Triggered on stop button, checks if work should continue
 * - ralph: Ralph loop state management
 * - persistent-mode: Checks persistent execution modes on stop
 * - session-start: Triggered when new session starts
 * - session-end: Triggered when session ends
 * - pre-tool-use: Triggered before tool execution
 * - post-tool-use: Triggered after tool execution
 * - autopilot: Autopilot workflow coordination
 * - subagent-start: Triggered when subagent starts
 * - subagent-stop: Triggered when subagent stops
 * - pre-compact: Triggered before context compaction
 * - setup-init: Triggered during initial setup
 * - setup-maintenance: Triggered during maintenance
 * - permission-request: Triggered when permission is requested
 */
export type HookType = ...
```

---

## 6. 类型安全问题

### 🟡 中等: 过度使用 `unknown` 类型

**位置**: 多处

**问题描述**:
大量使用 `unknown` 类型导致类型安全性降低：

* `GenericToolDefinition.handler: (args: unknown)`（`src/tools/index.ts:35`）

* `HookInput.toolInput?: unknown`（`src/hooks/bridge-types.ts:26`）

* `state: z.record(z.string(), z.unknown())`（`src/tools/state-tools.ts:250`）

**影响范围**: 类型检查和 IDE 支持

**修复建议**:
使用泛型约束：
```typescript
export interface GenericToolDefinition<TInput = Record<string, unknown>> {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: TInput) => Promise<ToolResponse>;
}
```

---

### 🟢 轻微: 状态数据类型过于宽泛

**位置**: `src/features/state-manager/types.ts`

**问题描述**:
`StateData` 类型定义为 `Record<string, unknown>`，没有基础结构约束。

**影响范围**: 状态管理的类型安全

**修复建议**:
```typescript
export interface BaseStateData {
  active?: boolean;
  _meta?: {
    mode?: string;
    sessionId?: string | null;
    updatedAt?: string;
    updatedBy?: string;
    heartbeatAt?: string;
  };
}

export type StateData = BaseStateData & Record<string, unknown>;
```

---

## 7. 命名一致性问题

### 🟢 轻微: camelCase vs snake_case 混用

**位置**: 多处

**问题描述**:
API 中同时使用 camelCase 和 snake_case：

* Hook 输入使用 snake_case：`tool_name`, `session_id`

* TypeScript 接口使用 camelCase：`toolName`, `sessionId`

* 工具参数使用 snake_case：`session_id`, `working_directory`

**影响范围**: API 一致性

**修复建议**:
制定命名规范：

* 内部 TypeScript 代码：camelCase

* 外部 API（工具参数、Hook 输入）：snake_case

* 在边界处进行转换

---

### 🟢 轻微: Agent 名称不一致

**位置**: `src/agents/index.ts`

**问题描述**:
Agent 导出名称不一致：

* 有些使用完整名称：`architectAgent`

* 有些使用缩写：`SISYPHUS_JUNIOR_PROMPT_METADATA`（应该是 `EXECUTOR_PROMPT_METADATA`）

**影响范围**: 代码可读性

**修复建议**:
统一命名模式：
```typescript
export { executorAgent, EXECUTOR_PROMPT_METADATA } from './executor.js';
// 保留别名以兼容
export { EXECUTOR_PROMPT_METADATA as SISYPHUS_JUNIOR_PROMPT_METADATA } from './executor.js';
```

---

## 8. 安全性问题

### 🟢 轻微: 路径验证在多处重复

**位置**: `src/tools/state-tools.ts:84-92, 274-283, 390-399`

**问题描述**:
路径验证逻辑在每个工具中重复，容易遗漏：
```typescript
if (mode !== 'ralplan') {
  try {
    assertValidMode(mode);
  } catch { ... }
}
```

**影响范围**: 安全性维护

**修复建议**:
创建统一的验证中间件：
```typescript
function validateModeParam(mode: string): void {
  if (mode !== 'ralplan') {
    assertValidMode(mode);
  }
}
```

---

## 9. 性能问题

### 🟢 轻微: 状态缓存键不包含 session_id

**位置**: `src/features/state-manager/index.ts:89, 165`

**问题描述**:
状态缓存使用文件路径作为键，但 session-scoped 状态可能有相同的文件路径模式，导致缓存冲突。

**影响范围**: 多会话场景下的缓存正确性

**修复建议**:
```typescript
const cacheKey = sessionId
  ? `${standardPath}:${sessionId}`
  : standardPath;
const cached = stateCache.get(cacheKey);
```

---

## 10. 可扩展性问题

### 🟡 中等: 工具注册机制不支持动态加载

**位置**: `src/tools/index.ts:42-51`

**问题描述**:
工具列表硬编码，不支持插件式扩展：
```typescript
export const allCustomTools: GenericToolDefinition[] = [
  ...(lspTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  // ...
];
```

**影响范围**: 第三方工具集成

**修复建议**:
```typescript
export class ToolRegistry {
  private tools = new Map<string, GenericToolDefinition>();

  register(tool: GenericToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getAll(): GenericToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();
// 初始化时注册内置工具
lspTools.forEach(t => toolRegistry.register(t));
```

---

## 优先级修复建议

### P0 - 立即修复（破坏性问题）

1. ✅ 修复 `GenericToolDefinition.handler` 返回类型（问题 1.1）
2. ✅ 完善 `HookInput` 接口（问题 1.2）
3. ✅ 统一状态工具错误处理（问题 3.1）

### P1 - 短期修复（兼容性问题）

1. ✅ 明确 `session_id` 参数语义（问题 1.3）
2. ✅ 添加工具弃用警告（问题 2.1）
3. ✅ 修复 Agent 别名注释（问题 2.2）
4. ✅ 统一错误消息语言（问题 3.2）

### P2 - 中期改进（质量提升）

1. ✅ 添加 API 版本控制（问题 4.1）
2. ✅ 完善核心函数文档（问题 5.1）
3. ✅ 减少 `unknown` 类型使用（问题 6.1）

### P3 - 长期优化（架构改进）

1. ✅ 实现工具注册机制（问题 10.1）
2. ✅ 统一命名规范（问题 7.1, 7.2）

---

## 总结

ultrapower 的 API 设计整体结构良好，但存在以下主要问题：

**优势**:

* ✅ 使用 Zod 进行运行时验证

* ✅ 路径遍历防护机制完善

* ✅ 状态管理支持会话隔离

**需要改进**:

* ❌ 类型定义不完整，存在契约不一致

* ❌ 缺少版本控制和稳定性标记

* ❌ 错误处理模式不统一

* ❌ 文档覆盖率不足

**建议行动**:
1. 优先修复 P0 问题，确保 API 契约正确
2. 建立 API 变更审查流程
3. 添加 API 集成测试覆盖
4. 编写 API 使用指南和迁移文档

---

**审查完成时间**: 2026-03-05 14:51:36 UTC
