import type { AnalyticsEvent } from './types.js';
export declare class AnalyticsCollector {
    static track(type: AnalyticsEvent['type'], data?: Partial<AnalyticsEvent>): Promise<void>;
}
//# sourceMappingURL=analytics.d.ts.map