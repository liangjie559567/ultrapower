# Ultrapower 开发路线图

**制定日期**: 2026-03-10
**版本**: v6.0.0 → v7.0.0
**目标**: 提升性能、可观测性和开发体验

---

## 执行摘要

基于代码库结构分析、痛点识别、最佳实践研究和差距分析，ultrapower 已具备行业领先的架构设计和功能完整性。主要改进方向集中在：

1. **性能优化** - 解决核心模块过大和测试缓慢问题
2. **可观测性增强** - 实现分布式追踪和性能监控
3. **错误处理强化** - 添加自动重试和熔断机制
4. **开发体验提升** - 统一状态管理和配置化 Agent

**预期收益**:
- 启动性能提升 40%
- 开发效率提升 50%
- 系统可靠性提升 30%
- 维护成本降低 30%

---

## 优先级排序

### P0: 必须立即处理（影响稳定性/性能）

1. **测试套件性能优化** - 34秒 → <5秒
2. **hooks/bridge.ts 拆分** - 1430行 → <200行
3. **CLI 命令懒加载** - 启动时间减少40%

**影响**: 直接影响开发效率和用户体验
**时间**: 1-2周
**风险**: 低-中

### P1: 近期处理（提升核心能力）

4. **统一状态管理层** - 消除碎片化
5. **自动重试和熔断机制** - 提升可靠性
6. **Agent 配置化** - 提升扩展性
7. **MCP 服务器统一** - 减少代码重复

**影响**: 提升可靠性和可维护性
**时间**: 1-2月
**风险**: 中-高

### P2: 长期优化（增强竞争力）

8. **OpenTelemetry 追踪** - 分布式可观测性
9. **结果缓存系统** - 降低成本
10. **流式 API 支持** - 实时反馈
11. **可视化调试面板** - 提升用户体验

**影响**: 增强竞争力和用户体验
**时间**: 3-6月
**风险**: 中

---

## 短期目标（1-2 个月）

### 1. 测试套件性能优化 ⚡

**问题**: cli-notify-profile.test.ts 单文件耗时33秒

**改进方案**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4,
        minForks: 2
      }
    }
  }
});
```

**具体措施**:
1. 隔离慢速测试: `npm run test:fast` vs `npm run test:integration`
2. Mock 网络调用: 避免真实 Discord/Telegram API
3. 并行化: 使用 `vitest --threads`

**预期收益**:
- 快速测试: <5秒
- 完整测试: <15秒
- 开发效率: +50%

**实施难度**: ⭐⭐ (低)
**风险评估**: 低 - 仅影响测试，不影响生产代码

---

### 2. hooks/bridge.ts 模块拆分 🔧

**问题**: 1430行单文件，承担多重职责

**目标架构**:
```
hooks/
├── bridge.ts              # 路由逻辑 (<200行)
├── handlers/
│   ├── hot-path/         # keyword-detector, pre/post-tool-use
│   │   ├── keyword-detector.ts
│   │   ├── pre-tool-use.ts
│   │   └── post-tool-use.ts
│   ├── lifecycle/        # setup, session-end, subagent-start/stop
│   │   ├── setup.ts
│   │   ├── session-end.ts
│   │   └── subagent-lifecycle.ts
│   └── validation/       # permission-request, pre-compact
│       ├── permission-request.ts
│       └── pre-compact.ts
└── shared/               # 缓存、工具函数
    ├── cache.ts
    └── utils.ts
```

**迁移策略**:
1. 第一阶段: 提取热路径处理器（不破坏现有逻辑）
2. 第二阶段: 提取生命周期处理器
3. 第三阶段: 提取验证处理器
4. 第四阶段: 简化 bridge.ts 为纯路由

**预期收益**:
- 启动时间: -30-50%
- 模块职责: 清晰
- 测试复杂度: -40%

**实施难度**: ⭐⭐⭐ (中)
**风险评估**: 中 - 需要完整回归测试

---

### 3. CLI 命令懒加载 🚀

**问题**: 1651行 cli/index.ts，加载所有命令即使只用一个

**改进方案**:
```typescript
// cli/index.ts (简化后 <300行)
import { lazyLoadCommand } from './lazy-loader.js';

program
  .command('stats')
  .description('Show statistics')
  .action(lazyLoadCommand('./commands/stats.js'));

program
  .command('trace')
  .description('Show trace timeline')
  .action(lazyLoadCommand('./commands/trace.js'));
