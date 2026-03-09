# 后端架构与 MCP 服务分析报告

## 1. 架构概览

ultrapower 采用**分层架构 + Hook 驱动**的后端设计：

```
┌─────────────────────────────────────────┐
│   Claude Code (Host Environment)        │
└──────────────┬──────────────────────────┘
               │ Hook Events
┌──────────────▼──────────────────────────┐
│   Hook Bridge Layer (bridge.ts)         │
│   - 15 种 Hook 类型路由                  │
│   - 输入消毒 (bridge-normalize.ts)       │
│   - 安全白名单过滤                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   MCP Server Layer                       │
│   ├─ OMC Tools Server (18 tools)        │
│   ├─ Codex Server (ask_codex)           │
│   └─ Gemini Server (ask_gemini)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   Tool Implementation Layer              │
│   ├─ LSP Tools (12 tools)               │
│   ├─ AST Tools (2 tools)                │
│   ├─ Python REPL (1 tool)               │
│   ├─ State Management (6 tools)         │
│   ├─ Notepad/Memory (7 tools)           │
│   └─ Trace Tools (2 tools)              │
└──────────────────────────────────────────┘
```

## 2. Hook Bridge 机制

### 2.1 核心职责

**文件**: `src/hooks/bridge.ts` (1227 行)

Hook Bridge 是 shell 脚本与 TypeScript 逻辑的桥接层：

```typescript
// Shell 调用方式
echo "$INPUT" | node ~/.claude/omc/hook-bridge.mjs --hook=keyword-detector
```

**15 种 Hook 类型**:
1. `keyword-detector` - 魔法关键词检测 (ralph, ultrawork, autopilot)
2. `stop-continuation` - 停止延续检查
3. `ralph` - Ralph 循环执行
4. `persistent-mode` - 持久化模式管理
5. `session-start` - 会话启动恢复
6. `pre-tool-use` - 工具调用前拦截
7. `post-tool-use` - 工具调用后处理
8. `autopilot` - Autopilot 阶段管理
9. `session-end` - 会话结束清理
10. `subagent-start` - 子 Agent 启动追踪
11. `subagent-stop` - 子 Agent 停止追踪
12. `pre-compact` - 上下文压缩前处理
13. `setup-init` - 初始化设置
14. `setup-maintenance` - 维护设置
15. `permission-request` - 权限请求处理

### 2.2 输入消毒机制

**文件**: `src/hooks/bridge-normalize.ts` (347 行)

**安全策略**:

* **敏感 Hook 白名单**: `permission-request`, `setup-init`, `setup-maintenance`, `session-end`

* **Zod 结构验证**: 所有输入经过 schema 验证

* **snake_case → camelCase 规范化**: Claude Code 发送 snake_case，内部使用 camelCase

* **未知字段处理**:
  - 敏感 Hook: 丢弃未知字段并警告
  - 普通 Hook: 通过但记录 debug 日志

```typescript
// 敏感 Hook 严格白名单
const STRICT_WHITELIST: Record<string, string[]> = {
  'permission-request': ['sessionId', 'toolName', 'toolInput', 'directory',
                         'permission_mode', 'tool_use_id', 'transcript_path'],
  'session-end': ['sessionId', 'directory'],
};
```

**快速路径优化**:

* 检测已规范化的 camelCase 输入，跳过 Zod 解析

* 敏感 Hook 强制走完整验证流程

### 2.3 安全防护

**pkill -f 自杀检测** (L741-759):
```typescript
if (PKILL_F_FLAG_PATTERN.test(command)) {
  return {
    continue: true,
    message: "WARNING: `pkill -f` matches its own process..."
  };
}
```

**后台进程限流** (L764-788):
```typescript
const maxBgTasks = config.permissions?.maxBackgroundTasks ?? 5;
if (runningCount >= maxBgTasks) {
  return { continue: false, reason: "Background process limit reached" };
}
```

**委派模型强制** (L828-832):

* 强制 Task 调用必须指定 `model` 参数

* 防止默认使用昂贵模型

## 3. MCP 服务器架构

### 3.1 OMC Tools Server

