import { MetricsCollector, Metric } from './metrics-collector.js';

interface Stats {
  avg: number;
  min: number;
  max: number;
  p95: number;
  count: number;
}

export class Dashboard {
  private collector: MetricsCollector;

  constructor(baseDir?: string) {
    this.collector = new MetricsCollector(baseDir);
  }

  private calculateStats(values: number[]): Stats {
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[p95Index] || sorted[sorted.length - 1],
      count: sorted.length
    };
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private formatMemory(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  private checkRegression(type: Metric['type'], current: number): string {
    const baseline = this.collector.getBaseline(type);
    if (!baseline) return '';

    const thresholds: Record<Metric['type'], number> = {
      build: 1.2,
      worker_health: 1.5,
      worker_status: 1.5,
      lsp_init: 1.5,
      memory: 1.5
    };

    const threshold = thresholds[type];
    const ratio = current / baseline;

    if (ratio > threshold) {
      return ` ⚠️  +${((ratio - 1) * 100).toFixed(0)}% vs baseline`;
    }
    return '';
  }

  display(hours: number = 24): void {
    const since = Date.now() - hours * 3600 * 1000;
    const types: Metric['type'][] = ['build', 'worker_health', 'worker_status', 'lsp_init', 'memory'];

    console.log('\n📊 Performance Dashboard\n');
    console.log(`Period: Last ${hours}h\n`);

    types.forEach(type => {
      const metrics = this.collector.getMetrics(type, since);
      if (metrics.length === 0) {
        console.log(`${type}: No data`);
        return;
      }

      const values = metrics.map((m: Metric) => m.value);
      const stats = this.calculateStats(values);
      const formatter = type === 'memory' ? this.formatMemory : this.formatDuration;
      const regression = this.checkRegression(type, stats.avg);

      console.log(`${type}:`);
      console.log(`  avg: ${formatter(stats.avg)}${regression}`);
      console.log(`  p95: ${formatter(stats.p95)}`);
      console.log(`  min: ${formatter(stats.min)} | max: ${formatter(stats.max)}`);
      console.log(`  samples: ${stats.count}\n`);
    });
  }

  setBaselines(): void {
    const types: Metric['type'][] = ['build', 'worker_health', 'worker_status', 'lsp_init', 'memory'];

    types.forEach(type => {
      const metrics = this.collector.getMetrics(type);
      if (metrics.length > 0) {
        const values = metrics.map((m: Metric) => m.value);
        const stats = this.calculateStats(values);
        this.collector.setBaseline(type, stats.avg);
      }
    });

    console.log('✅ Baselines updated');
  }

  export(format: 'json' | 'csv', outputPath: string, type?: Metric['type']): void {
    if (format === 'json') {
      this.collector.exportToJSON(outputPath);
      console.log(`✅ Exported to ${outputPath}`);
    } else if (type) {
      this.collector.exportToCSV(type, outputPath);
      console.log(`✅ Exported ${type} to ${outputPath}`);
    }
  }
}