```

```typescript
// cli/lazy-loader.ts
export function lazyLoadCommand(modulePath: string) {
  return async (...args: any[]) => {
    const module = await import(modulePath);
    return module.default(...args);
  };
}
```

**预期收益**:
- CLI 启动: -40%
- 内存占用: -30%
- 命令隔离: 提升

**实施难度**: ⭐⭐ (低)
**风险评估**: 低 - 不影响功能

---

### 4. 统一状态管理层 📦

**问题**: 状态存储碎片化（JSON、SQLite、内存）

**目标架构**:
```typescript
// lib/state-manager.ts
export class StateManager {
  constructor(private backend: StateBackend) {}

  async read<T>(key: string): Promise<T | null>;
  async write<T>(key: string, value: T): Promise<void>;
  async delete(key: string): Promise<void>;
  async transaction<T>(fn: () => Promise<T>): Promise<T>;
  async list(prefix: string): Promise<string[]>;
}

// 支持多种后端
interface StateBackend {
  read(key: string): Promise<any>;
  write(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}

class FileBackend implements StateBackend { /* ... */ }
class SQLiteBackend implements StateBackend { /* ... */ }
```

**迁移路径**:
1. 实现统一接口
2. 逐步迁移现有代码
3. 保持向后兼容
4. 添加迁移工具

**预期收益**:
- 数据一致性: +100%
- 调试难度: -50%
- 代码重用: +40%

**实施难度**: ⭐⭐⭐⭐ (高)
**风险评估**: 高 - 影响所有模块

---

## 中期目标（3-6 个月）

### 5. 自动重试和熔断机制 🛡️

**缺失功能**: 无自动重试、无熔断器、无模型降级

**实现方案**:
```typescript
// lib/resilience/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts = 3, backoff = 'exponential' } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetriable(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(calculateBackoff(attempt, backoff));
    }
  }
}

// lib/resilience/circuit-breaker.ts
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}

// lib/resilience/model-fallback.ts
export async function withModelFallback<T>(
  task: AgentTask,
  models: Model[] = ['opus', 'sonnet', 'haiku']
): Promise<T> {
  for (const model of models) {
    try {
      return await executeWithModel(task, model);
    } catch (error) {
      if (isLastModel(model, models)) throw error;
      console.warn(`Model ${model} failed, trying next...`);
    }
  }
}
```

**集成点**:
- Agent 执行层
- MCP 工具调用
- 外部 API 调用

**预期收益**:
- 可靠性: +40%
- 用户体验: +30%
- 成本优化: +20%

**实施难度**: ⭐⭐⭐ (中)
**风险评估**: 中 - 需要仔细测试边界情况

---

### 6. Agent 配置化 ⚙️

**问题**: Agent 定义与实现耦合，扩展困难

**目标架构**:
```yaml
# agents/registry/executor.yaml
id: executor
name: Code Executor
model: sonnet
capabilities:
  - code-editing
  - refactoring
  - feature-implementation
prompt_template: agents/prompts/executor.md
timeout: 300s
retry_policy:
  max_attempts: 3
  backoff: exponential
cost_limit:
  max_tokens: 100000
  max_cost_usd: 5.0
```

```typescript
// agents/loader.ts
export class AgentLoader {
  async load(agentId: string): Promise<AgentConfig> {
    const yaml = await readFile(`agents/registry/${agentId}.yaml`);
    const config = parseYAML(yaml);
    const prompt = await readFile(config.prompt_template);
    return { ...config, prompt };
  }
}
```

**预期收益**:
- 扩展性: +100%
- 热重载: 支持
- A/B 测试: 支持
- 配置管理: 简化

**实施难度**: ⭐⭐⭐ (中)
**风险评估**: 中 - 需要迁移现有 Agent

---

### 7. MCP 服务器统一 🔌

**问题**: 3个独立服务器，代码重复

**统一架构**:
```typescript
// mcp/server-factory.ts
export function createMCPServer(config: ServerConfig): MCPServer {
  const jobStore = config.useDB
    ? new SQLiteJobStore(config.dbPath)
    : new FileJobStore(config.statePath);

  return new MCPServer({
    name: config.name,
    version: config.version,
    provider: config.provider,
    jobStore,
    tools: config.tools,
    resources: config.resources
  });
}

// bridge/codex-server.cjs
const server = createMCPServer({
  name: 'ultrapower-codex',
  provider: new CodexProvider(),
  useDB: true,
  tools: [askCodexTool, checkJobTool, ...]
});