**文件**: `src/mcp/omc-tools-server.ts` (167 行)

**工具分类** (18 个工具):
```typescript
const TOOL_CATEGORIES = {
  LSP: 'lsp',           // 12 tools
  AST: 'ast',           // 2 tools
  PYTHON: 'python',     // 1 tool
  STATE: 'state',       // 6 tools
  NOTEPAD: 'notepad',   // 3 tools
  MEMORY: 'memory',     // 4 tools
  TRACE: 'trace',       // 2 tools
  SKILLS: 'skills',     // 2 tools
};
```

**动态禁用机制**:
```typescript
// 环境变量: OMC_DISABLE_TOOLS=lsp,python-repl,project-memory
const disabledGroups = parseDisabledGroups();
const enabledTools = allTools.filter(t =>
  !t.category | | !disabledGroups.has(t.category)
);
```

**MCP 命名空间**: `mcp__t__<tool_name>`

### 3.2 Codex MCP Server

**文件**: `src/mcp/codex-server.ts` (113 行)

**核心工具**: `ask_codex`

* **推荐角色**: architect, planner, critic, analyst, code-reviewer, security-reviewer, tdd-guide

* **默认模型**: gpt-5.3-codex

* **推理级别**: minimal, low, medium, high, xhigh

* **后台执行**: 支持 `background: true`

**任务管理工具**:

* `wait_for_job` - 阻塞等待任务完成

* `check_job_status` - 非阻塞状态检查

* `kill_job` - 终止运行中任务

* `list_jobs` - 列出任务列表

**MCP 命名空间**: `mcp__x__<tool_name>`

### 3.3 Gemini MCP Server

**文件**: `src/mcp/gemini-server.ts` (116 行)

**核心工具**: `ask_gemini`

* **推荐角色**: designer, writer, vision

* **默认模型**: gemini-3-pro-preview

* **回退链**: gemini-3-pro-preview → gemini-3-flash-preview → gemini-2.5-pro → gemini-2.5-flash

* **上下文窗口**: 1M tokens (适合大规模设计审查)

**MCP 命名空间**: `mcp__g__<tool_name>`

## 4. 工具实现层

### 4.1 LSP Tools (12 工具)

**文件**: `src/tools/lsp-tools.ts`

**核心能力**:
1. `lsp_hover` - 类型信息和文档
2. `lsp_goto_definition` - 跳转到定义
3. `lsp_find_references` - 查找引用
4. `lsp_document_symbols` - 文档符号大纲
5. `lsp_workspace_symbols` - 工作区符号搜索
6. `lsp_diagnostics` - 文件诊断
7. `lsp_diagnostics_directory` - 项目级诊断 (tsc --noEmit 优先)
8. `lsp_prepare_rename` - 重命名检查
9. `lsp_rename` - 符号重命名
10. `lsp_code_actions` - 代码动作列表
11. `lsp_code_action_resolve` - 代码动作详情
12. `lsp_servers` - 列出可用语言服务器

**客户端管理**:
```typescript
await lspClientManager.runWithClientLease(filePath, async (client) => {
  return client.hover(file, line - 1, character);
});
```

* 租约机制防止空闲驱逐

* 自动服务器启动和连接管理

### 4.2 AST Tools (2 工具)

**文件**: `src/tools/ast-tools.ts`

**核心能力**:
1. `ast_grep_search` - AST 模式搜索
2. `ast_grep_replace` - AST 结构化替换

**元变量支持**:

* `$NAME` - 匹配单个 AST 节点

* `$$$ARGS` - 匹配多个节点

**支持语言** (25+):
javascript, typescript, tsx, python, ruby, go, rust, java, kotlin, swift, c, cpp, csharp, html, css, json, yaml

**优雅降级**:
```typescript
// 使用 createRequire (CJS) 而非 dynamic import (ESM)
// 因为 ESM 不遵守 NODE_PATH
const require = createRequire(import.meta.url);
sgModule = require("@ast-grep/napi");
```

### 4.3 Python REPL (1 工具)

**文件**: `src/tools/python-repl/index.ts`

**核心能力**:

