import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('model-routing:index');
export { TIER_MODELS, TIER_TO_MODEL_TYPE, DEFAULT_ROUTING_CONFIG, AGENT_CATEGORY_TIERS, COMPLEXITY_KEYWORDS, TIER_PROMPT_STRATEGIES, } from './types.js';
// Re-export signal extraction
export { extractLexicalSignals, extractStructuralSignals, extractContextSignals, extractAllSignals, } from './signals.js';
// Re-export scoring
export { calculateComplexityScore, calculateComplexityTier, scoreToTier, getScoreBreakdown, calculateConfidence, } from './scorer.js';
// Re-export rules
export { DEFAULT_ROUTING_RULES, evaluateRules, getMatchingRules, createRule, mergeRules, } from './rules.js';
// Re-export router
export { routeTask, routeWithEscalation, getRoutingRecommendation, getModelForTask, analyzeTaskComplexity, escalateModel, canEscalate, explainRouting, quickTierForAgent, } from './router.js';
// Re-export prompt adaptations
export { adaptPromptForTier, getPromptStrategy, getPromptPrefix, getPromptSuffix, createDelegationPrompt, getTaskInstructions, TIER_TASK_INSTRUCTIONS, } from './prompts/index.js';
/**
 * Convenience function to route and adapt prompt in one call
 */
export function routeAndAdaptTask(taskPrompt, agentType, previousFailures) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { routeWithEscalation } = require('./router.js');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { adaptPromptForTier } = require('./prompts/index.js');
    const decision = routeWithEscalation({
        taskPrompt,
        agentType,
        previousFailures,
    });
    const adaptedPrompt = adaptPromptForTier(taskPrompt, decision.tier);
    return {
        decision,
        adaptedPrompt,
    };
}
//# sourceMappingURL=index.js.map