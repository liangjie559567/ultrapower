import { getWorkflowRecommendation } from './recommender.js';
export function getNextStepRecommendation(context) {
    const { outputSummary = '', taskCount, keywords } = context;
    const taskType = outputSummary.toLowerCase().includes('bug') ? 'bug-fix' :
        outputSummary.toLowerCase().includes('refactor') ? 'refactor' : 'feature';
    return getWorkflowRecommendation({
        taskCount,
        taskType,
        keywords: keywords || extractKeywords(outputSummary)
    });
}
function extractKeywords(text) {
    const keywords = [];
    const lower = text.toLowerCase();
    if (lower.includes('security') || lower.includes('auth'))
        keywords.push('security');
    if (lower.includes('performance'))
        keywords.push('performance');
    if (lower.includes('ui') || lower.includes('frontend'))
        keywords.push('ui');
    if (lower.includes('api'))
        keywords.push('api');
    return keywords;
}
//# sourceMappingURL=router-integration.js.map