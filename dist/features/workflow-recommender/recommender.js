import { readFileSync } from 'fs';
import { join } from 'path';
export function getWorkflowRecommendation(context) {
    const configPath = join(process.cwd(), '.omc/axiom/knowledge/recommendations/workflow_recommender.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    for (const rec of config.recommendations) {
        if (matchesConditions(context, rec)) {
            return rec;
        }
    }
    return null;
}
function matchesConditions(context, rec) {
    const cond = rec.conditions;
    if (!cond)
        return true;
    if (cond.taskCount && context.taskCount !== undefined) {
        if (cond.taskCount.min && context.taskCount < cond.taskCount.min)
            return false;
        if (cond.taskCount.max && context.taskCount > cond.taskCount.max)
            return false;
    }
    if (cond.taskType && context.taskType !== cond.taskType)
        return false;
    if (cond.priority && context.priority !== cond.priority)
        return false;
    if (cond.keywords && context.keywords) {
        const hasMatch = cond.keywords.some((kw) => context.keywords.some((ck) => ck.includes(kw)));
        if (!hasMatch)
            return false;
    }
    return true;
}
//# sourceMappingURL=recommender.js.map