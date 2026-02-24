/**
 * status-dashboard.ts — Axiom 状态仪表板
 *
 * 工具函数，输出 Axiom 系统状态摘要。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface AxiomStatus {
  taskStatus: string;
  lastUpdated: string;
  knowledgeCount: number;
  queuePending: number;
  lastCommit: string;
}

export class StatusDashboard {
  private readonly axiomDir: string;
  private readonly knowledgeDir: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.axiomDir = path.join(base, '.omc', 'axiom');
    this.knowledgeDir = path.join(base, '.omc', 'knowledge');
  }

  async getStatus(): Promise<AxiomStatus> {
    const [activeCtx, knowledgeFiles, queueText] = await Promise.all([
      this.readFile(path.join(this.axiomDir, 'active_context.md')),
      this.listKnowledgeFiles(),
      this.readFile(path.join(this.axiomDir, 'evolution', 'learning_queue.md')),
    ]);

    return {
      taskStatus: this.extractField(activeCtx, 'Task Status') ?? 'IDLE',
      lastUpdated: this.extractField(activeCtx, 'Last Updated') ?? '-',
      knowledgeCount: knowledgeFiles,
      queuePending: this.countPending(queueText),
      lastCommit: this.extractField(activeCtx, 'Last Commit') ?? '-',
    };
  }

  async printDashboard(): Promise<void> {
    const status = await this.getStatus();
    const lines = [
      '╔══════════════════════════════════════╗',
      '║        Axiom System Status           ║',
      '╠══════════════════════════════════════╣',
      `║  Task Status  : ${status.taskStatus.padEnd(20)}║`,
      `║  Last Updated : ${status.lastUpdated.slice(0, 19).padEnd(20)}║`,
      `║  Knowledge    : ${String(status.knowledgeCount).padEnd(20)}║`,
      `║  Queue Pending: ${String(status.queuePending).padEnd(20)}║`,
      `║  Last Commit  : ${status.lastCommit.slice(0, 20).padEnd(20)}║`,
      '╚══════════════════════════════════════╝',
    ];
    console.log(lines.join('\n'));
  }

  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  private async listKnowledgeFiles(): Promise<number> {
    try {
      const files = await fs.readdir(this.knowledgeDir);
      return files.filter(f => /^k-\d+.*\.md$/.test(f)).length;
    } catch {
      return 0;
    }
  }

  private extractField(text: string, field: string): string | null {
    const match = text.match(new RegExp(`^${field}:\\s*(.+)`, 'm'));
    return match?.[1]?.trim() ?? null;
  }

  private countPending(text: string): number {
    return (text.match(/\|\s*pending\s*\|/g) ?? []).length;
  }
}
