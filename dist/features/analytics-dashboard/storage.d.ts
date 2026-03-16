interface MetricsData {
    sessions: Array<{
        timestamp: string;
    }>;
    skills: Array<{
        timestamp: string;
        type: string;
        target: string;
        success?: boolean;
        duration?: number;
    }>;
    agents: Array<{
        timestamp: string;
        type: string;
        target: string;
        success?: boolean;
        duration?: number;
    }>;
}
export declare class MetricsStorage {
    private static getPath;
    static save(data: MetricsData, cwd: string): void;
    static load(cwd: string): MetricsData;
}
export {};
//# sourceMappingURL=storage.d.ts.map