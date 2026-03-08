import * as fs from 'fs';
import * as path from 'path';
export class MetricsCollector {
    metricsDir;
    constructor(baseDir = '.omc/metrics') {
        this.metricsDir = path.resolve(baseDir);
        this.ensureDir();
    }
    ensureDir() {
        if (!fs.existsSync(this.metricsDir)) {
            fs.mkdirSync(this.metricsDir, { recursive: true });
        }
    }
    record(type, value, metadata) {
        const metric = {
            timestamp: Date.now(),
            type,
            value,
            metadata
        };
        const file = path.join(this.metricsDir, `${type}.jsonl`);
        fs.appendFileSync(file, JSON.stringify(metric) + '\n');
    }
    getMetrics(type, since) {
        const file = path.join(this.metricsDir, `${type}.jsonl`);
        if (!fs.existsSync(file))
            return [];
        const lines = fs.readFileSync(file, 'utf-8').trim().split('\n').filter(Boolean);
        const metrics = lines.map(line => JSON.parse(line));
        return since ? metrics.filter(m => m.timestamp >= since) : metrics;
    }
    getBaseline(type) {
        const file = path.join(this.metricsDir, 'baseline.json');
        if (!fs.existsSync(file))
            return null;
        const baseline = JSON.parse(fs.readFileSync(file, 'utf-8'));
        return baseline[type] || null;
    }
    setBaseline(type, value) {
        const file = path.join(this.metricsDir, 'baseline.json');
        const baseline = fs.existsSync(file)
            ? JSON.parse(fs.readFileSync(file, 'utf-8'))
            : {};
        baseline[type] = value;
        fs.writeFileSync(file, JSON.stringify(baseline, null, 2));
    }
    exportToJSON(outputPath) {
        const types = ['build', 'worker_health', 'worker_status', 'lsp_init', 'memory'];
        const data = {};
        types.forEach(type => {
            data[type] = this.getMetrics(type);
        });
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    }
    exportToCSV(type, outputPath) {
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
//# sourceMappingURL=metrics-collector.js.map