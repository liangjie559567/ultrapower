import { Span } from '@opentelemetry/api';

interface Metric {
  timestamp: number;
  duration: number;
  tokens?: number;
}

class PerformanceMonitor {
  private metrics: Metric[] = [];
  private maxSize = 10000;

  recordSpan(span: Span, tokens?: number, duration?: number): void {
    const actualDuration = duration ?? 0;
    this.metrics.push({ timestamp: Date.now(), duration: actualDuration, tokens });
    if (this.metrics.length > this.maxSize) this.metrics.shift();
  }

  getPercentile(p: number): number {
    if (this.metrics.length === 0) return 0;
    const sorted = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[idx];
  }

  getMetrics() {
    const now = Date.now();
    const recent = this.metrics.filter(m => now - m.timestamp < 60000);
    return {
      p50: this.getPercentile(50),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
      throughput: recent.length / 60,
      totalTokens: this.metrics.reduce((sum, m) => sum + (m.tokens || 0), 0)
    };
  }
}

export const monitor = new PerformanceMonitor();
