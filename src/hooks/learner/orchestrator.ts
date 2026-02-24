/**
 * orchestrator.ts — 进化引擎编排器
 *
 * 从 Axiom orchestrator.py 移植。编排完整的进化流程。
 */

import type { AxiomConfig } from '../../config/axiom-config.js';
import { KnowledgeHarvester } from './harvester.js';
import { PatternDetector, type PatternEntry } from './pattern-detector.js';
import { ConfidenceEngine } from './confidence.js';
import { WorkflowMetrics, type WorkflowInsight } from './metrics.js';
import { LearningQueue } from './learning-queue.js';
import { ReflectionEngine } from './reflection.js';
import { KnowledgeIndexManager } from './index-manager.js';
import { SeedKnowledge } from './seed-knowledge.js';

export interface EvolveOptions {
  diffText?: string;
  sessionName?: string;
  durationMin?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
}

export interface EvolveResult {
  newPatterns: string[];
  promoted: string[];
  harvested: number;
  decayed: number;
  queueStats: { pending: number; done: number; total: number };
}

export interface ReflectOptions {
  sessionName: string;
  durationMin?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
  wentWell?: string[];
  couldImprove?: string[];
  learnings?: string[];
  actionItems?: string[];
}

export class EvolutionOrchestrator {
  private readonly harvester: KnowledgeHarvester;
  private readonly patternDetector: PatternDetector;
  private readonly confidenceEngine: ConfidenceEngine;
  private readonly metrics: WorkflowMetrics;
  private readonly learningQueue: LearningQueue;
  private readonly reflection: ReflectionEngine;
  private readonly indexManager: KnowledgeIndexManager;
  private readonly seedKnowledge: SeedKnowledge;

  constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>) {
    const base = baseDir ?? process.cwd();
    this.harvester = new KnowledgeHarvester(base);
    this.patternDetector = new PatternDetector(base, config);
    this.confidenceEngine = new ConfidenceEngine(base, config);
    this.metrics = new WorkflowMetrics(base);
    this.learningQueue = new LearningQueue(base, config);
    this.reflection = new ReflectionEngine(base);
    this.indexManager = new KnowledgeIndexManager(base);
    this.seedKnowledge = new SeedKnowledge(base);
  }

  /** 初始化：加载种子知识（首次运行时） */
  async initialize(): Promise<void> {
    await this.seedKnowledge.seed();
    await this.indexManager.rebuildIndex();
  }

  /** /evolve 入口：处理 diff，更新模式库，衰减置信度 */
  async evolve(options: EvolveOptions = {}): Promise<EvolveResult> {
    const { diffText = '' } = options;

    // 1. 检测模式
    const patternResult = await this.patternDetector.detectAndUpdate(diffText);

    // 2. 从 diff 收割知识
    let harvested = 0;
    if (diffText) {
      const files = [...diffText.matchAll(/\+\+\+ b\/(.+)/g)].map(m => m[1] ?? '');
      for (const f of files.slice(0, 3)) {
        await this.harvester.harvest(
          'code_change',
          `Pattern from ${f}`,
          diffText.slice(0, 500)
        );
        harvested++;
      }
    }

    // 3. 衰减未使用的知识
    const decayed = await this.confidenceEngine.decayUnused();

    // 4. 重建索引
    await this.indexManager.rebuildIndex();

    // 5. 获取队列统计
    const queueStats = await this.learningQueue.getStats();

    return {
      newPatterns: patternResult.newPatterns,
      promoted: patternResult.promoted,
      harvested,
      decayed: decayed.length,
      queueStats,
    };
  }

  /** /reflect 入口：生成反思报告 */
  async reflect(options: ReflectOptions) {
    return this.reflection.reflect(options.sessionName, {
      durationMin: options.durationMin,
      tasksCompleted: options.tasksCompleted,
      tasksTotal: options.tasksTotal,
      wentWell: options.wentWell,
      couldImprove: options.couldImprove,
      learnings: options.learnings,
      actionItems: options.actionItems,
    });
  }

  /** 获取最近反思 */
  async getRecentReflections(limit = 5): Promise<string[]> {
    return this.reflection.getRecentReflections(limit);
  }

  /** 获取工作流洞察 */
  async getInsights(workflow: Parameters<WorkflowMetrics['getInsights']>[0]) {
    return this.metrics.getInsights(workflow);
  }

  /** 任务完成时触发（对齐 Python on_task_completed） */
  async onTaskCompleted(taskId: string, description: string): Promise<void> {
    await this.learningQueue.addItem('task_completion', taskId, 'P2', description);
  }

  /** 错误修复成功时触发（对齐 Python on_error_fixed） */
  async onErrorFixed(errorType: string, rootCause: string, solution: string): Promise<void> {
    await this.learningQueue.addItem(
      'error_fix',
      errorType,
      'P1',
      `Root cause: ${rootCause} | Solution: ${solution}`
    );
  }

  /** 工作流完成时触发（对齐 Python on_workflow_completed） */
  async onWorkflowCompleted(
    workflow: Parameters<WorkflowMetrics['endTracking']>[0],
    durationMin: number,
    success: boolean,
    notes = ''
  ): Promise<void> {
    await this.metrics.endTracking(workflow, { success, notes, durationOverride: durationMin });
    await this.learningQueue.addItem(
      'workflow_completion',
      workflow,
      'P2',
      `duration=${durationMin}min success=${success} ${notes}`.trim()
    );
  }

  /** 搜索知识库（对齐 Python search_knowledge） */
  async searchKnowledge(query: string): Promise<Array<Record<string, string>>> {
    return this.harvester.search(query);
  }

  /** 搜索模式库（对齐 Python search_patterns） */
  async searchPatterns(query: string): Promise<PatternEntry[]> {
    const patterns = await this.patternDetector.loadPatterns();
    const q = query.toLowerCase();
    return patterns.filter(
      p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }
}
