/**
 * reflection-archiver.ts — 反思日志滚动窗口归档
 *
 * 将 reflection_log.md 中超出 MAX_WINDOW 的最旧条目
 * 追加至归档文件，并原子写回主文件。
 */
export interface ArchiveResult {
    archived: number;
    kept: number;
    warning?: string;
}
/**
 * 归档反思日志中超出滚动窗口的旧条目。
 *
 * @param baseDir  项目根目录（所有路径均相对于此目录）
 * @returns        归档统计结果
 */
export declare function archiveReflections(baseDir: string): Promise<ArchiveResult>;
//# sourceMappingURL=reflection-archiver.d.ts.map