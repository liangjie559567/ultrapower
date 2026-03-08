/**
 * queue-archiver.ts — 学习队列归档器
 *
 * 当 done 条目数 > 10 时，将较旧的 done 条目归档到
 * learning_queue_archive.md，主文件保留最近 10 条 done。
 */
export interface ArchiveResult {
    archived: number;
    kept: number;
    message: string;
}
export declare class QueueArchiver {
    private readonly queueFile;
    private readonly archiveFile;
    private readonly lockPath;
    constructor(baseDir?: string);
    archive(): Promise<ArchiveResult>;
    private splitBlocks;
    private loadArchiveIds;
}
//# sourceMappingURL=queue-archiver.d.ts.map