const INTENT_PATTERNS = {
    'feature-single': [/add|create|implement|build.*single|new feature/i],
    'feature-multiple': [/multiple|several|batch|many/i],
    'bug-fix': [/fix|bug|error|issue|broken/i],
    'refactor': [/refactor|clean|optimize|improve/i],
    'review': [/review|audit|check|inspect/i],
    'explore': [/explore|search|find|investigate/i],
    'plan': [/plan|design|architect|strategy/i]
};
export function classifyIntent(prompt) {
    // 优先检查 feature-multiple（避免被 feature-single 的 implement 匹配）
    if (INTENT_PATTERNS['feature-multiple'].some(p => p.test(prompt))) {
        return 'feature-multiple';
    }
    const scores = {};
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
        if (intent === 'feature-multiple')
            continue; // 已检查
        scores[intent] = patterns.filter(p => p.test(prompt)).length;
    }
    const maxScore = Math.max(...Object.values(scores).filter((v) => v !== undefined));
    return Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] || 'feature-single';
}
//# sourceMappingURL=intent-classifier.js.map