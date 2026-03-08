/**
 * status-dashboard.ts — Axiom 状态仪表板
 *
 * 生成多章节 Markdown 仪表板，对齐 Python status_dashboard.py。
 */
export interface AxiomStatus {
    taskStatus: string;
    lastUpdated: string;
    knowledgeCount: number;
    patternCount: number;
    queuePending: number;
    queueDone: number;
    lastCommit: string;
    recentReflections: string[];
    guardStatus: {
        preCommit: boolean;
        postCommit: boolean;
    };
}
export declare class StatusDashboard {
    private readonly axiomDir;
    private readonly knowledgeDir;
    private readonly hooksDir;
    constructor(baseDir?: string);
    getStatus(): Promise<AxiomStatus>;
    /** 生成多章节 Markdown 仪表板（对齐 Python status_dashboard.py） */
    generateMarkdown(): Promise<string>;
    /** 控制台输出简洁摘要（保留原有 printDashboard 行为） */
    printDashboard(): Promise<void>;
    private readFile;
    private countFiles;
    private listReflections;
    private checkGuards;
    private extractField;
    private countQueueStatus;
}
//# sourceMappingURL=status-dashboard.d.ts.map