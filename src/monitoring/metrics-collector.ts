import * as fs from 'fs';
import * as path from 'path';

export interface Metric {
  timestamp: number;
  type: 'build' | 'worker_health' | 'worker_status' | 'lsp_init' | 'memory';
  value: number;
  metadata?: Record<string, unknown>;
}

export class MetricsCollector {
  private metricsDir: string;

  constructor(baseDir: string = '.omc/metrics') {
    this.metricsDir = path.resolve(baseDir);
    this.ensureDir().catch(() => {
      // Ignore initialization errors
    });
  }

  private async ensureDir(): Promise<void> {
    try {
      await fs.promises.access(this.metricsDir);
    } catch {
      await fs.promises.mkdir(this.metricsDir, { recursive: true });
    }
  }

  async record(type: Metric['type'], value: number, metadata?: Record<string, unknown>): Promise<void> {
    const metric: Metric = {
      timestamp: Date.now(),
      type,
      value,
      metadata
    };

    const file = path.join(this.metricsDir, `${type}.jsonl`);
    await fs.promises.appendFile(file, JSON.stringify(metric) + '\n');
  }

  async getMetrics(type: Metric['type'], since?: number): Promise<Metric[]> {
    const file = path.join(this.metricsDir, `${type}.jsonl`);
    try {
      await fs.promises.access(file);
    } catch {
      return [];
    }

    const content = await fs.promises.readFile(file, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const metrics = lines.map(line => JSON.parse(line) as Metric);

    return since ? metrics.filter(m => m.timestamp >= since) : metrics;
  }

  async getBaseline(type: Metric['type']): Promise<number | null> {
    const file = path.join(this.metricsDir, 'baseline.json');
    try {
      await fs.promises.access(file);
    } catch {
      return null;
    }

    const content = await fs.promises.readFile(file, 'utf-8');
    const baseline = JSON.parse(content);
    return baseline[type] || null;
  }

  async setBaseline(type: Metric['type'], value: number): Promise<void> {
    const file = path.join(this.metricsDir, 'baseline.json');
    let baseline: Record<string, number> = {};

    try {
      await fs.promises.access(file);
      const content = await fs.promises.readFile(file, 'utf-8');
      baseline = JSON.parse(content);
    } catch {
      // File doesn't exist, use empty baseline
    }

    baseline[type] = value;
    await fs.promises.writeFile(file, JSON.stringify(baseline, null, 2));
  }

  async exportToJSON(outputPath: string): Promise<void> {
    const types: Metric['type'][] = ['build', 'worker_health', 'worker_status', 'lsp_init', 'memory'];
    const data: Record<string, Metric[]> = {};

    for (const type of types) {
      data[type] = await this.getMetrics(type);
    }

    await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2));
  }

  async exportToCSV(type: Metric['type'], outputPath: string): Promise<void> {
    const metrics = await this.getMetrics(type);
    if (metrics.length === 0) {
      await fs.promises.writeFile(outputPath, 'timestamp,type,value\n');
      return;
    }

    const csv = ['timestamp,type,value'];
    metrics.forEach(m => {
      csv.push(`${m.timestamp},${m.type},${m.value}`);
    });

    await fs.promises.writeFile(outputPath, csv.join('\n'));
  }
}
