import { Metric } from './metrics-collector.js';
export declare class Dashboard {
    private collector;
    constructor(baseDir?: string);
    private calculateStats;
    private formatDuration;
    private formatMemory;
    private checkRegression;
    display(hours?: number): Promise<void>;
    setBaselines(): Promise<void>;
    export(format: 'json' | 'csv', outputPath: string, type?: Metric['type']): Promise<void>;
}
//# sourceMappingURL=dashboard.d.ts.map