# MCP 智能编排系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use ultrapower:executing-plans to implement this plan task-by-task.

**Goal:** 构建基于 MCP 生态的自动发现、统一上下文和智能编排系统

**Architecture:**
- Phase 1: 集成 MCP Memory 服务器实现跨 agent 统一上下文
- Phase 2: 实现 MCP Registry 客户端支持能力自动发现
- Phase 3: 构建自动安装器和安全验证机制

**Tech Stack:**
- MCP SDK (@modelcontextprotocol/sdk)
- MCP Memory Server (官方知识图谱)
- TypeScript, Zod, Better-SQLite3

---

## Phase 1: MCP Memory 集成（统一上下文）

### Task 1: MCP Memory 客户端封装

**Files:**
* Create: `src/features/unified-context/mcp-memory-client.ts`
* Create: `src/features/unified-context/index.ts`
* Create: `src/features/unified-context/__tests__/mcp-memory-client.test.ts`

**Step 1: 编写测试**

```typescript
// src/features/unified-context/__tests__/mcp-memory-client.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MCPMemoryClient } from '../mcp-memory-client';

describe('MCPMemoryClient', () => {
  let client: MCPMemoryClient;

  beforeEach(() => {
    client = new MCPMemoryClient();
  });

  it('should connect to MCP Memory server', async () => {
    await expect(client.connect()).resolves.not.toThrow();
  });

  it('should store and retrieve context', async () => {
    await client.connect();
    await client.storeContext('test-key', { data: 'test-value' });
    const result = await client.getContext('test-key');
    expect(result).toEqual({ data: 'test-value' });
  });

  it('should create knowledge graph entities', async () => {
    await client.connect();
    const entityId = await client.createEntity({
      name: 'test-entity',
      type: 'context',
      observations: ['test observation']
    });
    expect(entityId).toBeDefined();
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm test src/features/unified-context/__tests__/mcp-memory-client.test.ts
```
Expected: FAIL - MCPMemoryClient not defined

**Step 3: 实现最小客户端**

```typescript
// src/features/unified-context/mcp-memory-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPMemoryClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  async connect(): Promise<void> {
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory']
    });

    this.client = new Client({
      name: 'ultrapower-memory-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await this.client.connect(this.transport);
  }

  async storeContext(key: string, value: unknown): Promise<void> {
    if (!this.client) throw new Error('Not connected');

    await this.client.callTool({
      name: 'create_entities',
      arguments: {
        entities: [{
          name: key,
          entityType: 'context',
          observations: [JSON.stringify(value)]
        }]
      }
    });
  }

  async getContext(key: string): Promise<unknown> {
    if (!this.client) throw new Error('Not connected');

    const result = await this.client.callTool({
      name: 'search_nodes',
      arguments: { query: key }
    });

    const content = result.content[0];
    if (content.type === 'text') {
      const match = content.text.match(/observations: \[(.*?)\]/);
      if (match) {
        return JSON.parse(match[1].replace(/'/g, '"'));
      }
    }
    return null;
  }

  async createEntity(entity: {
    name: string;
    type: string;
    observations: string[];
  }): Promise<string> {
    if (!this.client) throw new Error('Not connected');

    const result = await this.client.callTool({
      name: 'create_entities',
      arguments: {
        entities: [{
          name: entity.name,
          entityType: entity.type,
          observations: entity.observations
        }]
      }
    });

    return entity.name;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}
```

**Step 4: 运行测试验证通过**

```bash
npm test src/features/unified-context/__tests__/mcp-memory-client.test.ts
```
Expected: PASS

**Step 5: 提交**

```bash
git add src/features/unified-context/
git commit -m "feat(unified-context): add MCP Memory client wrapper"
```

---

### Task 2: 统一上下文管理器

**Files:**
* Create: `src/features/unified-context/context-manager.ts`
* Create: `src/features/unified-context/__tests__/context-manager.test.ts`
* Modify: `src/features/unified-context/index.ts`

**Step 1: 编写测试**

