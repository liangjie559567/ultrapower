/**
 * reflection.ts — 反思引擎
 *
 * 从 Axiom reflection.py 移植。生成结构化反思报告并写入 reflection_log.md。
 */
export interface ReflectionReport {
    sessionName: string;
    date: string;
    durationMin: number;
    tasksCompleted: number;
    tasksTotal: number;
    wentWell: string[];
    couldImprove: string[];
    learnings: string[];
    actionItems: string[];
}
export declare class ReflectionEngine {
    private readonly reflectionLog;
    private readonly baseDir;
    constructor(baseDir?: string);
    reflect(sessionName: string, options?: {
        durationMin?: number;
        tasksCompleted?: number;
        tasksTotal?: number;
        wentWell?: string[];
        couldImprove?: string[];
        learnings?: string[];
        actionItems?: string[];
    }): Promise<ReflectionReport & {
        archiveResult?: {
            archived: number;
            kept: number;
            warning?: string;
        };
    }>;
    getRecentReflections(limit?: number): Promise<string[]>;
    /** 获取反思摘要（对齐 Python get_reflection_summary） */
    getReflectionSummary(limit?: number): Promise<string>;
    /** 获取待处理的行动项（对齐 Python get_pending_action_items） */
    getPendingActionItems(): Promise<string[]>;
    private appendToLog;
}
//# sourceMappingURL=reflection.d.ts.map