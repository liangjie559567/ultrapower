/**
 * Spec Kit Integration Module
 * 将 GitHub Spec Kit 深度集成到 ultrapower 工作流
 */

export { shouldUseSpecKit, getSpecKitCommand } from './index.js';
export { SPECKIT_ROUTES, getNextSpecKitStep } from './router.js';
export { analyzeSpecKitFit } from './recommender.js';
export type { SpecKitWorkflow } from './index.js';
export type { SpecKitRoute } from './router.js';
export type { SpecKitRecommendation } from './recommender.js';
