/**
 * status-dashboard.ts — Axiom 状态仪表板
 *
 * 生成多章节 Markdown 仪表板，对齐 Python status_dashboard.py。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface AxiomStatus {
  taskStatus: string;
  lastUpdated: string;
  knowledgeCount: number;
  patternCount: number;
  queuePending: number;
  queueDone: number;
  lastCommit: string;
  recentReflections: string[];
  guardStatus: { preCommit: boolean; postCommit: boolean };
}

export class StatusDashboard {
  private readonly axiomDir: string;
  private readonly knowledgeDir: string;
  private readonly hooksDir: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.axiomDir = path.join(base, '.omc', 'axiom');
    this.knowledgeDir = path.join(base, '.omc', 'knowledge');
    this.hooksDir = path.join(base, '.git', 'hooks');
  }

  async getStatus(): Promise<AxiomStatus> {
    const [activeCtx, knowledgeCount, patternCount, queueText, reflectionFiles, guardStatus] =
      await Promise.all([
        this.readFile(path.join(this.axiomDir, 'active_context.md')),
        this.countFiles(this.knowledgeDir, /^k-\d+.*\.md$/),
        this.countFiles(path.join(this.axiomDir, 'evolution'), /^patterns\.md$/),
        this.readFile(path.join(this.axiomDir, 'evolution', 'learning_queue.md')),
        this.listReflections(),
        this.checkGuards(),
      ]);

    return {
      taskStatus: this.extractField(activeCtx, 'Task Status') ?? 'IDLE',
      lastUpdated: this.extractField(activeCtx, 'Last Updated') ?? '-',
      knowledgeCount,
      patternCount,
      queuePending: this.countQueueStatus(queueText, 'pending'),
      queueDone: this.countQueueStatus(queueText, 'done'),
      lastCommit: this.extractField(activeCtx, 'Last Commit') ?? '-',
      recentReflections: reflectionFiles.slice(0, 3),
      guardStatus,
    };
  }

  /** 生成多章节 Markdown 仪表板（对齐 Python status_dashboard.py） */
  async generateMarkdown(): Promise<string> {
    const s = await this.getStatus();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sections: string[] = [
      `# Axiom System Status`,
      ``,
      `> Generated: ${now}`,
      ``,
      `## Task Progress`,
      ``,
      `| Field | Value |`,
      `|---|---|`,
      `| Status | ${s.taskStatus} |`,
      `| Last Updated | ${s.lastUpdated} |`,
      `| Last Commit | ${s.lastCommit} |`,
      ``,
      `## Evolution Stats`,
      ``,
      `| Metric | Count |`,
      `|---|---|`,
      `| Knowledge Entries | ${s.knowledgeCount} |`,
      `| Pattern Files | ${s.patternCount} |`,
      `| Queue Pending | ${s.queuePending} |`,
      `| Queue Done | ${s.queueDone} |`,
      ``,
      `## Recent Reflections`,
      ``,
      s.recentReflections.length > 0
        ? s.recentReflections.map(r => `- ${r}`).join('\n')
        : '- (none)',
      ``,
      `## Guard Status`,
      ``,
      `| Hook | Installed |`,
      `|---|---|`,
      `| pre-commit | ${s.guardStatus.preCommit ? '✓' : '✗'} |`,
      `| post-commit | ${s.guardStatus.postCommit ? '✓' : '✗'} |`,
      ``,
    ];

    return sections.join('\n');
  }

  /** 控制台输出简洁摘要（保留原有 printDashboard 行为） */
  async printDashboard(): Promise<void> {
    const s = await this.getStatus();
    const lines = [
      '╔══════════════════════════════════════╗',
      '║        Axiom System Status           ║',
      '╠══════════════════════════════════════╣',
      `║  Task Status  : ${s.taskStatus.padEnd(20)}║`,
      `║  Last Updated : ${s.lastUpdated.slice(0, 19).padEnd(20)}║`,
      `║  Knowledge    : ${String(s.knowledgeCount).padEnd(20)}║`,
      `║  Queue Pending: ${String(s.queuePending).padEnd(20)}║`,
      `║  Last Commit  : ${s.lastCommit.slice(0, 20).padEnd(20)}║`,
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

  private async countFiles(dir: string, pattern: RegExp): Promise<number> {
    try {
      const files = await fs.readdir(dir);
      return files.filter(f => pattern.test(f)).length;
    } catch {
      return 0;
    }
  }

  private async listReflections(): Promise<string[]> {
    const reflDir = path.join(this.axiomDir, 'reflections');
    try {
      const files = await fs.readdir(reflDir);
      return files
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse()
        .slice(0, 5);
    } catch {
      return [];
    }
  }

  private async checkGuards(): Promise<{ preCommit: boolean; postCommit: boolean }> {
    const check = async (name: string) => {
      try {
        await fs.access(path.join(this.hooksDir, name));
        return true;
      } catch {
        return false;
      }
    };
    const [preCommit, postCommit] = await Promise.all([check('pre-commit'), check('post-commit')]);
    return { preCommit, postCommit };
  }

  private extractField(text: string, field: string): string | null {
    const match = text.match(new RegExp(`^${field}:\\s*(.+)`, 'm'));
    return match?.[1]?.trim() ?? null;
  }

  private countQueueStatus(text: string, status: string): number {
    return (text.match(new RegExp(`\\|\\s*${status}\\s*\\|`, 'g')) ?? []).length;
  }
}
