/**
 * learning-queue.ts — 学习队列处理器
 *
 * 从 Axiom learning_queue.py 移植。管理待学习素材队列。
 */
import type { AxiomConfig } from '../../config/axiom-config.js';
export type QueuePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type QueueStatus = 'pending' | 'processing' | 'done';
export interface QueueItem {
    id: string;
    sourceType: string;
    sourceId: string;
    priority: QueuePriority;
    created: string;
    status: QueueStatus;
    description: string;
}
export declare class LearningQueue {
    private readonly queueFile;
    private readonly maxSize;
    constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>);
    addItem(sourceType: string, sourceId: string, priority?: QueuePriority, description?: string): Promise<QueueItem>;
    getNextBatch(limit?: number): Promise<QueueItem[]>;
    updateStatus(id: string, status: QueueStatus): Promise<void>;
    cleanup(daysOld?: number): Promise<number>;
    getStats(): Promise<{
        pending: number;
        done: number;
        total: number;
    }>;
    private loadItems;
    private parseBlockFormat;
    private appendItem;
}
//# sourceMappingURL=learning-queue.d.ts.map