// bridge/gemini-server.cjs
const server = createMCPServer({
  name: 'ultrapower-gemini',
  provider: new GeminiProvider(),
  useDB: true,
  tools: [askGeminiTool, checkJobTool, ...]
});
```

**预期收益**:
- 构建时间: -40%
- 代码重用: +60%
- 维护成本: -50%

**实施难度**: ⭐⭐ (低)
**风险评估**: 低 - 不影响功能

---

### 8. OpenTelemetry 追踪 📊

**缺失功能**: 无分布式追踪、无结构化日志

**实现方案**:
```typescript
// lib/telemetry/tracer.ts
import { trace, context } from '@opentelemetry/api';

export class AgentTracer {
  private tracer = trace.getTracer('ultrapower');

  async traceAgentExecution<T>(
    agentType: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.tracer.startActiveSpan(
      `agent.${agentType}`,
      async (span) => {
        try {
          span.setAttribute('agent.type', agentType);
          span.setAttribute('agent.model', getModel(agentType));

          const result = await fn();

          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }
}
```

**导出目标**:
- Console (开发)
- File (生产)
- Jaeger (可选)
- Zipkin (可选)

**预期收益**:
- 可观测性: +100%
- 调试效率: +50%
- 性能分析: 支持

**实施难度**: ⭐⭐⭐ (中)
**风险评估**: 低 - 不影响核心功能

---

## 长期愿景（6-12 个月）

### 9. 结果缓存系统 💾

**目标**: 降低重复调用成本

**架构设计**:
```typescript
// lib/cache/agent-cache.ts
export class AgentCache {
  constructor(private backend: CacheBackend) {}

  async get<T>(key: CacheKey): Promise<T | null> {
    const cached = await this.backend.get(key.toString());
    if (!cached) return null;

    if (this.isExpired(cached)) {
      await this.backend.delete(key.toString());
      return null;
    }

    return cached.value;
  }

  async set<T>(key: CacheKey, value: T, ttl: number): Promise<void> {
    await this.backend.set(key.toString(), {
      value,
      expiresAt: Date.now() + ttl
    });
  }
}

// 缓存键生成
interface CacheKey {
  agentType: string;
  prompt: string;
  context: string[];
  model: string;
}
```

**缓存策略**:
- TTL: 1小时（默认）
- 最大大小: 1GB
- 淘汰策略: LRU

**预期收益**:
- 成本: -30-50%
- 响应时间: -60%

**实施难度**: ⭐⭐⭐ (中)
**风险评估**: 中 - 需要处理缓存失效

---

### 10. 流式 API 支持 🌊

**目标**: 实时反馈，提升用户体验

**实现方案**:
```typescript
// lib/streaming/agent-stream.ts
export async function* streamAgentExecution(
  task: AgentTask
): AsyncGenerator<AgentEvent> {
  yield { type: 'start', agentType: task.agentType };

  for await (const chunk of callModelStream(task)) {
    yield { type: 'chunk', content: chunk };
  }

  yield { type: 'complete', result: task.result };
}

// 使用示例
for await (const event of streamAgentExecution(task)) {
  switch (event.type) {
    case 'start':
      console.log(`Starting ${event.agentType}...`);
      break;
    case 'chunk':
      process.stdout.write(event.content);
      break;
    case 'complete':
      console.log('\nCompleted!');
      break;
  }
}
```

**预期收益**:
- 用户体验: +40%
- 感知性能: +50%

**实施难度**: ⭐⭐⭐⭐ (高)
**风险评估**: 中 - 需要重构执行层

---

### 11. 可视化调试面板 🎨

**目标**: 提供图形化的工作流监控

**功能清单**:
1. **实时执行视图**
   - Agent 执行状态
   - 任务队列
   - 资源使用

2. **历史记录**
   - 执行历史
   - 性能趋势
   - 成本分析

3. **调试工具**
   - 断点设置
   - 状态检查
   - 日志查看

**技术栈**:
- 前端: React + TailwindCSS
- 后端: Express + WebSocket
- 数据: SQLite

**预期收益**:
- 调试效率: +60%
- 用户体验: +50%

**实施难度**: ⭐⭐⭐⭐⭐ (高)
**风险评估**: 低 - 独立模块

---

## 技术方案概要

### 关键技术选型

| 领域 | 技术选型 | 理由 |
|------|---------|------|
| 状态管理 | 文件系统 + SQLite | 简单可靠，支持复杂查询 |
| 可观测性 | OpenTelemetry | 行业标准，生态丰富 |
| 缓存 | LRU + 文件系统 | 轻量级，无额外依赖 |
| 测试 | Vitest + Mock | 快速，TypeScript 友好 |
| 构建 | esbuild + tsc | 快速编译，类型检查 |

### 实施路径

**阶段 1: 性能优化（1-2周）**
```
测试优化 → CLI 懒加载 → hooks 拆分
```

**阶段 2: 可靠性提升（1-2月）**
```
统一状态管理 → 重试机制 → Agent 配置化
```

**阶段 3: 可观测性增强（3-6月）**
```
OpenTelemetry → 性能监控 → 调试面板
```

**阶段 4: 成本优化（6-12月）**
```
结果缓存 → 流式 API → 智能路由
```

### 里程碑定义

**M1: 性能提升版 (v6.1.0)** - 2周后
- ✅ 测试时间 <5秒
- ✅ CLI 启动 -40%
- ✅ hooks 模块化

**M2: 可靠性版 (v6.5.0)** - 2月后
- ✅ 统一状态管理
- ✅ 自动重试机制
- ✅ Agent 配置化

**M3: 可观测性版 (v7.0.0)** - 6月后
- ✅ OpenTelemetry 追踪
- ✅ 性能监控面板
- ✅ 结果缓存

**M4: 企业级版 (v7.5.0)** - 12月后
- ✅ 流式 API
- ✅ 可视化调试
- ✅ 分布式部署

---

## 风险评估

### 技术风险

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| hooks 拆分破坏现有功能 | 中 | 高 | 完整回归测试 + 金丝雀发布 |
| 状态管理迁移数据丢失 | 低 | 高 | 迁移工具 + 备份机制 |
| OpenTelemetry 性能开销 | 中 | 中 | 采样率控制 + 可选启用 |
| 缓存失效导致错误结果 | 中 | 高 | 严格的缓存键设计 + TTL |

### 资源风险

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| 开发时间不足 | 中 | 中 | 优先级排序 + 分阶段实施 |
| 测试覆盖不足 | 中 | 高 | 自动化测试 + 代码审查 |
| 文档更新滞后 | 高 | 中 | 文档优先 + 自动生成 |

### 兼容性风险

| 风险 | 概率 | 影响 | 缓解策略 |
|------|------|------|---------|
| 破坏现有 Skill | 低 | 高 | 向后兼容 + 迁移指南 |
| MCP 协议变更 | 中 | 中 | 版本锁定 + 适配层 |
| Node.js 版本要求 | 低 | 低 | 保持 ≥20.0.0 |

---

## 成功指标

### 性能指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| 测试时间 | 34s | <5s | `npm test` |
| CLI 启动 | ~200ms | <120ms | `time omc --help` |
| Agent 启动 | ~500ms | <300ms | Trace 数据 |
| 内存占用 | ~50MB | <40MB | `process.memoryUsage()` |

### 可靠性指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| 成功率 | ~95% | >98% | 执行日志统计 |
| 平均重试次数 | N/A | <0.5 | Telemetry 数据 |
| 熔断触发率 | N/A | <1% | 监控面板 |

### 成本指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| 平均 Token 消耗 | 基准 | -30% | Token 计数器 |
| 缓存命中率 | 0% | >40% | 缓存统计 |
| 模型降级率 | 0% | <10% | 路由日志 |

### 开发体验指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| 新 Agent 开发时间 | ~2h | <30min | 开发者反馈 |
| Bug 修复时间 | ~1h | <30min | Issue 追踪 |
| 文档完整性 | ~80% | >95% | 文档覆盖率 |

---

## 结论

ultrapower v6.0.0 已经是一个功能完整、架构优秀的多 Agent 编排框架。本路线图聚焦于三个核心方向：

1. **性能优化** - 解决开发体验痛点，提升 40-50% 效率
2. **可靠性提升** - 添加企业级错误处理，提升 30% 稳定性
3. **可观测性增强** - 实现全链路追踪，提升 100% 可调试性

通过分阶段实施，我们可以在不破坏现有功能的前提下，逐步将 ultrapower 打造成行业领先的 AI Agent 编排平台。

**下一步行动**:
1. Team-lead 审查并确认优先级
2. 创建 GitHub Issues 追踪各项任务
3. 启动 M1 里程碑（性能提升版）

---

**制定者**: planner agent
**审核者**: 待 team-lead 确认
**状态**: 待审核
