# Stage 5: Tools & Code Intelligence

## 概览

ultrapower 提供 35+ 工具，分为 4 大类：LSP（12 工具）、AST（2 工具）、State（5 工具）、Memory（6 工具）+ Python REPL。

## 1. 工具分类架构

### 1.1 LSP 工具（12 个）- IDE 级代码智能

**核心能力：**

* `lsp_hover` - 类型信息和文档

* `lsp_goto_definition` - 跳转到定义

* `lsp_find_references` - 查找所有引用

* `lsp_document_symbols` - 文件符号大纲

* `lsp_workspace_symbols` - 工作区符号搜索

* `lsp_diagnostics` - 错误/警告/提示

* `lsp_diagnostics_directory` - 项目级诊断（tsc/LSP）

* `lsp_rename` - 跨文件重命名

* `lsp_prepare_rename` - 重命名可行性检查

* `lsp_code_actions` - 重构/快速修复

* `lsp_code_action_resolve` - 代码操作详情

* `lsp_servers` - 语言服务器状态

**语言支持（18 种）：**
```typescript
TypeScript/JavaScript, Python, Rust, Go, C/C++, Java,
JSON, HTML, CSS, YAML, PHP, Ruby, Lua, Kotlin,
Elixir, C#, Dart, Swift
```

**关键设计：**

* 客户端管理器：`lspClientManager.runWithClientLease()` 防止空闲驱逐

* 自动检测：基于文件扩展名路由到对应 LSP 服务器

* 安装提示：未安装服务器时提供安装命令

* 诊断策略：`tsc --noEmit`（首选）→ LSP 迭代（回退）

### 1.2 AST 工具（2 个）- 结构化代码转换

**工具：**

* `ast_grep_search` - AST 模式匹配搜索

* `ast_grep_replace` - AST 模式替换（默认 dryRun）

**元变量系统：**
```javascript
$NAME      // 匹配单个 AST 节点
$$$ARGS    // 匹配多个节点

// 示例
Pattern:     "console.log($MSG)"
Replacement: "logger.info($MSG)"
```

**支持语言（17 种）：**
```
javascript, typescript, tsx, python, ruby, go, rust,
java, kotlin, swift, c, cpp, csharp, html, css, json, yaml
```

**安全机制：**

* 优雅降级：`@ast-grep/napi` 不可用时返回友好错误

* 双重解析：CJS `createRequire()` + ESM `import()` 回退

* 文件过滤：跳过 `node_modules/.git/dist/__pycache__`

### 1.3 State 工具（5 个）- 执行模式状态管理

**工具：**

* `state_read` - 读取模式状态

* `state_write` - 写入/更新状态

* `state_clear` - 清除状态

* `state_list_active` - 列出活跃模式

* `state_get_status` - 详细状态信息

**支持模式（9 种）：**
```
autopilot, ultrapilot, swarm, pipeline, team,
ralph, ultrawork, ultraqa, ralplan
```

**会话隔离：**
```typescript
// 无 session_id：聚合所有会话（遗留路径 + 所有会话）
state_read({ mode: "ralph" })

// 有 session_id：仅操作该会话
state_read({ mode: "ralph", session_id: "abc123" })
```

**路径结构：**
```
.omc/state/ralph-state.json              // 遗留共享路径
.omc/state/sessions/{sessionId}/ralph-state.json  // 会话隔离
.omc/state/swarm.db                      // Swarm 使用 SQLite
```

**安全防护：**

* `assertValidMode()` - 路径遍历防护（P0 规则）

* `validateSessionId()` - 会话 ID 白名单校验

* Swarm 特殊处理：只读，不支持 JSON 写入

### 1.4 Memory 工具（6 个）- 双层记忆系统

#### Notepad（会话记忆，`.omc/notepad.md`）

**工具：**

* `notepad_read` - 读取（all/priority/working/manual）

* `notepad_write_priority` - 写入优先上下文（≤500 字符，会话启动加载）

* `notepad_write_working` - 添加工作记忆（带时间戳，7 天自动清理）

* `notepad_write_manual` - 添加手动条目（永久保存）

* `notepad_prune` - 清理旧条目

* `notepad_stats` - 统计信息

**三层结构：**
```markdown

## Priority Context (≤500 chars)

始终加载，用于关键上下文

## Working Memory

* [2026-03-05 01:30] 条目 1（7 天后自动清理）

* [2026-03-04 12:15] 条目 2

## MANUAL

* 永久条目 1（永不自动清理）

* 永久条目 2
```

#### Project Memory（持久记忆，`.omc/project-memory.json`）

**工具：**

* `project_memory_read` - 读取（all/techStack/build/conventions/structure/notes/directives）

