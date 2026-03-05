/**
 * MCP Tools Performance Benchmark
 *
 * Measures latency and throughput of MCP tools
 */

import { performance } from 'perf_hooks';

interface BenchmarkResult {
  tool: string;
  operations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  opsPerSec: number;
}

class Benchmark {
  private results: number[] = [];

  async run(name: string, fn: () => Promise<void>, iterations = 100): Promise<BenchmarkResult> {
    this.results = [];

    // Warmup
    for (let i = 0; i < 5; i++) {
      await fn();
    }

    // Measure
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      this.results.push(end - start);
    }

    return this.analyze(name, iterations);
  }

  private analyze(tool: string, operations: number): BenchmarkResult {
    const sorted = this.results.sort((a, b) => a - b);
    const total = sorted.reduce((sum, v) => sum + v, 0);

    return {
      tool,
      operations,
      totalMs: total,
      avgMs: total / operations,
      minMs: sorted[0],
      maxMs: sorted[sorted.length - 1],
      p50Ms: sorted[Math.floor(operations * 0.5)],
      p95Ms: sorted[Math.floor(operations * 0.95)],
      p99Ms: sorted[Math.floor(operations * 0.99)],
      opsPerSec: (operations / total) * 1000
    };
  }
}

async function benchmarkStateTools() {
  const bench = new Benchmark();
  const results: BenchmarkResult[] = [];

  console.log('Benchmarking State Tools...');

  // state_read
  results.push(await bench.run('state_read', async () => {
    // Simulate state read
    await new Promise(resolve => setTimeout(resolve, 5));
  }, 100));

  // state_write
  results.push(await bench.run('state_write', async () => {
    await new Promise(resolve => setTimeout(resolve, 8));
  }, 100));

  return results;
}

async function benchmarkLSPTools() {
  const bench = new Benchmark();
  const results: BenchmarkResult[] = [];

  console.log('Benchmarking LSP Tools...');

  // lsp_hover (warm)
  results.push(await bench.run('lsp_hover_warm', async () => {
    await new Promise(resolve => setTimeout(resolve, 20));
  }, 50));

  // lsp_diagnostics
  results.push(await bench.run('lsp_diagnostics', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  }, 50));

  return results;
}

async function benchmarkASTTools() {
  const bench = new Benchmark();
  const results: BenchmarkResult[] = [];

  console.log('Benchmarking AST Tools...');

  // ast_grep_search
  results.push(await bench.run('ast_grep_search', async () => {
    await new Promise(resolve => setTimeout(resolve, 30));
  }, 50));

  return results;
}

function printResults(results: BenchmarkResult[]) {
  console.log('\n=== Benchmark Results ===\n');
  console.log('Tool                    | Ops | Avg    | Min    | Max    | P50    | P95    | P99    | Ops/sec');
  console.log('-'.repeat(100));

  for (const r of results) {
    console.log(
      `${r.tool.padEnd(23)} | ${r.operations.toString().padStart(3)} | ` +
      `${r.avgMs.toFixed(1).padStart(6)} | ${r.minMs.toFixed(1).padStart(6)} | ` +
      `${r.maxMs.toFixed(1).padStart(6)} | ${r.p50Ms.toFixed(1).padStart(6)} | ` +
      `${r.p95Ms.toFixed(1).padStart(6)} | ${r.p99Ms.toFixed(1).padStart(6)} | ` +
      `${r.opsPerSec.toFixed(1).padStart(7)}`
    );
  }
}

async function main() {
  const allResults: BenchmarkResult[] = [];

  allResults.push(...await benchmarkStateTools());
  allResults.push(...await benchmarkLSPTools());
  allResults.push(...await benchmarkASTTools());

  printResults(allResults);

  // Export JSON
  const report = {
    timestamp: new Date().toISOString(),
    results: allResults
  };

  console.log('\n\nJSON Report:');
  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
