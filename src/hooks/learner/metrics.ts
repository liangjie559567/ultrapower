/**
 * metrics.ts — 工作流指标追踪器
 *
 * 从 Axiom metrics.py 移植。记录工作流执行指标，生成洞察和优化建议。
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export type WorkflowName = 'feature-flow' | 'analyze-error' | 'start';

export interface WorkflowRun {
  workflow: WorkflowName;
  date: string;
  durationMin: number;
  success: boolean;
  rollbacks: number;
  autoFix: number;
  bottleneck: string;
  notes: string;
}

export interface WorkflowInsight {
  workflow: WorkflowName;
  avgDuration: number;
  successRate: number;
  totalRuns: number;
  commonBottleneck: string;
  suggestion: string;
}

export class WorkflowMetrics {
  private readonly metricsFile: string;
  private readonly timers = new Map<string, number>();

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.metricsFile = path.join(base, '.omc', 'axiom', 'evolution', 'workflow_metrics.md');
  }

  startTracking(workflow: WorkflowName): void {
    this.timers.set(workflow, Date.now());
  }

  async endTracking(
    workflow: WorkflowName,
    options: {
      success?: boolean;
      rollbacks?: number;
      autoFix?: number;
      bottleneck?: string;
      notes?: string;
      durationOverride?: number;
    } = {}
  ): Promise<WorkflowRun> {
    let durationMin: number;
    if (options.durationOverride !== undefined) {
      durationMin = options.durationOverride;
    } else {
      const start = this.timers.get(workflow);
      this.timers.delete(workflow);
      durationMin = start ? Math.max(1, Math.round((Date.now() - start) / 60000)) : 0;
    }

    const run: WorkflowRun = {
      workflow,
      date: new Date().toISOString().slice(0, 10),
      durationMin,
      success: options.success ?? true,
      rollbacks: options.rollbacks ?? 0,
      autoFix: options.autoFix ?? 0,
      bottleneck: options.bottleneck ?? '',
      notes: options.notes ?? '',
    };

    await this.appendRun(run);
    return run;
  }

  async getInsights(workflow: WorkflowName): Promise<WorkflowInsight> {
    const runs = await this.loadRuns(workflow);
    if (runs.length === 0) {
      return { workflow, avgDuration: 0, successRate: 0, totalRuns: 0, commonBottleneck: '', suggestion: '' };
    }

    const avgDuration = runs.reduce((s, r) => s + r.durationMin, 0) / runs.length;
    const successRate = runs.filter(r => r.success).length / runs.length;

    const bottlenecks = runs.map(r => r.bottleneck).filter(Boolean);
    const bottleneckCounts = new Map<string, number>();
    for (const b of bottlenecks) bottleneckCounts.set(b, (bottleneckCounts.get(b) ?? 0) + 1);
    const commonBottleneck = [...bottleneckCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

    let suggestion = '';
    if (avgDuration > 30) suggestion = `平均耗时 ${avgDuration.toFixed(0)} min 偏高，考虑拆分工作流`;
    else if (successRate < 0.8) suggestion = `成功率 ${(successRate * 100).toFixed(0)}% 低于 80%，建议检查常见失败原因`;

    return {
      workflow,
      avgDuration: Math.round(avgDuration * 10) / 10,
      successRate: Math.round(successRate * 100) / 100,
      totalRuns: runs.length,
      commonBottleneck,
      suggestion,
    };
  }

  private async appendRun(run: WorkflowRun): Promise<void> {
    let text: string;
    try {
      text = await fs.readFile(this.metricsFile, 'utf-8');
    } catch {
      return;
    }

    const mark = run.success ? '✓' : '✗';
    const row = `| ${run.date} | ${run.durationMin}min | ${mark} | ${run.rollbacks} | ${run.autoFix} | ${run.bottleneck} | ${run.notes} |`;

    const sectionMap: Record<WorkflowName, string> = {
      'feature-flow': '## 1. feature-flow',
      'analyze-error': '## 2. analyze-error',
      'start': '## 3. start',
    };

    const marker = sectionMap[run.workflow];
    if (!text.includes(marker)) return;

    const lines = text.split('\n');
    let inSection = false;
    let inTable = false;
    let insertPos = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.includes(marker)) { inSection = true; continue; }
      if (inSection && line.startsWith('## ') && !line.includes(marker)) break;
      if (inSection && line.includes('| Date |')) { inTable = true; continue; }
      if (inTable && line.startsWith('|---')) continue;
      if (inTable && line.startsWith('|')) insertPos = i;
      else if (inTable && !line.startsWith('|')) break;
    }

    if (insertPos >= 0) {
      if (lines[insertPos]?.includes('暂无数据')) {
        lines[insertPos] = row;
      } else {
        lines.splice(insertPos + 1, 0, row);
      }
      await fs.writeFile(this.metricsFile, lines.join('\n'), 'utf-8');
    }
  }

  private async loadRuns(workflow: WorkflowName): Promise<WorkflowRun[]> {
    let text: string;
    try {
      text = await fs.readFile(this.metricsFile, 'utf-8');
    } catch {
      return [];
    }

    const sectionMap: Record<WorkflowName, string> = {
      'feature-flow': '## 1. feature-flow',
      'analyze-error': '## 2. analyze-error',
      'start': '## 3. start',
    };

    const marker = sectionMap[workflow];
    if (!text.includes(marker)) return [];

    const runs: WorkflowRun[] = [];
    let inSection = false;
    let inTable = false;

    for (const line of text.split('\n')) {
      if (line.includes(marker)) { inSection = true; continue; }
      if (inSection && line.startsWith('## ') && !line.includes(marker)) break;
      if (inSection && line.includes('| Date |')) { inTable = true; continue; }
      if (inTable && line.startsWith('|---')) continue;
      if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 7 && parts[1] && parts[1] !== '-') {
          runs.push({
            workflow,
            date: parts[1] ?? '',
            durationMin: parseInt((parts[2] ?? '').replace('min', ''), 10) || 0,
            success: parts[3] === '✓',
            rollbacks: parseInt(parts[4] ?? '0', 10) || 0,
            autoFix: parseInt(parts[5] ?? '0', 10) || 0,
            bottleneck: parts[6] ?? '',
            notes: parts[7] ?? '',
          });
        }
      } else if (inTable && !line.startsWith('|')) {
        break;
      }
    }
    return runs;
  }
}
