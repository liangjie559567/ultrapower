/**
 * Workflow Recommender - 智能工作流推荐引擎
 */

export { classifyIntent } from './intent-classifier.js';
export { analyzeContext } from './context-analyzer.js';
export { getRecommendation } from './recommendation-engine.js';
export type { Intent, ContextSignal, Recommendation } from './types.js';
