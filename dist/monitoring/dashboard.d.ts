import { Metric } from './metrics-collector.js';
export declare class Dashboard {
    private collector;
    constructor(baseDir?: string);
    private calculateStats;
    private formatDuration;
    private formatMemory;
    private checkRegression;
    display(hours?: number): void;
    setBaselines(): void;
    export(format: 'json' | 'csv', outputPath: string, type?: Metric['type']): void;
}
//# sourceMappingURL=dashboard.d.ts.map