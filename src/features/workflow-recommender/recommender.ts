import { readFileSync } from 'fs';
import { join } from 'path';

export interface WorkflowRecommendation {
  id: string;
  name: string;
  workflow: string;
  confidence: number;
  agents: string[];
  conditions?: {
    taskCount?: { min?: number; max?: number };
    taskType?: string;
    priority?: string;
    keywords?: string[];
  };
}

interface RecommenderConfig {
  recommendations: WorkflowRecommendation[];
}

interface RecommendationContext {
  taskCount?: number;
  taskType?: string;
  keywords?: string[];
  priority?: string;
}

export function getWorkflowRecommendation(context: {
  taskCount?: number;
  taskType?: string;
  keywords?: string[];
  priority?: string;
}): WorkflowRecommendation | null {
  const configPath = join(process.cwd(), '.omc/axiom/knowledge/recommendations/workflow_recommender.json');
  const config: RecommenderConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

  for (const rec of config.recommendations) {
    if (matchesConditions(context, rec)) {
      return rec;
    }
  }

  return null;
}

function matchesConditions(context: RecommendationContext, rec: WorkflowRecommendation): boolean {
  const cond = rec.conditions;
  if (!cond) return true;

  if (cond.taskCount && context.taskCount !== undefined) {
    if (cond.taskCount.min && context.taskCount < cond.taskCount.min) return false;
    if (cond.taskCount.max && context.taskCount > cond.taskCount.max) return false;
  }

  if (cond.taskType && context.taskType !== cond.taskType) return false;
  if (cond.priority && context.priority !== cond.priority) return false;

  if (cond.keywords && context.keywords) {
    const hasMatch = cond.keywords.some((kw: string) =>
      context.keywords!.some((ck: string) => ck.includes(kw))
    );
    if (!hasMatch) return false;
  }

  return true;
}
