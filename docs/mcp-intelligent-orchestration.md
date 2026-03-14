# MCP Intelligent Orchestration System

## 概述

MCP 智能编排系统为 ultrapower 提供自动化的 MCP 服务器发现、能力匹配和配置生成功能。

## 核心功能

### 1. MCP Registry 客户端

自动从 MCP Registry API 获取可用服务器列表：

```typescript
import { MCPRegistryClient } from '@liangjie559567/ultrapower';

const client = new MCPRegistryClient();
const servers = await client.listServers();
const memoryServer = await client.getServerById('memory');
```

**特性：**
- 1 小时缓存机制
- 支持能力查询过滤
- HTTP 错误处理

### 2. 能力匹配引擎

根据任务需求自动匹配最合适的 MCP 服务器：

```typescript
import { CapabilityMatcher } from '@liangjie559567/ultrapower';

const matcher = new CapabilityMatcher();
const matches = await matcher.findMatches({
  taskDescription: 'Store agent context',
  requiredCapabilities: ['knowledge-graph', 'memory']
});

// 返回按置信度排序的匹配结果
matches.forEach(match => {
  console.log(`${match.server.name}: ${match.confidence * 100}%`);
});
```

### 3. 配置生成器

自动生成 MCP 服务器配置：

```typescript
import { ConfigInjector } from '@liangjie559567/ultrapower';

const injector = new ConfigInjector();
const config = injector.generateConfig({
  id: 'memory',
  name: 'MCP Memory',
  package: { type: 'uvx', name: '@modelcontextprotocol/server-memory' }
});

// 输出：
// {
//   command: 'uvx',
//   args: ['@modelcontextprotocol/server-memory']
// }
```

**安全特性：**
- 包名正则验证（防止命令注入）
- 仅支持 npm/uvx/docker 三种类型

### 4. 安装助手

生成安全的安装命令：

```typescript
import { MCPInstaller } from '@liangjie559567/ultrapower';

const installer = new MCPInstaller();

// 检查是否为官方服务器
if (installer.isOfficialServer('@modelcontextprotocol/server-memory')) {
  const cmd = installer.getInstallCommand({
    type: 'uvx',
    name: '@modelcontextprotocol/server-memory'
  });
  console.log(cmd); // "uvx @modelcontextprotocol/server-memory"
}
```

**官方服务器白名单：**
- `@modelcontextprotocol/server-memory`
- `@modelcontextprotocol/server-filesystem`
- `mcp-server-fetch`
- `mcp-server-git`

## 集成示例

### 基础集成

```typescript
import {
  MCPRegistryClient,
  CapabilityMatcher,
  ConfigInjector
} from '@liangjie559567/ultrapower';

async function setupMCPServer(taskDescription: string) {
  // 1. 查询可用服务器
  const client = new MCPRegistryClient();
  const servers = await client.listServers();

  // 2. 匹配能力
  const matcher = new CapabilityMatcher();
  const matches = await matcher.findMatches({
    taskDescription,
    requiredCapabilities: ['memory', 'knowledge-graph']
  });

  if (matches.length === 0) {
    throw new Error('No matching MCP server found');
  }

  // 3. 生成配置
  const bestMatch = matches[0];
  const injector = new ConfigInjector();
  const config = injector.generateConfig(bestMatch.server);

  return config;
}
```

### 团队上下文同步

```typescript
import { UnifiedContextManager } from '@liangjie559567/ultrapower';
import { setContextManager } from '@liangjie559567/ultrapower/team';

async function initTeamContext(teamName: string) {
  // 初始化上下文管理器
  const contextManager = new UnifiedContextManager();
  await contextManager.initialize();

  // 为团队设置上下文管理器
  setContextManager(teamName, contextManager);

  // 存储 agent 上下文
  await contextManager.setAgentContext('agent-1', {
    currentTask: 'Implement feature X',
    dependencies: ['agent-2']
  });

  // 获取共享上下文
  const sharedContext = await contextManager.getSharedContext();
  return sharedContext;
}
```

## 安全加固

### 命令注入防护

所有包名经过严格正则验证：

```typescript
const PACKAGE_NAME_REGEX = /^[@a-z0-9-_./]+$/i;

if (!PACKAGE_NAME_REGEX.test(packageName)) {
  throw new Error(`Invalid package name: ${packageName}`);
}
```

### HTTP 错误处理

所有 Registry API 调用包含状态码检查：

```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Registry API error: ${response.status}`);
}
```

### 多团队状态隔离

使用 Map 实现团队级上下文隔离：

```typescript
const contextManagers = new Map<string, UnifiedContextManager>();

export function setContextManager(teamName: string, manager: UnifiedContextManager) {
  contextManagers.set(teamName, manager);
}
```

## 性能优化

### 并行上下文同步

使用 `Promise.all()` 并行处理多个 agent 上下文：

```typescript
await Promise.all(
  Object.entries(sharedContext).map(([agentId, context]) =>
    contextManager.setAgentContext(agentId, context)
  )
);
```

**性能基准：**
- 10 个 agent 上下文同步 < 500ms
- 50 个并发操作 < 2000ms

## API 参考

### MCPRegistryClient

```typescript
class MCPRegistryClient {
  async listServers(query?: CapabilityQuery): Promise<MCPServerDescriptor[]>
  async searchByCapability(capability: string): Promise<MCPServerDescriptor[]>
  async getServerById(id: string): Promise<MCPServerDescriptor | null>
}
```

### CapabilityMatcher

```typescript
class CapabilityMatcher {
  async findMatches(requirement: TaskRequirement): Promise<Match[]>
}

interface Match {
  server: MCPServerDescriptor;
  confidence: number;
  matchedCapabilities: string[];
}
```

### ConfigInjector

```typescript
class ConfigInjector {
  generateConfig(server: Pick<MCPServerDescriptor, 'id' | 'name' | 'package'>): MCPConfig
}
```

### MCPInstaller

```typescript
class MCPInstaller {
  isOfficialServer(packageName: string): boolean
  getInstallCommand(pkg: PackageInfo): string
}
```

## 测试

运行完整测试套件：

```bash
npm test -- src/features/mcp-autodiscovery/__tests__/
```

**测试覆盖：**
- 单元测试：17 个
- 安全测试：5 个
- 性能测试：2 个
- 集成测试：1 个

## 故障排查

### Registry API 连接失败

```typescript
try {
  const servers = await client.listServers();
} catch (error) {
  if (error.message.includes('Registry API error')) {
    // 检查网络连接或使用缓存数据
  }
}
```

### MCP Memory 服务器未启动

确保 MCP Memory 服务器正在运行：

```bash
uvx @modelcontextprotocol/server-memory
```

### 包名验证失败

确保包名符合规范：
- 仅包含字母、数字、连字符、下划线、点和斜杠
- 可选 `@` 前缀（用于 scoped packages）

## 下一步

- [ ] 添加更多官方服务器到白名单
- [ ] 实现服务器健康检查
- [ ] 添加配置持久化
- [ ] 支持自定义 Registry URL