* **持久化命名空间**: 变量在调用间保持

* **会话锁**: 防止并发冲突

* **结构化输出**: `[OBJECTIVE]`, `[DATA]`, `[FINDING]`, `[STAT:*]`, `[LIMITATION]`

* **内存追踪**: RSS/VMS 监控

* **超时处理**: 默认 5 分钟

**动作**:

* `execute` - 执行代码

* `reset` - 清空命名空间

* `get_state` - 获取状态

* `interrupt` - 中断执行

### 4.4 State Management (6 工具)

**文件**: `src/tools/state-tools.ts`

**工具列表**:
1. `state_read` - 读取模式状态
2. `state_write` - 写入模式状态
3. `state_clear` - 清除模式状态
4. `state_list_active` - 列出活跃模式
5. `state_get_status` - 获取详细状态
6. (隐含) 状态文件管理

**支持模式** (8 种):
autopilot, ultrapilot, team, pipeline, ralph, ultrawork, ultraqa, swarm

**状态路径**:

* 会话级: `.omc/state/sessions/{sessionId}/{mode}-state.json`

* 全局级: `.omc/state/{mode}-state.json`

### 4.5 Notepad & Memory (7 工具)

**Notepad** (3 工具) - 会话记忆:

* `notepad_read` - 读取 (all/priority/working/manual)

* `notepad_write_priority` - 写入优先级上下文 (<500 字符)

* `notepad_write_working` - 写入工作记忆 (7 天自动清理)

* `notepad_write_manual` - 写入手动记忆 (永久保存)

* `notepad_prune` - 清理旧条目

* `notepad_stats` - 统计信息

**Memory** (4 工具) - 项目记忆:

* `mem_read` - 读取项目记忆

* `mem_write` - 写入项目记忆

* `mem_add_note` - 添加分类笔记

* `mem_add_directive` - 添加用户指令

**存储位置**:

* Notepad: `{worktree}/.omc/notepad.md`

* Memory: `{worktree}/.omc/project-memory.json`

### 4.6 Trace Tools (2 工具)

**工具列表**:
1. `trace_timeline` - 时间线视图
2. `trace_summary` - 聚合统计

**追踪事件**:

* Hooks 执行

* Skills 激活

* Agents 调用

* Keywords 检测

* Tools 使用

* Modes 转换

## 5. 安全架构

### 5.1 路径遍历防护

**文件**: `src/lib/validateMode.ts` (111 行)

**防护策略**:
```typescript
export const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm'
] as const;

export function assertValidMode(mode: unknown): ValidMode {
  if (!validateMode(mode)) {
    // 检测路径遍历尝试
    if (mode.includes('..') | | mode.includes('/') | | mode.includes('\\')) {
      auditLogger.log({
        action: 'path_validation_failed',
        metadata: { reason: 'path_traversal_attempt' }
      });
      throw new Error("Path traversal attempt detected");
    }
  }
  return mode;
}
```

**使用规范**:
```typescript
// ✅ 安全
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;

// ❌ 危险 - 路径遍历风险
const path = `.omc/state/${mode}-state.json`;
```

### 5.2 插件安全扫描

**文件**: `src/lib/plugin-security.ts` (96 行)

**危险模式检测**:
```typescript
const DANGEROUS_PATTERNS = [
  { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, label: 'child_process' },
  { pattern: /\bexecSync\s*\( | \bspawnSync\s*\(/, label: 'shell execution' },
  { pattern: /\beval\s*\(/, label: 'eval' },
  { pattern: /\bnew\s+Function\s*\(/, label: 'Function constructor' },
  { pattern: /\bprocess\.env\b/, label: 'process.env access' },
  { pattern: /\bfs\.(?:writeFile | unlink | rmdir | rm)\b/, label: 'destructive fs' },
];
```

**扫描流程**:
1. 递归收集 JS/TS/MJS 文件 (最大深度 5)
2. 逐行扫描 + 全文扫描
3. 生成安全报告 (violations 列表)

**沙箱策略**: Worker Threads (Node.js 内置)

### 5.3 审计日志

