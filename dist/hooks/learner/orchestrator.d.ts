/**
 * orchestrator.ts — 进化引擎编排器
 *
 * 从 Axiom orchestrator.py 移植。编排完整的进化流程。
 */
import type { AxiomConfig } from '../../config/axiom-config.js';
import { type PatternEntry } from './pattern-detector.js';
import { WorkflowMetrics } from './metrics.js';
import { type ArchiveResult } from './queue-archiver.js';
export interface EvolveOptions {
    diffText?: string;
    sessionName?: string;
    durationMin?: number;
    tasksCompleted?: number;
    tasksTotal?: number;
}
export interface EvolveResult {
    newPatterns: string[];
    promoted: string[];
    harvested: number;
    decayed: number;
    deprecated: number;
    queueStats: {
        pending: number;
        done: number;
        total: number;
    };
    reflectionSummary: string;
    pendingActionItems: string[];
    archiveResult?: ArchiveResult;
}
export interface ReflectOptions {
    sessionName: string;
    durationMin?: number;
    tasksCompleted?: number;
    tasksTotal?: number;
    wentWell?: string[];
    couldImprove?: string[];
    learnings?: string[];
    actionItems?: string[];
}
export declare class EvolutionOrchestrator {
    private readonly harvester;
    private readonly patternDetector;
    private readonly confidenceEngine;
    private readonly metrics;
    private readonly learningQueue;
    private readonly reflection;
    private readonly indexManager;
    private readonly seedKnowledge;
    private readonly queueArchiver;
    constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>);
    /** 初始化：加载种子知识（首次运行时） */
    initialize(): Promise<void>;
    /** /evolve 入口：处理 diff，更新模式库，衰减置信度（对齐 Python orchestrator.evolve） */
    evolve(options?: EvolveOptions): Promise<EvolveResult>;
    /** 手动触发队列归档（对应 --archive-queue 参数） */
    archiveQueue(): Promise<ArchiveResult>;
    /** /reflect 入口：生成反思报告 */
    reflect(options: ReflectOptions): Promise<import('./reflection.js').ReflectionReport & {
        archiveResult?: {
            archived: number;
            kept: number;
            warning?: string;
        };
    }>;
    /** 获取最近反思 */
    getRecentReflections(limit?: number): Promise<string[]>;
    /** 获取工作流洞察 */
    getInsights(workflow: Parameters<WorkflowMetrics['getInsights']>[0]): Promise<import("./metrics.js").WorkflowInsight>;
    /** 任务完成时触发（对齐 Python on_task_completed） */
    onTaskCompleted(taskId: string, description: string): Promise<void>;
    /** 错误修复成功时触发（对齐 Python on_error_fixed） */
    onErrorFixed(errorType: string, rootCause: string, solution: string): Promise<void>;
    /** 工作流完成时触发（对齐 Python on_workflow_completed） */
    onWorkflowCompleted(workflow: Parameters<WorkflowMetrics['endTracking']>[0], durationMin: number, success: boolean, notes?: string): Promise<void>;
    /** 搜索知识库（对齐 Python search_knowledge） */
    searchKnowledge(query: string): Promise<Array<Record<string, string>>>;
    /** 搜索模式库（对齐 Python search_patterns） */
    searchPatterns(query: string): Promise<PatternEntry[]>;
}
//# sourceMappingURL=orchestrator.d.ts.map