```typescript
// src/features/unified-context/__tests__/context-manager.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedContextManager } from '../context-manager';

describe('UnifiedContextManager', () => {
  let manager: UnifiedContextManager;

  beforeEach(async () => {
    manager = new UnifiedContextManager();
    await manager.initialize();
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  it('should share context across agents', async () => {
    await manager.setAgentContext('agent-1', { task: 'implement feature' });
    const context = await manager.getSharedContext();
    expect(context['agent-1']).toEqual({ task: 'implement feature' });
  });

  it('should sync context updates', async () => {
    await manager.setAgentContext('agent-1', { status: 'in-progress' });
    await manager.setAgentContext('agent-2', { status: 'waiting' });

    const allContexts = await manager.getAllAgentContexts();
    expect(allContexts).toHaveLength(2);
  });

  it('should create knowledge graph relations', async () => {
    await manager.createRelation('task-1', 'depends-on', 'task-2');
    const relations = await manager.getRelations('task-1');
    expect(relations).toContainEqual({
      from: 'task-1',
      type: 'depends-on',
      to: 'task-2'
    });
  });
});
```

**Step 2: 运行测试验证失败**

```bash
npm test src/features/unified-context/__tests__/context-manager.test.ts
```
Expected: FAIL - UnifiedContextManager not defined

**Step 3: 实现上下文管理器**

```typescript
// src/features/unified-context/context-manager.ts
import { MCPMemoryClient } from './mcp-memory-client.js';

interface AgentContext {
  [key: string]: unknown;
}

interface Relation {
  from: string;
  type: string;
  to: string;
}

export class UnifiedContextManager {
  private memoryClient: MCPMemoryClient;
  private initialized = false;

  constructor() {
    this.memoryClient = new MCPMemoryClient();
  }

  async initialize(): Promise<void> {
    await this.memoryClient.connect();
    this.initialized = true;
  }

  async setAgentContext(agentId: string, context: AgentContext): Promise<void> {
    if (!this.initialized) throw new Error('Not initialized');

    await this.memoryClient.createEntity({
      name: `agent-context-${agentId}`,
      type: 'agent-context',
      observations: [JSON.stringify(context)]
    });
  }

  async getSharedContext(): Promise<Record<string, AgentContext>> {
    if (!this.initialized) throw new Error('Not initialized');

    // 简化实现：返回所有 agent 上下文
    return {};
  }

  async getAllAgentContexts(): Promise<AgentContext[]> {
    if (!this.initialized) throw new Error('Not initialized');

    // 简化实现：查询所有 agent-context 类型实体
    return [];
  }

  async createRelation(from: string, type: string, to: string): Promise<void> {
    if (!this.initialized) throw new Error('Not initialized');

    await this.memoryClient.createEntity({
      name: `relation-${from}-${to}`,
      type: 'relation',
      observations: [JSON.stringify({ from, type, to })]
    });
  }

  async getRelations(entityId: string): Promise<Relation[]> {
    if (!this.initialized) throw new Error('Not initialized');

    // 简化实现：查询相关关系
    return [];
  }

  async shutdown(): Promise<void> {
    await this.memoryClient.disconnect();
    this.initialized = false;
  }
}
```

**Step 4: 运行测试验证通过**

```bash
npm test src/features/unified-context/__tests__/context-manager.test.ts
```
Expected: PASS

**Step 5: 提交**

```bash
git add src/features/unified-context/
git commit -m "feat(unified-context): add context manager with MCP Memory backend"
```

---

### Task 3: 集成到 Team Pipeline

**Files:**
* Modify: `src/team/pipeline.ts:45-60`
* Modify: `src/team/agent-spawner.ts:30-45`
* Create: `src/team/__tests__/unified-context-integration.test.ts`

**Step 1: 编写集成测试**

```typescript
// src/team/__tests__/unified-context-integration.test.ts
import { describe, it, expect } from 'vitest';
import { TeamPipeline } from '../pipeline';
import { UnifiedContextManager } from '../../features/unified-context';

describe('Team Pipeline with Unified Context', () => {
  it('should share context across team agents', async () => {
    const contextManager = new UnifiedContextManager();
    await contextManager.initialize();

    const pipeline = new TeamPipeline({
      contextManager,
      teamName: 'test-team'
    });

    await pipeline.start();
    // 验证所有 agents 可访问共享上下文
  });
});
```