**文件**: `src/audit/logger.ts` (97 行)

**日志结构**:
```typescript
interface AuditEntry {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata?: any;
  signature?: string;  // HMAC-SHA256 签名
}
```

**防篡改机制**:

* HMAC-SHA256 签名每条日志

* 密钥派生: `OMC_AUDIT_SECRET` 环境变量

* 日志轮转: 10MB 自动轮转

**验证接口**:
```typescript
await auditLogger.verify();
// => { valid: 1234, invalid: 0 }
```

**存储位置**: `.omc/logs/audit.log`

## 6. API 设计模式

### 6.1 工具定义接口

```typescript
interface ToolDefinition<T extends z.ZodRawShape> {
  name: string;
  description: string;
  schema: T;
  handler: (args: z.infer<z.ZodObject<T>>) =>
    Promise<{ content: Array<{ type: "text"; text: string }> }>;
}
```

**统一返回格式**:
```typescript
{
  content: [{ type: 'text', text: '...' }],
  isError?: boolean
}
```

### 6.2 错误处理策略

**LSP 工具**:
```typescript
async function withLspClient<T>(filePath, operation, fn) {
  try {
    const serverConfig = getServerForFile(filePath);
    if (!serverConfig) {
      return { content: [{ type: 'text',
        text: 'No language server available...' }] };
    }
    return await lspClientManager.runWithClientLease(filePath, fn);
  } catch (error) {
    return { content: [{ type: 'text',
      text: `Error in ${operation}: ${error.message}` }] };
  }
}
```

**Hook Bridge**:
```typescript
try {
  switch (hookType) {
    case "keyword-detector": return await processKeywordDetector(input);
    // ...
  }
} catch (error) {
  console.error(`[hook-bridge] Error in ${hookType}:`, error);
  // 权限请求失败关闭 (安全默认)
  if (hookType === "permission-request") {
    return { continue: false };
  }
  return { continue: true };
}
```

### 6.3 懒加载模式

**Hook 模块懒加载**:
```typescript
case "ralph": {
  const { createRalphLoopHook } = await import("./ralph/index.js");
  const hook = createRalphLoopHook(directory);
  hook.startLoop(sessionId, promptText);
  break;
}
```

**AST 模块懒加载**:
```typescript
let sgModule: typeof import("@ast-grep/napi") | null = null;
async function getSgModule() {
  if (!sgModule) {
    const require = createRequire(import.meta.url);
    sgModule = require("@ast-grep/napi");
  }
  return sgModule;
}
```

**优势**:

* 减少启动时间

* 按需加载依赖

* 优雅降级 (模块不可用时返回错误而非崩溃)

## 7. 性能优化

### 7.1 缓存机制

**OMC_SKIP_HOOKS 缓存**:
```typescript
let _cachedSkipHooks: string[] | null = null;
function getSkipHooks(): string[] {
  if (_cachedSkipHooks === null) {
    _cachedSkipHooks = process.env.OMC_SKIP_HOOKS?.split(",") ?? [];
  }
  return _cachedSkipHooks;
}
```

**快速路径检测**:
```typescript
function isAlreadyCamelCase(obj: Record<string, unknown>): boolean {
  let hasMarker = false;
  for (const marker of CAMEL_CASE_MARKERS) {
    if (marker in obj) { hasMarker = true; break; }
  }
  if (!hasMarker) return false;
  return !hasSnakeCaseKeys(obj);
}
```

### 7.2 LSP 客户端租约

```typescript
await lspClientManager.runWithClientLease(filePath, async (client) => {
  // 操作期间客户端不会被空闲驱逐
  return await client.hover(file, line, character);
});
```

### 7.3 后台任务管理

**限流机制**:

* 默认最大 5 个并发后台任务

* 可通过 `OMC_MAX_BACKGROUND_TASKS` 配置

* 超限时阻止新任务启动

**任务追踪**:
```typescript
addBackgroundTask(taskId, description, subagent_type, directory);
getRunningTaskCount(directory);
```

## 8. 关键技术决策

### 8.1 为什么使用 Hook Bridge?

