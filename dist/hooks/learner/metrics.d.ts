/**
 * metrics.ts — 工作流指标追踪器
 *
 * 从 Axiom metrics.py 移植。记录工作流执行指标，生成洞察和优化建议。
 */
export type WorkflowName = 'feature-flow' | 'analyze-error' | 'start';
export interface WorkflowRun {
    workflow: WorkflowName;
    date: string;
    durationMin: number;
    success: boolean;
    rollbacks: number;
    autoFix: number;
    bottleneck: string;
    notes: string;
}
export interface WorkflowInsight {
    workflow: WorkflowName;
    avgDuration: number;
    successRate: number;
    totalRuns: number;
    commonBottleneck: string;
    suggestion: string;
}
export declare class WorkflowMetrics {
    private readonly metricsFile;
    private readonly timers;
    constructor(baseDir?: string);
    startTracking(workflow: WorkflowName): void;
    endTracking(workflow: WorkflowName, options?: {
        success?: boolean;
        rollbacks?: number;
        autoFix?: number;
        bottleneck?: string;
        notes?: string;
        durationOverride?: number;
    }): Promise<WorkflowRun>;
    getInsights(workflow: WorkflowName): Promise<WorkflowInsight>;
    private appendRun;
    private loadRuns;
}
//# sourceMappingURL=metrics.d.ts.map