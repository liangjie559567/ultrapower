export interface Metric {
    timestamp: number;
    type: 'build' | 'worker_health' | 'worker_status' | 'lsp_init' | 'memory';
    value: number;
    metadata?: Record<string, unknown>;
}
export declare class MetricsCollector {
    private metricsDir;
    constructor(baseDir?: string);
    private ensureDir;
    record(type: Metric['type'], value: number, metadata?: Record<string, unknown>): void;
    getMetrics(type: Metric['type'], since?: number): Metric[];
    getBaseline(type: Metric['type']): number | null;
    setBaseline(type: Metric['type'], value: number): void;
    exportToJSON(outputPath: string): void;
    exportToCSV(type: Metric['type'], outputPath: string): void;
}
//# sourceMappingURL=metrics-collector.d.ts.map