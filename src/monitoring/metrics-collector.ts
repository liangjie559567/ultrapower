import * as fs from 'fs';
import * as path from 'path';

export interface Metric {
  timestamp: number;
  type: 'build' | 'worker_health' | 'worker_status' | 'lsp_init' | 'memory';
  value: number;
  metadata?: Record<string, any>;
}

export class MetricsCollector {
  private metricsDir: string;

  constructor(baseDir: string = '.omc/metrics') {
    this.metricsDir = path.resolve(baseDir);
    this.ensureDir();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  record(type: Metric['type'], value: number, metadata?: Record<string, any>): void {
    const metric: Metric = {
      timestamp: Date.now(),
      type,
      value,
      metadata
    };

    const file = path.join(this.metricsDir, `${type}.jsonl`);
    fs.appendFileSync(file, JSON.stringify(metric) + '\n');
  }

  getMetrics(type: Metric['type'], since?: number): Metric[] {
    const file = path.join(this.metricsDir, `${type}.jsonl`);
    if (!fs.existsSync(file)) return [];

    const lines = fs.readFileSync(file, 'utf-8').trim().split('\n').filter(Boolean);
    const metrics = lines.map(line => JSON.parse(line) as Metric);

    return since ? metrics.filter(m => m.timestamp >= since) : metrics;
  }

  getBaseline(type: Metric['type']): number | null {
    const file = path.join(this.metricsDir, 'baseline.json');
    if (!fs.existsSync(file)) return null;

    const baseline = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return baseline[type] || null;
  }

  setBaseline(type: Metric['type'], value: number): void {
    const file = path.join(this.metricsDir, 'baseline.json');
    const baseline = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf-8'))
      : {};

    baseline[type] = value;
    fs.writeFileSync(file, JSON.stringify(baseline, null, 2));
  }

  exportToJSON(outputPath: string): void {
    const types: Metric['type'][] = ['build', 'worker_health', 'worker_status', 'lsp_init', 'memory'];
    const data: Record<string, Metric[]> = {};

    types.forEach(type => {
      data[type] = this.getMetrics(type);
    });

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  exportToCSV(type: Metric['type'], outputPath: string): void {
    const metrics = this.getMetrics(type);
    if (metrics.length === 0) {
      fs.writeFileSync(outputPath, 'timestamp,type,value\n');
      return;
    }

    const csv = ['timestamp,type,value'];
    metrics.forEach(m => {
      csv.push(`${m.timestamp},${m.type},${m.value}`);
    });

    fs.writeFileSync(outputPath, csv.join('\n'));
  }
}
