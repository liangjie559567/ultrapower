/**
 * Workflow Recommender - 智能工作流推荐引擎
 */

export { classifyIntent } from './intent-classifier.js';
export { analyzeContext } from './context-analyzer.js';
export { getRecommendation } from './recommendation-engine.js';
export { getWorkflowRecommendation } from './recommender.js';
export { getNextStepRecommendation } from './router-integration.js';
export type { Intent, ContextSignal, Recommendation } from './types.js';
export type { WorkflowRecommendation } from './recommender.js';
export type { RouterContext } from './router-integration.js';
