import { classifyIntent } from './intent-classifier.js';
import { analyzeContext } from './context-analyzer.js';
import { getRecommendation } from './recommendation-engine.js';
import type { Recommendation } from './types.js';

export interface AutoSelectionResult {
  shouldAuto: boolean;
  recommendation?: Recommendation;
  reason: string;
}

export function shouldAutoSelect(prompt: string, confidence: number): boolean {
  return confidence >= 0.85 && prompt.length > 10;
}

export async function autoSelectWorkflow(prompt: string): Promise<AutoSelectionResult> {
  const intent = classifyIntent(prompt);
  const context = analyzeContext(prompt);
  const rec = getRecommendation(intent, context);

  if (shouldAutoSelect(prompt, rec.confidence)) {
    return {
      shouldAuto: true,
      recommendation: rec,
      reason: `高置信度 (${(rec.confidence * 100).toFixed(0)}%)，自动选择 ${rec.workflow}`
    };
  }

  return {
    shouldAuto: false,
    reason: `置信度不足 (${(rec.confidence * 100).toFixed(0)}%)，需用户确认`
  };
}
