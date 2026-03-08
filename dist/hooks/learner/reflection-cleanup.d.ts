/**
 * reflection-cleanup.ts — 一次性反思日志清理脚本
 *
 * 功能：
 * 1. 备份原文件至 reflection_log_backup_YYYYMMDD.md
 * 2. 移除所有 isEmpty === true 的空条目
 * 3. 使用 atomicWriteFileSync 写回主文件
 *
 * 用法：人工触发，非自动 hook 集成。
 */
/**
 * 清理反思日志：移除空条目并备份原文件。
 *
 * @param baseDir 项目根目录（含 .omc/axiom/ 子目录）
 * @returns 清理结果摘要
 */
export declare function cleanupReflectionLog(baseDir: string): Promise<{
    removed: number;
    kept: number;
    backupPath: string;
}>;
//# sourceMappingURL=reflection-cleanup.d.ts.map