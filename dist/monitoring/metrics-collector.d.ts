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
    record(type: Metric['type'], value: number, metadata?: Record<string, unknown>): Promise<void>;
    getMetrics(type: Metric['type'], since?: number): Promise<Metric[]>;
    getBaseline(type: Metric['type']): Promise<number | null>;
    setBaseline(type: Metric['type'], value: number): Promise<void>;
    exportToJSON(outputPath: string): Promise<void>;
    exportToCSV(type: Metric['type'], outputPath: string): Promise<void>;
}
//# sourceMappingURL=metrics-collector.d.ts.map