import * as fs from 'fs';
import * as path from 'path';
export class MetricsCollector {
    metricsDir;
    constructor(baseDir = '.omc/metrics') {
        this.metricsDir = path.resolve(baseDir);
        this.ensureDir().catch(() => {
            // Ignore initialization errors
        });
    }
    async ensureDir() {
        try {
            await fs.promises.access(this.metricsDir);
        }
        catch {
            await fs.promises.mkdir(this.metricsDir, { recursive: true });
        }
    }
    async record(type, value, metadata) {
        const metric = {
            timestamp: Date.now(),
            type,
            value,
            metadata
        };
        const file = path.join(this.metricsDir, `${type}.jsonl`);
        try {
            await fs.promises.appendFile(file, JSON.stringify(metric) + '\n');
        }
        catch (error) {
            throw new Error(`Failed to record metric: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getMetrics(type, since) {
        const file = path.join(this.metricsDir, `${type}.jsonl`);
        let content;
        try {
            content = await fs.promises.readFile(file, 'utf-8');
        }
        catch {
            return [];
        }
        const lines = content.trim().split('\n').filter(Boolean);
        const metrics = lines.map(line => {
            try {
                return JSON.parse(line);
            }
            catch {
                return null;
            }
        }).filter((m) => m !== null);
        return since ? metrics.filter(m => m.timestamp >= since) : metrics;
    }
    async getBaseline(type) {
        const file = path.join(this.metricsDir, 'baseline.json');
        let content;
        try {
            content = await fs.promises.readFile(file, 'utf-8');
        }
        catch {
            return null;
        }
        const baseline = JSON.parse(content);
        return baseline[type] || null;
    }
    async setBaseline(type, value) {
        const file = path.join(this.metricsDir, 'baseline.json');
        let baseline = {};
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            baseline = JSON.parse(content);
        }
        catch {
            // File doesn't exist, use empty baseline
        }
        baseline[type] = value;
        // Atomic write: temp file + rename
        const tmpFile = `${file}.tmp`;
        await fs.promises.writeFile(tmpFile, JSON.stringify(baseline, null, 2));
        await fs.promises.rename(tmpFile, file);
    }
    async exportToJSON(outputPath) {
        const types = ['build', 'worker_health', 'worker_status', 'lsp_init', 'memory'];
        const data = {};
        for (const type of types) {
            data[type] = await this.getMetrics(type);
        }
        await fs.promises.writeFile(outputPath, JSON.stringify(data, null, 2));
    }
    async exportToCSV(type, outputPath) {
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
//# sourceMappingURL=metrics-collector.js.map