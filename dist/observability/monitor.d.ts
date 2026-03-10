import { Span } from '@opentelemetry/api';
declare class PerformanceMonitor {
    private metrics;
    private maxSize;
    recordSpan(span: Span, tokens?: number, duration?: number): void;
    getPercentile(p: number): number;
    getMetrics(): {
        p50: number;
        p95: number;
        p99: number;
        throughput: number;
        totalTokens: number;
    };
}
export declare const monitor: PerformanceMonitor;
export {};
//# sourceMappingURL=monitor.d.ts.map