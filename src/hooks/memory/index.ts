/**
 * index.ts — Context Manager 实现
 *
 * 从 Axiom context_manager.py 移植的 TypeScript 版本。
 * 提供 7 个操作：read/write/merge/clear/checkpoint/restore/status
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { CHECKPOINT_DIR, SECTION_FILES } from './constants.js';
import type { ContextManager, ContextStatus, MemorySection } from './types.js';

export class FileContextManager implements ContextManager {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? process.cwd();
  }

  private resolvePath(section: MemorySection): string {
    const rel = SECTION_FILES[section];
    if (!rel) throw new Error(`Unknown section: ${section}`);
    return path.join(this.baseDir, rel);
  }

  async read(section: MemorySection): Promise<string> {
    const filePath = this.resolvePath(section);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  async write(section: MemorySection, content: string): Promise<void> {
    const filePath = this.resolvePath(section);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async merge(section: MemorySection, content: string): Promise<void> {
    const existing = await this.read(section);
    const separator = existing.endsWith('\n') ? '' : '\n';
    await this.write(section, existing + separator + content);
  }

  async clear(section: MemorySection): Promise<void> {
    await this.write(section, '');
  }

  async checkpoint(label: string): Promise<void> {
    const checkpointDir = path.join(this.baseDir, CHECKPOINT_DIR);
    await fs.mkdir(checkpointDir, { recursive: true });

    for (const [section, rel] of Object.entries(SECTION_FILES)) {
      const src = path.join(this.baseDir, rel);
      const dest = path.join(checkpointDir, `${label}-${section}.md`);
      try {
        await fs.copyFile(src, dest);
      } catch {
        // 文件不存在时跳过
      }
    }
  }

  async restore(label: string): Promise<void> {
    const checkpointDir = path.join(this.baseDir, CHECKPOINT_DIR);

    for (const [section, rel] of Object.entries(SECTION_FILES)) {
      const src = path.join(checkpointDir, `${label}-${section}.md`);
      const dest = path.join(this.baseDir, rel);
      try {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
      } catch {
        // checkpoint 文件不存在时跳过
      }
    }
  }

  async status(): Promise<ContextStatus> {
    const activeContent = await this.read('active');
    const taskStatusMatch = activeContent.match(/task_status:\s*(\w+)/);
    const taskStatus = (taskStatusMatch?.[1] ?? 'IDLE') as ContextStatus['taskStatus'];

    const checkpointDir = path.join(this.baseDir, CHECKPOINT_DIR);
    let lastCheckpoint: string | null = null;
    try {
      const files = await fs.readdir(checkpointDir);
      if (files.length > 0) {
        const sorted = files.sort();
        const last = sorted[sorted.length - 1];
        lastCheckpoint = last?.replace(/-\w+\.md$/, '') ?? null;
      }
    } catch {
      // checkpoints 目录不存在
    }

    return {
      activeContext: activeContent.slice(0, 200),
      lastCheckpoint,
      sessionId: process.env['SESSION_ID'] ?? 'unknown',
      taskStatus,
    };
  }
}

export { CHECKPOINT_DIR, SECTION_FILES } from './constants.js';
export type { ContextManager, ContextStatus, MemorySection } from './types.js';
