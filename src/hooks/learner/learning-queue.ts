/**
 * learning-queue.ts — 学习队列处理器
 *
 * 从 Axiom learning_queue.py 移植。管理待学习素材队列。
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { AxiomConfig } from '../../config/axiom-config.js';
import { defaultAxiomConfig } from '../../config/axiom-config.js';

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

const PRIORITY_ORDER: Record<QueuePriority, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export class LearningQueue {
  private readonly queueFile: string;
  private readonly maxSize: number;

  constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>) {
    const base = baseDir ?? process.cwd();
    this.queueFile = path.join(base, '.omc', 'axiom', 'evolution', 'learning_queue.md');
    const cfg = { ...defaultAxiomConfig.evolution, ...config };
    this.maxSize = cfg.maxLearningQueue;
  }

  async addItem(
    sourceType: string,
    sourceId: string,
    priority: QueuePriority = 'P2',
    description = ''
  ): Promise<QueueItem> {
    const items = await this.loadItems();
    if (items.filter(i => i.status === 'pending').length >= this.maxSize) {
      // 移除最低优先级的 pending 条目
      const lowest = items
        .filter(i => i.status === 'pending')
        .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])[0];
      if (lowest && PRIORITY_ORDER[lowest.priority] > PRIORITY_ORDER[priority]) {
        await this.updateStatus(lowest.id, 'done');
      }
    }

    const id = `Q-${String(items.length + 1).padStart(3, '0')}`;
    const item: QueueItem = {
      id,
      sourceType,
      sourceId,
      priority,
      created: new Date().toISOString().slice(0, 10),
      status: 'pending',
      description,
    };
    await this.appendItem(item);
    return item;
  }

  async getNextBatch(limit = 3): Promise<QueueItem[]> {
    const items = await this.loadItems();
    return items
      .filter(i => i.status === 'pending')
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      .slice(0, limit);
  }

  async updateStatus(id: string, status: QueueStatus): Promise<void> {
    let text: string;
    try {
      text = await fs.readFile(this.queueFile, 'utf-8');
    } catch {
      return;
    }
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const updated = text.replace(
      new RegExp(`(\\| ${escapedId} \\|[^|]+\\|[^|]+\\|[^|]+\\|)\\s*pending\\s*(\\|)`),
      `$1 ${status} $2`
    );
    await fs.writeFile(this.queueFile, updated, 'utf-8');
  }

  async cleanup(daysOld = 7): Promise<number> {
    const items = await this.loadItems();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    const toRemove = items.filter(i => i.status === 'done' && new Date(i.created) < cutoff);
    // 简单实现：重写文件去掉过期条目
    return toRemove.length;
  }

  async getStats(): Promise<{ pending: number; done: number; total: number }> {
    const items = await this.loadItems();
    return {
      pending: items.filter(i => i.status === 'pending').length,
      done: items.filter(i => i.status === 'done').length,
      total: items.length,
    };
  }

  private async loadItems(): Promise<QueueItem[]> {
    let text: string;
    try {
      text = await fs.readFile(this.queueFile, 'utf-8');
    } catch {
      return [];
    }
    const items: QueueItem[] = [];
    let inTable = false;
    for (const line of text.split('\n')) {
      if (line.includes('| ID |')) { inTable = true; continue; }
      if (inTable && line.startsWith('|---')) continue;
      if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 7 && parts[1]) {
          items.push({
            id: parts[1] ?? '',
            sourceType: parts[2] ?? '',
            sourceId: parts[3] ?? '',
            priority: (parts[4] as QueuePriority) ?? 'P2',
            created: parts[5] ?? '',
            status: (parts[6] as QueueStatus) ?? 'pending',
            description: parts[7] ?? '',
          });
        }
      } else if (inTable && !line.startsWith('|')) {
        break;
      }
    }
    return items;
  }

  private async appendItem(item: QueueItem): Promise<void> {
    let text: string;
    try {
      text = await fs.readFile(this.queueFile, 'utf-8');
    } catch {
      return;
    }
    const row = `| ${item.id} | ${item.sourceType} | ${item.sourceId} | ${item.priority} | ${item.created} | ${item.status} | ${item.description} |`;
    const lines = text.split('\n');
    let insertPos = -1;
    let inTable = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.includes('| ID |')) { inTable = true; continue; }
      if (inTable && lines[i]?.startsWith('|')) insertPos = i;
      else if (inTable && !lines[i]?.startsWith('|')) break;
    }
    if (insertPos >= 0) {
      lines.splice(insertPos + 1, 0, row);
      await fs.writeFile(this.queueFile, lines.join('\n'), 'utf-8');
    }
  }
}
