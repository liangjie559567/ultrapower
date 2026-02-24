/**
 * reflection.ts — 反思引擎
 *
 * 从 Axiom reflection.py 移植。生成结构化反思报告并写入 reflection_log.md。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface ReflectionReport {
  sessionName: string;
  date: string;
  durationMin: number;
  tasksCompleted: number;
  tasksTotal: number;
  wentWell: string[];
  couldImprove: string[];
  learnings: string[];
  actionItems: string[];
}

export class ReflectionEngine {
  private readonly reflectionLog: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.reflectionLog = path.join(base, '.omc', 'axiom', 'reflection_log.md');
  }

  async reflect(
    sessionName: string,
    options: {
      durationMin?: number;
      tasksCompleted?: number;
      tasksTotal?: number;
      wentWell?: string[];
      couldImprove?: string[];
      learnings?: string[];
      actionItems?: string[];
    } = {}
  ): Promise<ReflectionReport> {
    const report: ReflectionReport = {
      sessionName,
      date: new Date().toISOString().slice(0, 10),
      durationMin: options.durationMin ?? 0,
      tasksCompleted: options.tasksCompleted ?? 0,
      tasksTotal: options.tasksTotal ?? 0,
      wentWell: options.wentWell ?? [],
      couldImprove: options.couldImprove ?? [],
      learnings: options.learnings ?? [],
      actionItems: options.actionItems ?? [],
    };

    await this.appendToLog(report);
    return report;
  }

  async getRecentReflections(limit = 5): Promise<string[]> {
    let text: string;
    try {
      text = await fs.readFile(this.reflectionLog, 'utf-8');
    } catch {
      return [];
    }
    const sections = text.split(/^### /m).filter(Boolean);
    return sections.slice(-limit).map(s => `### ${s}`);
  }

  private async appendToLog(report: ReflectionReport): Promise<void> {
    const content = reportToMarkdown(report);
    let existing = '';
    try {
      existing = await fs.readFile(this.reflectionLog, 'utf-8');
    } catch {
      // 文件不存在时创建
    }
    const separator = existing.endsWith('\n') ? '' : '\n';
    await fs.writeFile(this.reflectionLog, existing + separator + content, 'utf-8');
  }
}

function reportToMarkdown(r: ReflectionReport): string {
  const lines = [
    `### ${r.date} Session: ${r.sessionName}`,
    '',
    '#### 📊 Quick Stats',
    `- Duration: ~${r.durationMin} min`,
    `- Tasks Completed: ${r.tasksCompleted}/${r.tasksTotal}`,
    '',
    '#### ✅ What Went Well',
    ...r.wentWell.map(i => `- [x] ${i}`),
    ...(r.wentWell.length === 0 ? ['- (无)'] : []),
    '',
    '#### ⚠️ What Could Improve',
    ...r.couldImprove.map(i => `- [ ] ${i}`),
    ...(r.couldImprove.length === 0 ? ['- (无)'] : []),
    '',
    '#### 💡 Learnings',
    ...r.learnings.map(i => `- ${i}`),
    ...(r.learnings.length === 0 ? ['- (无)'] : []),
    '',
    '#### 🎯 Action Items',
    ...r.actionItems.map(i => `- [ ] ${i}`),
    ...(r.actionItems.length === 0 ? ['- (无)'] : []),
    '',
  ];
  return lines.join('\n');
}