* `project_memory_write` - 写入/合并

* `project_memory_add_note` - 添加分类笔记

* `project_memory_add_directive` - 添加用户指令

**数据结构：**
```typescript
{
  version: "1.0.0",
  projectRoot: "/path/to/project",
  lastScanned: 1709600000000,
  techStack: { languages: [], frameworks: [], tools: [] },
  build: { commands: {}, scripts: {} },
  conventions: { naming: {}, patterns: [] },
  structure: { entryPoints: [], keyDirs: [] },
  customNotes: [{ category: "build", content: "...", timestamp }],
  userDirectives: [{ directive: "...", priority: "high", source: "explicit" }]
}
```

### 1.5 Python REPL（1 个）- 持久化数据分析

**工具：** `python_repl`

**操作：**

* `execute` - 执行代码（变量跨调用持久化）

* `reset` - 清空命名空间

* `get_state` - 内存使用和变量列表

* `interrupt` - 中断长时间运行

**特性：**

* 会话锁：防止并发访问冲突

* 结构化输出：`[OBJECTIVE]`, `[DATA]`, `[FINDING]`, `[STAT:*]`, `[LIMITATION]`

* 内存跟踪：RSS/VMS 监控

* 超时处理：默认 5 分钟

**适用场景：**
```python

# ✅ 使用 python_repl

* 多步骤分析（状态持久化）

* 大数据集（避免重复加载）

* 迭代式 ML 训练

# ❌ 使用 Bash heredoc

* 单次脚本执行

* 无状态计算
```

## 2. LSP 集成深度分析

### 2.1 客户端生命周期管理

**核心机制：**
```typescript
// 租约保护：防止操作期间客户端被驱逐
lspClientManager.runWithClientLease(filePath, async (client) => {
  return await client.hover(file, line, character);
});
```

**驱逐策略：**

* 空闲超时：客户端闲置时自动关闭

* 租约计数：操作期间引用计数 > 0，阻止驱逐

* 跨平台生成：Win32 特殊处理（`shell: true` 用于 `.cmd` 文件）

### 2.2 服务器配置系统

**静态配置表：**
```typescript
LSP_SERVERS = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', ...],
    installHint: 'npm install -g typescript-language-server typescript'
  },
  // ... 18 种语言
}
```

**安全检查：**
```typescript
// 使用 execFileSync（参数数组）而非 execSync（shell 字符串）
// 防止 shell 注入
execFileSync('which', [command], { stdio: 'ignore' });
```

### 2.3 诊断聚合策略

**两阶段策略：**
1. **tsc --noEmit**（首选）
   - 完整类型检查
   - 项目级错误
   - 需要 `tsconfig.json`

1. **LSP 迭代**（回退）
   - 逐文件打开
   - 等待诊断发布（500ms）
   - 聚合所有文件结果

**输出格式：**
```
Strategy: tsc
Summary: 3 errors, 5 warnings in 42 files

src/index.ts:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.
src/utils.ts:25:10 - warning TS6133: 'unused' is declared but never used.
```

## 3. AST 操作机制

### 3.1 模式匹配引擎

**元变量语义：**
```javascript
// $VAR - 单节点匹配
"function $NAME($$$ARGS) { $$$BODY }"
// 匹配：function foo(a, b) { return a + b; }
// 捕获：$NAME=foo, $$$ARGS=[a,b], $$$BODY=[return a+b;]

// 精确匹配
"$X === null"  // 仅匹配 null 相等检查
"$X == null"   // 匹配 null/undefined 松散检查
```

**搜索流程：**
1. 按语言过滤文件（扩展名映射）
2. 解析为 AST（`sg.parse(lang, content)`）
3. 模式匹配（`root.findAll(pattern)`）
4. 格式化输出（带上下文行）

### 3.2 结构化替换

**替换流程：**
```typescript
// 1. 查找所有匹配
const matches = root.findAll(pattern);

// 2. 提取元变量
for (const metaVar of ['$NAME', '$$$ARGS']) {
  const captured = match.getMatch(varName);
  replacement = replacement.replace(metaVar, captured.text());
}

// 3. 反向应用编辑（避免偏移问题）
edits.sort((a, b) => b.start - a.start);
for (const edit of edits) {
  newContent = content.slice(0, edit.start)
             + edit.replacement
             + content.slice(edit.end);
}
```

**安全默认：**

* `dryRun: true` - 默认仅预览

* 最多显示 50 个变更

* 原子写入（`writeFileSync` 一次性）

## 4. 记忆机制对比

