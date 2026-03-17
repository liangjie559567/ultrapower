# MCP Performance

## Benchmarks

### Tool Latency

| Tool | Cold Start | Warm | Notes |
| ------ | ----------- | ------ | ------- |
| `ultrapower:lsp_hover` | 150ms | 20ms | LSP server cached |
| `ultrapower:lsp_diagnostics` | 300ms | 50ms | File-level |
| `ultrapower:lsp_diagnostics_directory` | 2s | 500ms | Directory scan |
| `ast_grep_search` | 100ms | 30ms | Pattern complexity varies |
| `state_read` | 10ms | 5ms | JSON parse |
| `notepad_read` | 15ms | 8ms | Markdown parse |
| `ask_codex` | 5-30s | N/A | Network + LLM |
| `ask_gemini` | 10-60s | N/A | Network + LLM |

### Throughput

* **LSP tools**: 50 ops/sec (per language server)

* **AST tools**: 20 ops/sec (CPU-bound)

* **State tools**: 200 ops/sec (I/O-bound)

* **AI providers**: 1-2 ops/min (rate limited)

### Memory Usage

| Server | Idle | Active | Peak |
| -------- | ------ | -------- | ------ |
| OMC Tools | 50MB | 100MB | 200MB |
| Codex | 30MB | 50MB | 100MB |
| Gemini | 30MB | 80MB | 150MB |

## Optimization Strategies

### 1. Connection Pooling

LSP servers persist across calls:

```typescript
const serverPool = new Map<string, LSPServer>();

function getServer(language: string): LSPServer {
  if (!serverPool.has(language)) {
    serverPool.set(language, new LSPServer(language));
  }
  return serverPool.get(language)!;
}
```

**Impact**: 10x faster warm starts

### 2. Parallel Execution

Run independent tools concurrently:

```typescript
const [hover, refs, symbols] = await Promise.all([
  mcp__plugin_ultrapower_t__lsp_hover({ file, line, character }),
  mcp__plugin_ultrapower_t__lsp_find_references({ file, line, character }),
  mcp__plugin_ultrapower_t__lsp_document_symbols({ file })
]);
```

**Impact**: 3x faster for multi-tool workflows

### 3. Caching

Cache expensive operations:

```typescript
const cache = new Map<string, { result: any; timestamp: number }>();

async function cachedCall(key: string, fn: () => Promise<any>, ttl = 60000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.result;
  }
  const result = await fn();
  cache.set(key, { result, timestamp: Date.now() });
  return result;
}
```

**Impact**: 100x faster for repeated queries

### 4. Background Jobs

Offload long tasks:

```typescript
const job = await mcp__x__ask_codex({
  task: 'Large analysis',
  background: true
});

// Continue other work
await doOtherWork();

// Check result later
const result = await mcp__x__wait_for_job({ job_id: job.job_id });
```

**Impact**: Unblocks main thread

### 5. Batch Operations

Group related calls:

```typescript
// Bad - 10 separate calls
for (const file of files) {
  await mcp__plugin_ultrapower_t__lsp_diagnostics({ file });
}

// Good - 1 directory call
await mcp__plugin_ultrapower_t__lsp_diagnostics_directory({
  directory: 'src/'
});
```

**Impact**: 5x faster for bulk operations

## Profiling

### Enable Debug Logging

```json
{
  "env": {
    "OMC_LOG_LEVEL": "debug"
  }
}
```

Output includes timing:
```
[debug] ultrapower:lsp_hover started
[debug] ultrapower:lsp_hover completed in 23ms
```

### Measure Tool Calls

```typescript
async function measureTool<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    console.error(`[perf] ${name}: ${Date.now() - start}ms`);
    return result;
  } catch (error) {
    console.error(`[perf] ${name}: failed after ${Date.now() - start}ms`);
    throw error;
  }
}
```

### Identify Bottlenecks

```typescript
const trace = await mcp__plugin_ultrapower_t__trace_timeline({
  session_id: 'current'
});

// Analyze slowest operations
const sorted = trace.events.sort((a, b) => b.duration - a.duration);
console.log('Top 10 slowest:', sorted.slice(0, 10));
```

## Best Practices

### 1. Minimize Context

```typescript
// Bad - entire codebase
context_files: ['src/', 'tests/', 'docs/']

// Good - relevant files only
context_files: ['src/auth/login.ts', 'src/auth/session.ts']
```

### 2. Use Appropriate Timeouts

```typescript
// Quick operations
timeout: 5000  // 5s

// AI analysis
timeout: 300000  // 5min
```

### 3. Retry with Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await sleep(1000 * Math.pow(2, i));
    }
  }
  throw new Error('Unreachable');
}
```

### 4. Monitor Memory

```typescript
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 500 * 1024 * 1024) {
    console.warn('High memory usage:', usage.heapUsed / 1024 / 1024, 'MB');
  }
}, 60000);
```

### 5. Graceful Degradation

```typescript
try {
  return await mcp__x__ask_codex({ task, agent_role });
} catch (error) {
  console.warn('Codex unavailable, using local agent');
  return await Task({ subagent_type: 'ultrapower:' + agent_role, prompt: task });
}
```

## Scaling

### Horizontal Scaling

Run multiple server instances:

```json
{
  "mcpServers": {
    "codex-1": { "command": "node", "args": ["bridge/codex-server.cjs"] },
    "codex-2": { "command": "node", "args": ["bridge/codex-server.cjs"] }
  }
}
```

Load balance across instances.

### Rate Limiting

Respect provider limits:

```typescript
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  perMilliseconds: 60000
});

await rateLimiter.acquire();
const result = await mcp__x__ask_codex({ task, agent_role });
```

### Resource Limits

Set memory/CPU caps:

```json
{
  "command": "node",
  "args": ["--max-old-space-size=512", "bridge/mcp-server.cjs"]
}
```

## Monitoring

### Metrics to Track

* Tool call latency (p50, p95, p99)

* Error rate by tool

* Memory usage over time

* Active connections

* Queue depth

### Alerting

```typescript
if (errorRate > 0.05) {
  notifyOps('MCP error rate above 5%');
}

if (avgLatency > 5000) {
  notifyOps('MCP latency above 5s');
}
```

## Next Steps

* [Overview](./overview.md) - Architecture

* [Server Guide](./server-guide.md) - Build servers

* [Client Guide](./client-guide.md) - Use tools
