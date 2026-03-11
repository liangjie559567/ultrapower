/**
 * reflection-archiver.ts — 反思日志滚动窗口归档
 *
 * 将 reflection_log.md 中超出 MAX_WINDOW 的最旧条目
 * 追加至归档文件，并原子写回主文件。
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseReflectionLog } from './reflection-parser.js';
import { atomicWriteFileSync } from '../../lib/atomic-write.js';
import { acquireLock } from '../../lib/file-lock.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('learner:reflection-archiver');
const REFLECTION_LOG_FILE = '.omc/axiom/reflection_log.md';
// 归档路径不可来自文件内容，硬编码确保路径安全
const REFLECTION_ARCHIVE_FILE = '.omc/axiom/evolution/reflection_log_archive.md';
const LOCK_FILE = '.omc/axiom/evolution/.archive.lock';
const MAX_WINDOW = 10; // 主文件保留最近 10 条
const ARCHIVE_WARN_LINES = 5000;
/**
 * 归档反思日志中超出滚动窗口的旧条目。
 *
 * @param baseDir  项目根目录（所有路径均相对于此目录）
 * @returns        归档统计结果
 */
export async function archiveReflections(baseDir) {
    const logPath = path.join(baseDir, REFLECTION_LOG_FILE);
    const archivePath = path.join(baseDir, REFLECTION_ARCHIVE_FILE);
    const lockPath = path.join(baseDir, LOCK_FILE);
    const evolutionDir = path.join(baseDir, '.omc/axiom/evolution');
    // 步骤 1：确保归档目录存在
    await fs.promises.mkdir(evolutionDir, { recursive: true });
    // 步骤 2：获取锁
    const unlock = await acquireLock(lockPath, 30000);
    try {
        // 步骤 3：读取并解析主文件
        let content;
        try {
            content = await fs.promises.readFile(logPath, 'utf8');
        }
        catch (err) {
            const nodeErr = err;
            if (nodeErr.code === 'ENOENT') {
                // 主文件不存在，无需归档
                await unlock();
                return { archived: 0, kept: 0 };
            }
            throw err;
        }
        // 步骤 4：解析块（parser 已保证日期倒序）
        const blocks = parseReflectionLog(content);
        // 步骤 5：分割保留块与归档块
        const keptBlocks = blocks.slice(0, MAX_WINDOW);
        const archivedBlocks = blocks.slice(MAX_WINDOW);
        // 步骤 6：无超出窗口的块，直接返回
        if (archivedBlocks.length === 0) {
            await unlock();
            return { archived: 0, kept: keptBlocks.length };
        }
        // 步骤 7：追加至归档文件
        const archivedContent = archivedBlocks
            .map(b => b.rawContent)
            .join('\n') + '\n';
        await fs.promises.appendFile(archivePath, archivedContent, 'utf8');
        // 步骤 8：原子写回主文件（保留文件头 + 前 MAX_WINDOW 块）
        const fileHeader = extractFileHeader(content);
        const keptContent = keptBlocks.map(b => b.rawContent).join('\n');
        const newMainContent = fileHeader
            ? fileHeader + '\n' + keptContent + '\n'
            : keptContent + '\n';
        atomicWriteFileSync(logPath, newMainContent);
        // 步骤 9：检查归档文件行数
        let warning;
        try {
            const archiveContent = await fs.promises.readFile(archivePath, 'utf8');
            const lineCount = archiveContent.split('\n').length;
            if (lineCount > ARCHIVE_WARN_LINES) {
                warning = `[归档] 归档文件已超过 ${ARCHIVE_WARN_LINES} 行（当前 ${lineCount} 行），建议手动清理 ${REFLECTION_ARCHIVE_FILE}`;
            }
        }
        catch {
            // 归档文件读取失败时忽略行数检查
        }
        // 步骤 10：输出日志
        logger.info(`[归档] reflection_log: 已移动 ${archivedBlocks.length} 条反思至 reflection_log_archive.md`);
        // 步骤 11：释放锁
        await unlock();
        // 步骤 12：返回结果
        return { archived: archivedBlocks.length, kept: keptBlocks.length, warning };
    }
    catch (err) {
        // 错误处理：先释放锁再重新抛出
        await unlock();
        throw err;
    }
}
/**
 * 提取文件中第一个 "## 反思" 块之前的所有内容（文件头）。
 * 若无文件头则返回空字符串。
 */
function extractFileHeader(content) {
    const lines = content.split('\n');
    const firstBlockIndex = lines.findIndex(line => /^## 反思/.test(line));
    if (firstBlockIndex <= 0) {
        return '';
    }
    // 去掉末尾多余的空行，保留一个换行以便与块内容拼接
    const headerLines = lines.slice(0, firstBlockIndex);
    // 移除尾部空行
    while (headerLines.length > 0 && headerLines[headerLines.length - 1].trim() === '') {
        headerLines.pop();
    }
    return headerLines.join('\n');
}
//# sourceMappingURL=reflection-archiver.js.map