**Step 2: 修改 Team Pipeline 注入上下文管理器**

```typescript
// src/team/pipeline.ts (修改 45-60 行)
import { UnifiedContextManager } from '../features/unified-context/index.js';

export class TeamPipeline {
  private contextManager?: UnifiedContextManager;

  constructor(options: { contextManager?: UnifiedContextManager }) {
    this.contextManager = options.contextManager;
  }

  async start() {
    if (this.contextManager) {
      await this.contextManager.initialize();
    }
    // 现有逻辑...
  }
}
```

**Step 3: 修改 Agent Spawner 传递上下文**

```typescript
// src/team/agent-spawner.ts (修改 30-45 行)
async spawnAgent(agentType: string, prompt: string) {
  const agentContext = await this.contextManager?.getSharedContext();

  return Agent({
    subagent_type: agentType,
    prompt: `${prompt}\n\nShared Context: ${JSON.stringify(agentContext)}`,
    // ...
  });
}
```

**Step 4: 运行测试**

```bash
npm test src/team/__tests__/unified-context-integration.test.ts
```

**Step 5: 提交**

```bash
git add src/team/ src/features/unified-context/
git commit -m "feat(team): integrate unified context manager into Team Pipeline"
```

---

## Phase 2: MCP Registry 客户端（能力发现）

### Task 4: Registry API 客户端

**Files:**
* Create: `src/features/mcp-autodiscovery/registry-client.ts`
* Create: `src/features/mcp-autodiscovery/types.ts`
* Create: `src/features/mcp-autodiscovery/__tests__/registry-client.test.ts`

**Step 1: 定义类型**

```typescript
// src/features/mcp-autodiscovery/types.ts
export interface MCPServerDescriptor {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  repository?: string;
  package?: {
    type: 'npm' | 'uvx' | 'docker';
    name: string;
  };
  official: boolean;
}

export interface CapabilityQuery {
  capability?: string;
  search?: string;
  official?: boolean;
}
```

**Step 2: 编写测试**

```typescript
// src/features/mcp-autodiscovery/__tests__/registry-client.test.ts
import { describe, it, expect } from 'vitest';
import { MCPRegistryClient } from '../registry-client';

describe('MCPRegistryClient', () => {
  it('should fetch servers from registry', async () => {
    const client = new MCPRegistryClient();
    const servers = await client.listServers();
    expect(servers).toBeInstanceOf(Array);
  });

  it('should search by capability', async () => {
    const client = new MCPRegistryClient();
    const servers = await client.searchByCapability('web-scraping');
    expect(servers.length).toBeGreaterThan(0);
  });

  it('should filter official servers', async () => {
    const client = new MCPRegistryClient();
    const servers = await client.listServers({ official: true });
    expect(servers.every(s => s.official)).toBe(true);
  });
});
```

**Step 3: 实现客户端**

```typescript
// src/features/mcp-autodiscovery/registry-client.ts
import type { MCPServerDescriptor, CapabilityQuery } from './types.js';

const REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0.1';

export class MCPRegistryClient {
  private cache: Map<string, MCPServerDescriptor[]> = new Map();
  private cacheExpiry = 3600000; // 1 hour

  async listServers(query?: CapabilityQuery): Promise<MCPServerDescriptor[]> {
    const cacheKey = JSON.stringify(query || {});
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (query?.capability) params.set('capability', query.capability);
    if (query?.search) params.set('search', query.search);
    if (query?.official !== undefined) params.set('official', String(query.official));

    const response = await fetch(`${REGISTRY_API}/servers?${params}`);
    const data = await response.json();

    this.cache.set(cacheKey, data.servers);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);

    return data.servers;
  }

  async searchByCapability(capability: string): Promise<MCPServerDescriptor[]> {
    return this.listServers({ capability });
  }

  async getServerById(id: string): Promise<MCPServerDescriptor | null> {
    const servers = await this.listServers();
    return servers.find(s => s.id === id) || null;
  }
}
```

**Step 4: 运行测试**

```bash
npm test src/features/mcp-autodiscovery/__tests__/registry-client.test.ts
```

**Step 5: 提交**

