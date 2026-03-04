/**
 * Performance Profiling Tool for Hook Execution
 *
 * Measures hook execution time and identifies bottlenecks.
 * Generates baseline performance report for optimization tracking.
 */

import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface HookProfile {
  hookType: string;
  executions: number[];
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  total: number;
}

interface ProfilingResult {
  timestamp: string;
  totalHooks: number;
  profiles: Record<string, HookProfile>;
  top10Slowest: Array<{ hookType: string; p95: number }>;
  amdahlLimit: number;
}

class HookProfiler {
  private measurements: Map<string, number[]> = new Map();

  startMeasure(hookType: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      const existing = this.measurements.get(hookType) || [];
      existing.push(duration);
      this.measurements.set(hookType, existing);
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  generateReport(): ProfilingResult {
    const profiles: Record<string, HookProfile> = {};

    for (const [hookType, times] of this.measurements.entries()) {
      profiles[hookType] = {
        hookType,
        executions: times,
        p50: this.percentile(times, 50),
        p95: this.percentile(times, 95),
        p99: this.percentile(times, 99),
        mean: times.reduce((a, b) => a + b, 0) / times.length,
        total: times.reduce((a, b) => a + b, 0),
      };
    }

    const top10 = Object.values(profiles)
      .sort((a, b) => b.p95 - a.p95)
      .slice(0, 10)
      .map(p => ({ hookType: p.hookType, p95: p.p95 }));

    const totalTime = Object.values(profiles).reduce((sum, p) => sum + p.total, 0);
    const parallelizableTime = top10.reduce((sum, p) => sum + (profiles[p.hookType]?.total || 0), 0);
    const amdahlLimit = totalTime / (totalTime - parallelizableTime + parallelizableTime / 4);

    return {
      timestamp: new Date().toISOString(),
      totalHooks: this.measurements.size,
      profiles,
      top10Slowest: top10,
      amdahlLimit,
    };
  }

  saveBaseline(outputPath: string): void {
    const report = this.generateReport();
    writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Baseline saved to ${outputPath}`);
    console.log(`Total hooks profiled: ${report.totalHooks}`);
    console.log(`Top 10 slowest hooks (p95):`);
    report.top10Slowest.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.hookType}: ${h.p95.toFixed(2)}ms`);
    });
    console.log(`Amdahl's Law speedup limit: ${report.amdahlLimit.toFixed(2)}x`);
  }
}

export { HookProfiler, type ProfilingResult, type HookProfile };
