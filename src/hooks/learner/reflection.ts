/**
 * reflection.ts — 反思引擎
 *
 * 从 Axiom reflection.py 移植。生成结构化反思报告并写入 reflection_log.md。
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { parseReflectionLog } from './reflection-parser.js';
import { archiveReflections } from './reflection-archiver.js';

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
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.baseDir = base;
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
  ): Promise<ReflectionReport & { archiveResult?: { archived: number; kept: number; warning?: string } }> {
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

    const archiveResult = await this.appendToLog(report);
    return { ...report, archiveResult };
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

  /** 获取反思摘要（对齐 Python get_reflection_summary） */
  async getReflectionSummary(limit = 5): Promise<string> {
    const recent = await this.getRecentReflections(limit);
    if (recent.length === 0) return '(no reflections yet)';
    return recent.join('\n---\n');
  }

  /** 获取待处理的行动项（对齐 Python get_pending_action_items） */
  async getPendingActionItems(): Promise<string[]> {
    let text: string;
    try {
      text = await fs.readFile(this.reflectionLog, 'utf-8');
    } catch {
      return [];
    }
    const items: string[] = [];
    for (const line of text.split('\n')) {
      // 匹配未完成的 action items：- [ ] ...
      const m = line.match(/^- \[ \] (.+)/);
      if (m?.[1]) items.push(m[1].trim());
    }
    return items;
  }

  private async appendToLog(report: ReflectionReport): Promise<{ archived: number; kept: number; warning?: string } | undefined> {
    const content = reportToMarkdown(report);
    let existing = '';
    try {
      existing = await fs.readFile(this.reflectionLog, 'utf-8');
    } catch {
      // 文件不存在时创建
    }
    const separator = existing.endsWith('\n') ? '' : '\n';
    await fs.writeFile(this.reflectionLog, existing + separator + content, 'utf-8');

    // 写入后检查条目数，count > 10 时自动归档
    // 归档路径不可来自文件内容，由 archiveReflections 内部硬编码
    try {
      const updatedText = await fs.readFile(this.reflectionLog, 'utf-8');
      const blocks = parseReflectionLog(updatedText);
      if (blocks.length > 10) {
        return await archiveReflections(this.baseDir);
      }
    } catch {
      // 归档失败不阻断主流程
    }
    return undefined;
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