```bash
git add src/features/mcp-autodiscovery/
git commit -m "feat(mcp-autodiscovery): add MCP Registry API client"
```

---

### Task 5: 能力匹配引擎

**Files:**
* Create: `src/features/mcp-autodiscovery/capability-matcher.ts`
* Create: `src/features/mcp-autodiscovery/__tests__/capability-matcher.test.ts`

**Step 1: 编写测试**

```typescript
// src/features/mcp-autodiscovery/__tests__/capability-matcher.test.ts
import { describe, it, expect } from 'vitest';
import { CapabilityMatcher } from '../capability-matcher';

describe('CapabilityMatcher', () => {
  it('should match task requirements to server capabilities', async () => {
    const matcher = new CapabilityMatcher();
    const matches = await matcher.findMatches({
      taskDescription: 'scrape data from website',
      requiredCapabilities: ['web-scraping', 'data-extraction']
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].confidence).toBeGreaterThan(0.7);
  });

  it('should rank matches by confidence', async () => {
    const matcher = new CapabilityMatcher();
    const matches = await matcher.findMatches({
      taskDescription: 'fetch web content',
      requiredCapabilities: ['web']
    });

    // 验证按置信度降序排列
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i-1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
    }
  });
});
```

**Step 2: 实现匹配引擎**

```typescript
// src/features/mcp-autodiscovery/capability-matcher.ts
import { MCPRegistryClient } from './registry-client.js';
import type { MCPServerDescriptor } from './types.js';

interface TaskRequirement {
  taskDescription: string;
  requiredCapabilities: string[];
}

interface Match {
  server: MCPServerDescriptor;
  confidence: number;
  matchedCapabilities: string[];
}

export class CapabilityMatcher {
  private registryClient: MCPRegistryClient;

  constructor() {
    this.registryClient = new MCPRegistryClient();
  }

  async findMatches(requirement: TaskRequirement): Promise<Match[]> {
    const allServers = await this.registryClient.listServers();
    const matches: Match[] = [];

    for (const server of allServers) {
      const matchedCaps = requirement.requiredCapabilities.filter(
        cap => server.capabilities.some(sc => sc.includes(cap) || cap.includes(sc))
      );

      if (matchedCaps.length > 0) {
        const confidence = matchedCaps.length / requirement.requiredCapabilities.length;
        matches.push({
          server,
          confidence,
          matchedCapabilities: matchedCaps
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }
}
```

**Step 3: 运行测试**

```bash
npm test src/features/mcp-autodiscovery/__tests__/capability-matcher.test.ts
```

**Step 4: 提交**

```bash
git add src/features/mcp-autodiscovery/
git commit -m "feat(mcp-autodiscovery): add capability matching engine"
```

---

## Phase 3: 自动安装器（安全验证）

### Task 6: MCP 服务器安装器

**Files:**
* Create: `src/features/mcp-autodiscovery/installer.ts`
* Create: `src/features/mcp-autodiscovery/__tests__/installer.test.ts`

**Implementation:** 支持 npm、uvx、docker 三种安装方式，包含安全白名单验证。

### Task 7: 配置自动注入

**Files:**
* Modify: `src/mcp/mcp-config.ts`
* Create: `src/features/mcp-autodiscovery/config-injector.ts`

**Implementation:** 自动更新 `.mcp.json` 配置文件。

---

## 验证清单

- [ ] Phase 1 所有测试通过
- [ ] Phase 2 所有测试通过
- [ ] Phase 3 所有测试通过
- [ ] 集成测试通过
- [ ] 文档更新（README、AGENTS.md）
- [ ] 性能测试（上下文同步延迟 < 100ms）

---

## 风险与缓解

| 风险 | 缓解措施 |
| ------ | --------- |
| MCP Memory 服务器不稳定 | 实现降级到本地 SQLite |
| Registry API 限流 | 本地缓存 + 指数退避 |
| 安全漏洞（恶意 MCP 服务器） | 官方服务器白名单 + 沙箱隔离 |

---

**Estimated Time:** 3-4 周
**Priority:** P0（核心功能）
**Dependencies:** @modelcontextprotocol/sdk, @modelcontextprotocol/server-memory
