# MCP/Plugin 兼容层

兼容层使 ultrapower 能够发现、注册和使用外部插件、MCP 服务器及工具。它提供统一接口来管理外部工具，同时通过集成的权限系统维护安全性。

## 目录

- [概述](#overview)
- [架构](#architecture)
- [Plugin Discovery](#plugin-discovery)
- [MCP Server Discovery](#mcp-server-discovery)
- [Plugin Manifest Format](#plugin-manifest-format)
- [Tool Registration](#tool-registration)
- [Permission System](#permission-system)
- [MCP Bridge](#mcp-bridge)
- [API Reference](#api-reference)
- [示例](#examples)
- [故障排查](#troubleshooting)

## 概述

兼容层由四个协同工作的集成系统组成：

1. **Discovery System** - 自动从用户目录中发现插件和 MCP 服务器
2. **Tool Registry** - 注册和管理所有外部工具的中央枢纽，支持冲突解决
3. **Permission Adapter** - 与 OMC 权限系统集成，确保工具安全执行
4. **MCP Bridge** - 连接 MCP 服务器并暴露其工具供使用

```
Plugins              MCP Configs          OMC Tools
   ↓                      ↓                    ↓
 Discovery System ────────────────────────────┐
                                              ↓
                           Tool Registry ← ← ←┘
                              ↓
                         Permission Adapter
                              ↓
                           MCP Bridge
```

## 架构

### Discovery System (`discovery.ts`)

从以下位置扫描外部插件和 MCP 服务器：

- `~/.claude/plugins/` - OMC/Claude Code plugins directory
- `~/.claude/installed-plugins/` - Alternative plugins location
- `~/.claude/settings.json` - Claude Code MCP server configs
- `~/.claude/claude_desktop_config.json` - Claude Desktop MCP server configs
- Plugin manifests (`plugin.json`) for embedded MCP servers

**发现内容：**
- 插件 skill 和 agent（来自 SKILL.md 和 agent .md 文件）
- MCP 服务器配置
- 插件 manifest 中的工具定义

### Tool Registry (`registry.ts`)

工具管理的中央枢纽：

- 注册来自已发现插件和 MCP 服务器的工具
- 使用基于优先级的解决方案处理工具名称冲突
- 将命令路由到适当的处理器
- 提供搜索和过滤能力
- 发出注册和连接状态事件

**主要特性：**
- 工具使用命名空间（例如 `plugin-name:tool-name`）
- 冲突解决的优先级系统（高优先级获胜）
- 短名称查找（即使有命名空间也能找到 `tool-name`）
- 用于监控注册表状态的事件监听器

### Permission Adapter (`permission-adapter.ts`)

将外部工具与 OMC 权限系统集成：

- 维护只读工具的安全模式
- 自动批准已知安全操作
- 对危险操作（写入、执行）提示用户确认
- 缓存权限决策
- 确定工具执行的委派目标

**安全模式：**
- 常见 MCP 工具的内置模式（filesystem 读取、context7 查询）
- 来自 manifest 的插件贡献模式
- 可在运行时注册自定义模式

### MCP Bridge (`mcp-bridge.ts`)

管理 MCP 服务器连接：

- 启动服务器进程
- 发送 JSON-RPC 请求并处理响应
- 从服务器发现工具和资源
- 将工具调用路由到服务器
- 处理连接生命周期（连接、断开、重连）

**协议：** 通过进程 stdio 的 JSON-RPC 2.0，使用换行符分隔消息

## Plugin Discovery

### 目录结构

插件从 `~/.claude/plugins/` 和 `~/.claude/installed-plugins/` 中发现：

```
~/.claude/plugins/
├── my-plugin/
│   ├── plugin.json          (required)
│   ├── skills/              (optional)
│   │   ├── skill-1/
│   │   │   └── SKILL.md
│   │   └── skill-2/
│   │       └── SKILL.md
│   ├── agents/              (optional)
│   │   ├── agent-1.md
│   │   └── agent-2.md
│   └── commands/            (optional)
└── another-plugin/
    └── plugin.json
```

### Plugin Manifest 结构

`plugin.json` 定义插件的元数据和工具：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "namespace": "my-plugin",
  "skills": "./skills/",
  "agents": "./agents/",
  "commands": "./commands/",
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {},
      "enabled": true,
      "description": "My MCP server"
    }
  },
  "permissions": [
    {
      "tool": "my-plugin:search",
      "scope": "read",
      "patterns": [".*"],
      "reason": "Search is read-only"
    }
  ],
  "tools": [
    {
      "name": "my-tool",
      "description": "Does something useful",
      "handler": "tools/my-tool.js",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        }
      }
    }
  ]
}
```

### Skill 和 Agent 发现

**Skills** 从 skills 目录中的 `SKILL.md` 文件发现。每个 skill 目录必须包含带有 frontmatter 的 SKILL.md：

```markdown
---
name: my-skill
description: Describes what this skill does
tags: tag1, tag2
---

Skill documentation here...
```

**Agents** 从 agents 目录中具有类似 frontmatter 结构的 `.md` 文件发现。

## MCP Server Discovery

### Claude Desktop 配置

位于 `~/.claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/"],
      "enabled": true
    },
    "web": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-web"],
      "enabled": true
    }
  }
}
```

### Claude Code 设置

位于 `~/.claude/settings.json`：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "secret"
      }
    }
  }
}
```

### 插件内嵌 MCP 服务器

插件可以在其 manifest 中定义 MCP 服务器：

```json
{
  "name": "plugin-with-server",
  "mcpServers": {
    "my-mcp": {
      "command": "node",
      "args": ["./mcp/server.js"]
    }
  }
}
```

## Plugin Manifest Format

### 完整 Schema

| 字段 | 类型 | 必填 | 说明 |
|-------|------|----------|-------------|
| `name` | string | 是 | 插件名称（字母数字、连字符、下划线） |
| `version` | string | 是 | 语义化版本（例如 "1.0.0"） |
| `description` | string | 否 | 人类可读的描述 |
| `namespace` | string | 否 | 工具名称前缀（默认为插件名称） |
| `skills` | string\|string[] | 否 | skills 目录路径 |
| `agents` | string\|string[] | 否 | agents 目录路径 |
| `commands` | string\|string[] | 否 | commands 目录路径 |
| `mcpServers` | object | 否 | MCP 服务器配置（名称 → McpServerEntry） |
| `permissions` | PluginPermission[] | 否 | 插件工具所需权限 |
| `tools` | PluginToolDefinition[] | 否 | 工具定义 |

### McpServerEntry

| 字段 | 类型 | 必填 | 说明 |
|-------|------|----------|-------------|
| `command` | string | 是 | 运行服务器的命令（例如 "node"、"npx"） |
| `args` | string[] | 否 | 命令参数 |
| `env` | object | 否 | 传递给服务器的环境变量 |
| `enabled` | boolean | 否 | 初始化时是否连接（默认：true） |
| `description` | string | 否 | 人类可读的描述 |

### PluginPermission

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| `tool` | string | 需要权限的工具名称 |
| `scope` | "read"\|"write"\|"execute"\|"all" | 权限范围 |
| `patterns` | string[] | 允许路径/命令的正则表达式模式 |
| `reason` | string | 需要此权限的原因 |

### PluginToolDefinition

| 字段 | 类型 | 说明 |
|-------|------|-------------|
| `name` | string | 工具名称（变为 `namespace:name`） |
| `description` | string | 人类可读的描述 |
| `handler` | string | 处理函数或命令的路径 |
| `inputSchema` | object | 工具输入的 JSON Schema |

## Tool Registration

### 注册流程

工具按以下顺序注册：

1. **Plugin discovery** - 从配置路径中发现插件
2. **Tool extraction** - 从插件中提取 skill、agent 和工具定义
3. **MCP server discovery** - 从配置文件中发现 MCP 服务器
4. **Tool conversion** - 将 MCP 工具转换为 ExternalTool 格式
5. **Conflict resolution** - 按优先级解决同名工具冲突

### 工具命名

工具使用命名空间格式：

```
{namespace}:{tool-name}

示例：
- my-plugin:search
- filesystem:read_file
- context7:query-docs
```

短名称同样有效：
```javascript
getRegistry().getTool('search')     // 找到 'my-plugin:search'
getRegistry().getTool('my-plugin:search')  // 精确匹配
```

### 冲突解决

当两个插件提供同名工具时：

1. **优先级值** - 优先级更高的工具获胜（默认：50）
2. **命名空间** - 使用完整命名空间名称消除歧义
3. **手动处理** - 检查冲突并以不同优先级重新注册

```javascript
// Check for conflicts
const conflicts = registry.getConflicts();

// Get winner for conflict
const winner = conflicts[0].winner;
console.log(`${winner.source} won with priority ${winner.priority}`);
```

## Permission System

### 安全模式

只读工具无需用户提示即可自动批准：

```javascript
// Check if tool is safe
const result = checkPermission('mcp__filesystem__read_file');
// { allowed: true, reason: "Filesystem read (read-only)" }
```

内置安全模式涵盖：

- **Context7** - 文档查询（只读）
- **Filesystem** - 仅读取操作
- **Exa** - 网络搜索（只读，外部）

### 权限检查流程

```
工具调用
    ↓
检查安全模式 → 允许（无需提示）
    ↓（不在安全模式中）
检查危险模式 → 询问用户
    ↓（非危险）
检查工具能力 → 安全能力（自动批准）或危险（询问用户）
    ↓
执行或拒绝
```

### 自动批准示例

```javascript
// 只读工具是安全的
checkPermission('my-plugin:search')
// { allowed: true, reason: "Tool has safe capabilities: search" }

// 写入/执行需要用户确认
checkPermission('filesystem:write_file', { path: '/etc/passwd' })
// { allowed: false, askUser: true, reason: "Tool requires explicit permission" }
```

### 缓存权限

权限决策会被缓存。用户可以持久授予或拒绝：

```javascript
// 用户授予权限
grantPermission('custom:dangerous-tool', { mode: 'aggressive' });

// 后续调用使用缓存决策
checkPermission('custom:dangerous-tool', { mode: 'aggressive' });
// { allowed: true, reason: "User granted permission" }

// 需要时清除缓存
clearPermissionCache();
```

### 注册安全模式

插件可以在 manifest 中注册安全模式：

```json
{
  "name": "my-plugin",
  "permissions": [
    {
      "tool": "my-plugin:query-docs",
      "scope": "read",
      "patterns": [".*"],
      "reason": "Documentation lookup is read-only"
    }
  ]
}
```

插件初始化时会自动集成这些模式。

## MCP Bridge

### 连接到服务器

```javascript
import { getMcpBridge } from './compatibility';

const bridge = getMcpBridge();

// Connect to a single server
const tools = await bridge.connect('filesystem');
console.log(`Connected. Available tools: ${tools.map(t => t.name).join(', ')}`);

// Auto-connect all enabled servers
const results = await bridge.autoConnect();
for (const [serverName, tools] of results) {
  console.log(`${serverName}: ${tools.length} tools`);
}
```

### 调用工具

```javascript
// 在 MCP 服务器上调用工具
const result = await bridge.invokeTool('filesystem', 'read_file', {
  path: '/home/user/.bashrc'
});

if (result.success) {
  console.log('File contents:', result.data);
  console.log('Time:', result.executionTime, 'ms');
} else {
  console.error('Error:', result.error);
}
```

### 读取资源

部分 MCP 服务器提供资源（文档、API 等）：

```javascript
// 读取资源
const result = await bridge.readResource('web', 'https://example.com');

if (result.success) {
  console.log(result.data);
}
```

### 连接管理

```javascript
// 检查连接状态
if (bridge.isConnected('filesystem')) {
  console.log('Connected to filesystem server');
}

// 获取所有服务器工具和资源
const tools = bridge.getServerTools('filesystem');
const resources = bridge.getServerResources('web');

// 断开与服务器的连接
bridge.disconnect('filesystem');

// 断开与所有服务器的连接
bridge.disconnectAll();
```

### 事件

监控 bridge 活动：

```javascript
const bridge = getMcpBridge();

bridge.on('server-connected', ({ server, toolCount }) => {
  console.log(`Connected to ${server} with ${toolCount} tools`);
});

bridge.on('server-disconnected', ({ server, code }) => {
  console.log(`Disconnected from ${server}`);
});

bridge.on('server-error', ({ server, error }) => {
  console.error(`Error from ${server}:`, error);
});
```

## API Reference

### 初始化

```typescript
import {
  initializeCompatibility,
  getRegistry,
  getMcpBridge
} from './compatibility';

// 初始化所有内容
const result = await initializeCompatibility({
  pluginPaths: ['~/.claude/plugins'],
  mcpConfigPath: '~/.claude/claude_desktop_config.json',
  autoConnect: true  // 自动连接到 MCP 服务器
});

console.log(`Plugins: ${result.pluginCount}`);
console.log(`MCP servers: ${result.mcpServerCount}`);
console.log(`Tools: ${result.toolCount}`);
console.log(`Connected: ${result.connectedServers.join(', ')}`);
```

### Discovery 函数

```typescript
import {
  discoverPlugins,
  discoverMcpServers,
  discoverAll,
  isPluginInstalled,
  getPluginInfo,
  getPluginPaths,
  getMcpConfigPath
} from './compatibility';

// 从自定义路径发现插件
const plugins = discoverPlugins({
  pluginPaths: ['/custom/plugins/path']
});

// 发现 MCP 服务器
const servers = discoverMcpServers({
  mcpConfigPath: '~/.claude/claude_desktop_config.json',
  settingsPath: '~/.claude/settings.json'
});

// 一次性发现所有内容
const result = discoverAll({
  force: true  // 即使已缓存也强制重新发现
});

// 检查插件安装状态
if (isPluginInstalled('my-plugin')) {
  const info = getPluginInfo('my-plugin');
  console.log(`${info.name} v${info.version}`);
}

// 获取已配置的路径
const pluginPaths = getPluginPaths();
const mcpPath = getMcpConfigPath();
```

### Registry 函数

```typescript
import {
  getRegistry,
  initializeRegistry,
  routeCommand,
  getExternalTool,
  listExternalTools,
  hasExternalPlugins,
  hasMcpServers
} from './compatibility';

const registry = getRegistry();

// 注册发现内容和工具
await initializeRegistry({ force: true });

// 访问工具
const allTools = listExternalTools();
const tool = getExternalTool('my-plugin:search');

// 路由命令
const route = routeCommand('search');
if (route) {
  console.log(`Handler: ${route.handler}`);
  console.log(`Requires permission: ${route.requiresPermission}`);
}

// 检查可用内容
if (hasExternalPlugins()) {
  console.log('External plugins available');
}
if (hasMcpServers()) {
  console.log('MCP servers available');
}

// 获取所有插件和服务器
const plugins = registry.getAllPlugins();
const servers = registry.getAllMcpServers();

// 搜索工具
const results = registry.searchTools('filesystem');

// 监听事件
registry.addEventListener(event => {
  if (event.type === 'tool-registered') {
    console.log(`Registered: ${event.data.tool}`);
  }
});
```

### Permission 函数

```typescript
import {
  checkPermission,
  grantPermission,
  denyPermission,
  clearPermissionCache,
  addSafePattern,
  getSafePatterns,
  shouldDelegate,
  getDelegationTarget,
  integrateWithPermissionSystem,
  processExternalToolPermission
} from './compatibility';

// 检查工具是否被允许
const check = checkPermission('my-tool:dangerous-op');
if (check.allowed) {
  console.log('Allowed:', check.reason);
} else if (check.askUser) {
  console.log('Ask user:', check.reason);
}

// 缓存用户决策
grantPermission('custom:tool', { mode: 'aggressive' });
denyPermission('risky:tool');
clearPermissionCache();

// 管理安全模式
const patterns = getSafePatterns();
addSafePattern({
  tool: 'my-safe-tool',
  pattern: /^\/safe\/path/,
  description: 'Only allows /safe/path',
  source: 'myapp'
});

// 检查工具是否应被委派
if (shouldDelegate('external:tool')) {
  const target = getDelegationTarget('external:tool');
  console.log(`Delegate to: ${target.type}/${target.target}`);
}

// 启动时与权限系统集成
integrateWithPermissionSystem();
```

### MCP Bridge 函数

```typescript
import {
  getMcpBridge,
  resetMcpBridge,
  invokeMcpTool,
  readMcpResource
} from './compatibility';

const bridge = getMcpBridge();

// 连接到服务器
const tools = await bridge.connect('filesystem');

// 调用工具
const result = await invokeMcpTool('filesystem', 'read_file', {
  path: '/etc/hosts'
});

// 读取资源
const resourceResult = await readMcpResource('web', 'https://api.example.com');

// 检查连接
const status = bridge.getConnectionStatus();

// 清理
bridge.disconnectAll();
resetMcpBridge();
```

## 示例

### 示例 1：初始化并列出工具

```javascript
import { initializeCompatibility, getRegistry } from './compatibility';

async function listAvailableTools() {
  // 初始化兼容层
  const result = await initializeCompatibility({
    autoConnect: true
  });

  console.log(`Discovered ${result.pluginCount} plugins`);
  console.log(`Connected to ${result.connectedServers.length} MCP servers`);

  // 列出所有可用工具
  const registry = getRegistry();
  const tools = registry.getAllTools();

  console.log('\nAvailable tools:');
  for (const tool of tools) {
    console.log(`  ${tool.name} (${tool.type})`);
    console.log(`    Description: ${tool.description}`);
    console.log(`    Capabilities: ${tool.capabilities?.join(', ')}`);
  }
}

listAvailableTools().catch(console.error);
```

### 示例 2：搜索并使用工具

```javascript
import {
  initializeCompatibility,
  getRegistry,
  checkPermission,
  getMcpBridge
} from './compatibility';

async function searchAndRead() {
  await initializeCompatibility();

  const registry = getRegistry();

  // 搜索 filesystem 工具
  const fileTools = registry.searchTools('filesystem');
  console.log(`Found ${fileTools.length} filesystem tools`);

  // 查找 read_file 工具
  const readTool = fileTools.find(t => t.name.includes('read'));

  if (readTool) {
    // 检查权限
    const perm = checkPermission(readTool.name);

    if (perm.allowed) {
      const bridge = getMcpBridge();
      const result = await bridge.invokeTool(
        readTool.source,
        'read_file',
        { path: '/etc/hosts' }
      );

      if (result.success) {
        console.log('File contents:', result.data);
      }
    }
  }
}

searchAndRead().catch(console.error);
```

### 示例 3：处理带 MCP 服务器的插件

```javascript
import {
  discoverPlugins,
  initializeRegistry,
  getMcpBridge
} from './compatibility';

async function setupPluginMcp() {
  // 发现插件（包括 manifest 中定义的 MCP 服务器）
  const plugins = discoverPlugins();
  const pluginWithMcp = plugins.find(p => p.manifest.mcpServers);

  if (pluginWithMcp) {
    console.log(`Plugin ${pluginWithMcp.name} has embedded MCP servers:`);
    for (const serverName of Object.keys(pluginWithMcp.manifest.mcpServers || {})) {
      console.log(`  - ${serverName}`);
    }

    // 初始化注册表（注册来自插件的 MCP 服务器）
    await initializeRegistry();

    // 连接到插件的 MCP 服务器
    const bridge = getMcpBridge();
    const fullServerName = `${pluginWithMcp.name}:${serverName}`;

    try {
      const tools = await bridge.connect(fullServerName);
      console.log(`Connected to ${fullServerName} with ${tools.length} tools`);
    } catch (err) {
      console.error('Failed to connect:', err.message);
    }
  }
}

setupPluginMcp().catch(console.error);
```

### 示例 4：冲突解决

```javascript
import { getRegistry } from './compatibility';

function showConflicts() {
  const registry = getRegistry();
  const conflicts = registry.getConflicts();

  if (conflicts.length === 0) {
    console.log('No tool conflicts');
    return;
  }

  console.log(`Found ${conflicts.length} conflicts:\n`);

  for (const conflict of conflicts) {
    console.log(`Tool: ${conflict.name}`);
    console.log(`  Winner: ${conflict.winner.source} (priority: ${conflict.winner.priority})`);
    console.log('  Alternatives:');
    for (const tool of conflict.tools) {
      if (tool !== conflict.winner) {
        console.log(`    - ${tool.source} (priority: ${tool.priority})`);
      }
    }
    console.log();
  }
}

showConflicts();
```

### 示例 5：自定义权限模式

```javascript
import {
  addSafePattern,
  checkPermission,
  getSafePatterns
} from './compatibility';

function registerCustomPatterns() {
  // 为插件工具注册安全模式
  addSafePattern({
    tool: 'analytics:track',
    pattern: /^(page_view|event|error)$/,
    description: 'Only allows tracking specific event types',
    source: 'myapp'
  });

  // 用有效输入检查权限
  let result = checkPermission('analytics:track');
  console.log('Safe:', result.allowed);  // true

  // 查看所有模式
  const patterns = getSafePatterns();
  const myPatterns = patterns.filter(p => p.source === 'myapp');
  console.log('My patterns:', myPatterns.length);
}

registerCustomPatterns();
```

## 故障排查

### 插件未被发现

**问题：** `discoverPlugins()` 返回空数组。

**检查清单：**
- 插件位于 `~/.claude/plugins/` 或 `~/.claude/installed-plugins/`
- 每个插件在根目录或 `.claude-plugin/` 子目录中有 `plugin.json`
- 插件名称不与保留名称冲突（例如 'ultrapower'）
- 文件权限允许读取该目录

**调试：**
```javascript
import { getPluginPaths } from './compatibility';

const paths = getPluginPaths();
console.log('Scanning paths:', paths);

// 检查目录是否存在
import { existsSync } from 'fs';
for (const path of paths) {
  console.log(`${path}: ${existsSync(path) ? 'exists' : 'missing'}`);
}
```

### MCP 服务器无法连接

**问题：** `bridge.connect()` 超时。

**检查清单：**
- 服务器命令正确（例如 `npx`、`node`）
- 命令可执行且在 PATH 中
- 参数有效
- 服务器实现了 MCP 协议（JSON-RPC 2.0）
- 检查 stderr 输出是否有错误

**调试：**
```javascript
import { getMcpBridge } from './compatibility';

const bridge = getMcpBridge();

bridge.on('server-error', ({ server, error }) => {
  console.error(`Server error from ${server}:`, error);
});

bridge.on('connect-error', ({ server, error }) => {
  console.error(`Failed to connect to ${server}:`, error);
});
```

### 工具未显示

**问题：** 已注册的工具未出现在 `getRegistry().getAllTools()` 中。

**原因及解决方案：**
- 插件未被发现 - 先检查插件发现
- 工具未被提取 - 确保 skills 目录中存在 SKILL.md 文件
- 命名空间冲突 - 两个插件使用相同命名空间
- 工具注册失败 - 检查注册表事件是否有错误

**调试：**
```javascript
import { getRegistry, discoverPlugins } from './compatibility';

const plugins = discoverPlugins();
for (const plugin of plugins) {
  console.log(`${plugin.name}: ${plugin.tools.length} tools`);
  for (const tool of plugin.tools) {
    console.log(`  - ${tool.name}`);
  }
}

// 检查实际注册的内容
const registry = getRegistry();
const registered = registry.getAllTools();
console.log(`Registry has ${registered.length} tools`);

// 监听注册事件
registry.addEventListener(event => {
  if (event.type === 'tool-registered') {
    console.log('Registered:', event.data.tool);
  } else if (event.type === 'tool-conflict') {
    console.log('Conflict:', event.data.name, '→', event.data.winner);
  }
});
```

### 权限始终被拒绝

**问题：** 即使用户批准后，需要权限的工具仍始终被拒绝。

**解决方案：**
- 清除权限缓存：`clearPermissionCache()`
- 确保使用相同的工具名称/输入进行缓存决策
- 检查工具是否匹配覆盖缓存的危险模式

**调试：**
```javascript
import {
  checkPermission,
  grantPermission,
  getSafePatterns
} from './compatibility';

// 检查工具是否在危险模式中
const patterns = getSafePatterns();
console.log('Safe patterns:', patterns.length);

// 手动授予权限
grantPermission('my-tool');

// 验证已缓存
const result = checkPermission('my-tool');
console.log('Allowed:', result.allowed);
console.log('Reason:', result.reason);
```

### Manifest 解析错误

**问题：** 插件加载但 manifest 解析失败。

**检查清单：**
- `plugin.json` 是有效的 JSON（使用 `npm install -g jsonlint` 验证）
- 必填字段存在：`name`、`version`
- 路径或配置中无语法错误
- 文件编码为 UTF-8

**调试：**
```javascript
import { getPluginInfo } from './compatibility';

const plugin = getPluginInfo('my-plugin');
if (plugin && !plugin.loaded) {
  console.error('Failed to load:', plugin.error);
  console.log('Manifest:', plugin.manifest);
}
```

### MCP 工具调用失败

**问题：** 工具调用返回错误。

**调试：**
```javascript
import { getMcpBridge } from './compatibility';

const bridge = getMcpBridge();

// 检查连接
console.log('Connected:', bridge.isConnected('myserver'));

// 获取可用工具
const tools = bridge.getServerTools('myserver');
console.log('Available tools:', tools.map(t => t.name));

// 尝试调用并获取错误详情
const result = await bridge.invokeTool('myserver', 'tool-name', {});
if (!result.success) {
  console.error('Error:', result.error);
  console.error('Time:', result.executionTime, 'ms');
}
```

## 最佳实践

1. **尽早初始化** - 在启动时调用 `initializeCompatibility()`
2. **缓存注册表** - 复用 `getRegistry()` 实例，不要重复初始化
3. **优雅处理权限** - 在调用危险工具前始终检查 `checkPermission()`
4. **监控事件** - 使用事件监听器追踪插件/服务器状态变化
5. **版本检查** - 在插件 manifest 中包含版本约束以确保兼容性
6. **本地测试插件** - 发布前使用本地发现路径进行测试
7. **使用命名空间** - 在 manifest 中设置 `namespace` 以避免冲突
8. **记录权限说明** - 清楚说明插件需要特定范围的原因
9. **处理错误** - MCP 连接可能失败；实现重试逻辑
10. **清理资源** - 关闭时调用 `disconnectAll()` 和 `resetMcpBridge()`