**问题**: Claude Code 是 shell 环境，复杂逻辑难以用 bash 实现

**解决方案**: Hook Bridge 作为 shell → TypeScript 桥接层

* Shell 脚本读取 stdin，传递给 Node.js

* TypeScript 处理复杂逻辑，返回 JSON

* Shell 脚本解析 JSON，注入消息或阻止执行

### 8.2 为什么需要输入消毒?

**威胁模型**:

* 恶意输入可能包含路径遍历 (`../../etc/passwd`)

* 未知字段可能触发意外行为

* 敏感 Hook (权限请求) 需要严格验证

**防御策略**:

* Zod 结构验证

* 敏感 Hook 白名单

* snake_case 规范化

* 路径遍历检测

### 8.3 为什么分离 Codex 和 Gemini?

**设计理念**: 不同模型擅长不同任务

**Codex 优势**:

* 架构审查

* 规划验证

* 批判性分析

* 代码/安全审查

**Gemini 优势**:

* UI/UX 设计审查

* 大上下文任务 (1M tokens)

* 视觉分析

* 文档生成

**实现**: 独立 MCP 服务器 + 统一任务管理接口

### 8.4 为什么使用 MCP?

**Model Context Protocol 优势**:

* 标准化工具接口

* 进程内服务器 (低延迟)

* 命名空间隔离 (`mcp__t__`, `mcp__x__`, `mcp__g__`)

* 动态工具禁用

**架构**:
```typescript
export const omcToolsServer = createSdkMcpServer({
  name: "t",
  version: "1.0.0",
  tools: sdkTools
});
```

## 9. 架构优势

### 9.1 安全性

✅ **多层防护**:

* 路径遍历防护 (assertValidMode)

* 输入消毒 (bridge-normalize)

* 插件静态分析 (plugin-security)

* 审计日志 (HMAC 签名)

✅ **失败安全**:

* 权限请求默认拒绝

* 敏感 Hook 严格验证

* 错误不阻塞执行 (除权限请求)

### 9.2 可扩展性

✅ **模块化设计**:

* Hook 类型易于添加

* 工具分类清晰

* MCP 服务器独立

✅ **动态配置**:

* `OMC_DISABLE_TOOLS` 禁用工具组

* `OMC_SKIP_HOOKS` 跳过 Hook

* 环境变量驱动

### 9.3 性能

✅ **优化策略**:

* 懒加载模块

* 缓存环境变量

* 快速路径检测

* LSP 客户端租约

✅ **资源管理**:

* 后台任务限流

* 日志自动轮转

* 空闲客户端驱逐

### 9.4 可观测性

✅ **追踪能力**:

* Trace 工具 (timeline + summary)

* 审计日志 (防篡改)

* Agent 仪表盘

* 会话重放

✅ **调试支持**:

* `OMC_DEBUG` 环境变量

* 详细错误消息

* LSP 服务器状态

## 10. 潜在改进点

### 10.1 性能优化

🔧 **LSP 客户端池化**:

* 当前: 每个文件类型一个客户端

* 改进: 客户端池 + 连接复用

🔧 **Hook 输入缓存**:

* 当前: 每次调用都解析 JSON

* 改进: 缓存最近 N 次输入

### 10.2 安全增强

🔧 **沙箱隔离**:

* 当前: Worker Threads (同进程)

* 改进: VM2 或 isolated-vm (真隔离)

🔧 **审计日志加密**:

* 当前: HMAC 签名

* 改进: AES-256 加密 + 签名

### 10.3 可靠性

🔧 **Hook 重试机制**:

* 当前: 失败即返回

* 改进: 指数退避重试

🔧 **LSP 服务器健康检查**:

* 当前: 启动时检查

* 改进: 定期心跳 + 自动重启

### 10.4 可观测性

🔧 **结构化日志**:

* 当前: console.error

* 改进: Winston/Pino + 日志级别

🔧 **性能指标**:

* 当前: 无

* 改进: Prometheus metrics (Hook 延迟、工具调用次数)

---

**分析完成时间**: 2026-03-05
**分析人员**: backend-analyst
**文档版本**: 1.0