| 维度 | Notepad | Project Memory |
| ------ | --------- | ---------------- |
| **位置** | `.omc/notepad.md` | `.omc/project-memory.json` |
| **生命周期** | 会话级（7 天自动清理） | 项目级（永久） |
| **结构** | Markdown 三段式 | JSON 结构化 |
| **用途** | 临时上下文、工作记忆 | 技术栈、约定、指令 |
| **加载时机** | Priority 每次启动 | 按需读取 |
| **容量限制** | Priority ≤500 字符 | 无硬限制 |
| **清理策略** | Working 7 天，Manual 永久 | 无自动清理 |

**协同使用模式：**
```
Notepad Priority: "当前 sprint 目标：实现用户认证"
Project Memory Directive: "始终使用 JWT 进行认证"

Notepad Working: "[2026-03-05] 发现 login API 性能问题"
Project Memory Note: { category: "performance", content: "login 端点需要缓存" }
```

## 5. 工具选择决策树

```
需要代码智能？
├─ 是 → 类型/定义/引用？
│   ├─ 是 → LSP 工具（hover/definition/references）
│   └─ 否 → 结构化搜索/替换？
│       ├─ 是 → AST 工具（ast_grep_search/replace）
│       └─ 否 → 文本搜索（Grep）
│
└─ 否 → 需要状态管理？
    ├─ 是 → 执行模式状态？
    │   ├─ 是 → State 工具（state_read/write/clear）
    │   └─ 否 → 数据分析？
    │       ├─ 是 → Python REPL（持久化变量）
    │       └─ 否 → Memory 工具
    │
    └─ 否 → 需要记忆？
        ├─ 会话级 → Notepad（priority/working/manual）
        └─ 项目级 → Project Memory（techStack/directives）
```

## 6. 关键实现模式

### 6.1 优雅降级

```typescript
// AST 工具：模块不可用时返回友好错误
if (!sgModule) {
  return {
    content: [{
      type: "text",
      text: "@ast-grep/napi is not available. Install: npm install -g @ast-grep/napi"
    }]
  };
}
```

### 6.2 路径遍历防护

```typescript
// State 工具：P0 安全规则
if (mode !== 'ralplan') {
  assertValidMode(mode);  // 白名单校验
}
const root = validateWorkingDirectory(workingDirectory);
const statePath = resolveStatePath(mode, root);  // 边界内路径
```

### 6.3 会话隔离

```typescript
// 无 session_id：聚合所有会话（警告泄漏风险）
// 有 session_id：仅操作该会话
if (sessionId) {
  statePath = resolveSessionStatePath(mode, sessionId, root);
} else {
  console.warn("No session_id: may leak across parallel sessions");
  statePath = resolveStatePath(mode, root);
}
```

### 6.4 原子写入

```typescript
// 所有写入操作使用原子写入
atomicWriteJsonSync(statePath, data);
// 实现：写入临时文件 → 重命名（原子操作）
```

## 7. 性能优化

### 7.1 LSP 客户端池化

* 按文件类型复用客户端

* 空闲驱逐释放资源

* 租约机制防止操作期间驱逐

### 7.2 AST 搜索限制

* 最大文件数：1000

* 最大结果数：20（可配置到 100）

* 跳过常见非源码目录

### 7.3 诊断等待优化

```typescript
// LSP 诊断：等待 500ms 让服务器发布诊断
await new Promise(resolve => setTimeout(resolve, 500));
```

## 8. 扩展点

### 8.1 新增 LSP 服务器

```typescript
// src/tools/lsp/servers.ts
LSP_SERVERS.newlang = {
  name: 'New Language Server',
  command: 'newlang-ls',
  args: ['--stdio'],
  extensions: ['.nl'],
  installHint: 'npm install -g newlang-ls'
};
```

### 8.2 新增 AST 语言

```typescript
// src/tools/ast-tools.ts
const langMap = {
  newlang: sg.Lang.NewLang  // 需要 @ast-grep/napi 支持
};
```

### 8.3 新增状态模式

```typescript
// src/tools/state-tools.ts
const STATE_TOOL_MODES = [..., 'newmode'] as const;
// 自动支持 read/write/clear/list/status
```

## 总结

ultrapower 的工具系统通过 4 大类 35+ 工具提供：

1. **LSP 工具** - 18 种语言的 IDE 级智能（类型、定义、引用、诊断、重构）
2. **AST 工具** - 17 种语言的结构化搜索/替换（元变量、模式匹配）
3. **State 工具** - 9 种执行模式的状态管理（会话隔离、原子写入）
4. **Memory 工具** - 双层记忆系统（会话级 Notepad + 项目级 Project Memory）
5. **Python REPL** - 持久化数据分析环境（变量保持、会话锁、结构化输出）

核心设计原则：优雅降级、安全防护、会话隔离、原子操作、性能优化。
