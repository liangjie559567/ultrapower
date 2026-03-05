# MCP Performance Benchmarks

## Running Benchmarks

```bash
# Run all benchmarks
npm run bench

# Run specific benchmark
tsx benchmarks/mcp-tools.bench.ts
```

## Benchmark Suite

### 1. MCP Tools (`mcp-tools.bench.ts`)

Measures latency and throughput of:
- State tools (read, write)
- LSP tools (hover, diagnostics)
- AST tools (search)

**Metrics**:
- Average latency (ms)
- Min/Max latency (ms)
- Percentiles (P50, P95, P99)
- Operations per second

### 2. Expected Results

| Tool | Avg Latency | P95 | Ops/sec |
|------|-------------|-----|---------|
| state_read | 5ms | 8ms | 200 |
| state_write | 8ms | 12ms | 125 |
| lsp_hover_warm | 20ms | 30ms | 50 |
| lsp_diagnostics | 50ms | 80ms | 20 |
| ast_grep_search | 30ms | 50ms | 33 |

## Interpreting Results

### Good Performance
- State tools: < 10ms avg
- LSP tools: < 50ms avg (warm)
- AST tools: < 100ms avg

### Poor Performance
- State tools: > 50ms (check disk I/O)
- LSP tools: > 200ms (restart LSP server)
- AST tools: > 500ms (reduce search scope)

## Optimization Tips

1. **Cache frequently accessed state**
2. **Reuse LSP server connections**
3. **Limit AST search patterns**
4. **Use parallel execution for independent operations**

## Report Format

Results saved to `benchmarks/report.json`:

```json
{
  "timestamp": "2026-03-05T03:20:48.435Z",
  "benchmarks": [
    {
      "benchmark": "mcp-tools.bench.ts",
      "output": "...",
      "success": true
    }
  ]
}
```
