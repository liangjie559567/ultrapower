/**
 * Intent Classifier - 意图分类器
 */
const patterns = [
    { intent: 'bug-fix', pattern: /(fix|bug|error|issue|broken|修复|错误|问题|故障)/i, priority: 10 },
    { intent: 'refactor', pattern: /(refactor|cleanup|restructure|重构|优化|改进|整个.*架构)/i, priority: 9 },
    { intent: 'review', pattern: /(review|audit|check|inspect|审查|检查|评审)/i, priority: 8 },
    { intent: 'plan', pattern: /(plan|design|architect|strategy|规划|设计|架构)/i, priority: 7 },
    { intent: 'explore', pattern: /(explore|understand|analyze|investigate|探索|分析|调查)/i, priority: 6 },
    { intent: 'feature-multiple', pattern: /(add|implement|create)\s+(multiple|several|many)|添加.*多个|实现.*多个/i, priority: 5 },
    { intent: 'feature-single', pattern: /(add|implement|create|build|添加|实现|创建|构建|登录|功能)/i, priority: 1 },
];
export function classifyIntent(userInput) {
    let bestMatch = null;
    for (const { intent, pattern, priority } of patterns) {
        if (pattern.test(userInput)) {
            if (!bestMatch || priority > bestMatch.priority) {
                bestMatch = { intent, priority };
            }
        }
    }
    return bestMatch ? bestMatch.intent : 'feature-single';
}
//# sourceMappingURL=intent-classifier.js.map