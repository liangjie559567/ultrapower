/**
 * queue-archiver.ts — 学习队列归档器
 *
 * 当 done 条目数 > 10 时，将较旧的 done 条目归档到
 * learning_queue_archive.md，主文件保留最近 10 条 done。
 */

import * as fs from 'fs';
import * as path from 'path';
import { acquireLock } from '../../lib/file-lock.js';
import { atomicWriteSync } from '../../lib/atomic-write.js';

export interface ArchiveResult {
  archived: number;
  kept: number;
  message: string;
}

const DONE_KEEP_COUNT = 10;
const ARCHIVE_WARN_LINES = 5000;

export class QueueArchiver {
  private readonly queueFile: string;
  private readonly archiveFile: string;
  private readonly lockPath: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    const evolutionDir = path.join(base, '.omc', 'axiom', 'evolution');
    this.queueFile = path.join(evolutionDir, 'learning_queue.md');
    this.archiveFile = path.join(evolutionDir, 'learning_queue_archive.md');
    this.lockPath = path.join(evolutionDir, '.archive.lock');
  }

  async archive(): Promise<ArchiveResult> {
    let text: string;
    try {
      text = fs.readFileSync(this.queueFile, 'utf-8');
    } catch {
      return { archived: 0, kept: 0, message: '[归档] learning_queue: 文件不存在，跳过' };
    }

    const { header, blocks } = this.splitBlocks(text);
    const doneBlocks = blocks.filter(b => isDone(b));

    if (doneBlocks.length <= DONE_KEEP_COUNT) {
      return {
        archived: 0,
        kept: doneBlocks.length,
        message: '[归档] learning_queue: done 条目不足，无需归档',
      };
    }

    const unlock = await acquireLock(this.lockPath);
    try {
      const nonDoneBlocks = blocks.filter(b => !isDone(b));

      // 按处理时间升序排序，保留最近 DONE_KEEP_COUNT 条
      const sortedDone = [...doneBlocks].sort((a, b) =>
        extractTime(a).localeCompare(extractTime(b))
      );
      const toArchive = sortedDone.slice(0, sortedDone.length - DONE_KEEP_COUNT);
      const toKeep = sortedDone.slice(sortedDone.length - DONE_KEEP_COUNT);

      // 确保归档目录存在
      fs.mkdirSync(path.dirname(this.archiveFile), { recursive: true });

      // 追加到归档文件（ID 去重）
      const existingIds = this.loadArchiveIds();
      const newBlocks = toArchive.filter(b => {
        const id = extractId(b);
        return id.length > 0 && !existingIds.has(id);
      });

      if (newBlocks.length > 0) {
        let archiveText = '';
        try {
          archiveText = fs.readFileSync(this.archiveFile, 'utf-8');
        } catch { /* 文件不存在，从空内容开始 */ }

        const newArchiveText =
          (archiveText ? archiveText.trimEnd() + '\n\n' : '') +
          newBlocks.join('\n\n') +
          '\n';
        atomicWriteSync(this.archiveFile, newArchiveText);

        const lineCount = newArchiveText.split('\n').length;
        if (lineCount > ARCHIVE_WARN_LINES) {
          console.warn(
            `[归档] warning: learning_queue_archive.md 已超过 ${ARCHIVE_WARN_LINES} 行（${lineCount} 行）`
          );
        }
      }

      // 原子写入主文件（头部 + non-done + 保留的 done）
      const allKept = [...nonDoneBlocks, ...toKeep];
      const mainContent =
        (header ? header.trimEnd() + '\n\n' : '') +
        allKept.join('\n\n') +
        '\n';
      atomicWriteSync(this.queueFile, mainContent);

      const archivedCount = toArchive.length;
      return {
        archived: archivedCount,
        kept: toKeep.length,
        message: `[归档] learning_queue: 已移动 ${archivedCount} 条 done 条目至 learning_queue_archive.md`,
      };
    } finally {
      await unlock();
    }
  }

  private splitBlocks(text: string): { header: string; blocks: string[] } {
    const lines = text.split('\n');

    // 找到第一个块头的位置
    let firstBlockLine = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (/^### /.test(lines[i] ?? '')) {
        firstBlockLine = i;
        break;
      }
    }

    const header = lines.slice(0, firstBlockLine).join('\n');
    const bodyLines = lines.slice(firstBlockLine);

    // 按 ### 分割块
    const blocks: string[] = [];
    let current: string[] = [];
    for (const line of bodyLines) {
      if (/^### /.test(line) && current.length > 0) {
        const trimmed = current.join('\n').trimEnd();
        if (trimmed) blocks.push(trimmed);
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) {
      const trimmed = current.join('\n').trimEnd();
      if (trimmed && /^### /.test(current[0] ?? '')) blocks.push(trimmed);
    }

    return { header, blocks };
  }

  private loadArchiveIds(): Set<string> {
    const ids = new Set<string>();
    try {
      const text = fs.readFileSync(this.archiveFile, 'utf-8');
      for (const line of text.split('\n')) {
        const m = line.match(/^### ([A-Za-z0-9-]+):/);
        if (m?.[1]) ids.add(m[1]);
      }
    } catch { /* 归档文件不存在 */ }
    return ids;
  }
}

function isDone(block: string): boolean {
  return /^- 状态:\s*done/m.test(block);
}

function extractTime(block: string): string {
  // 优先处理时间，其次添加时间
  const m = block.match(/^- (?:处理时间|添加时间):\s*(.+)/m);
  return (m?.[1] ?? '').trim();
}

function extractId(block: string): string {
  const m = block.match(/^### ([A-Za-z0-9-]+):/);
  return m?.[1] ?? '';
}
