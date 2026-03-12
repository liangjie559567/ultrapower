import type { Recommendation } from './types.js';

export async function executeWorkflow(workflow: string, prompt: string): Promise<void> {
  console.log(`[Auto-Workflow] 执行 ${workflow}: ${prompt}`);
  // 实际执行逻辑由调用方处理
}

export function formatRecommendation(rec: Recommendation): string {
  return `推荐: ${rec.workflow} (${(rec.confidence * 100).toFixed(0)}%)
原因: ${rec.reason}
备选: ${rec.alternatives?.join(', ') || '无'}`;
}
