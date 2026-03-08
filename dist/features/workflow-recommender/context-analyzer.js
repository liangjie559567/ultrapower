/**
 * Context Analyzer - 上下文分析器
 */
export function analyzeContext(summary) {
    const lower = summary.toLowerCase();
    return {
        fileCount: extractFileCount(summary),
        hasArchitecture: /\b(architecture|design|system)\b/i.test(lower),
        hasSecurity: /\b(security|auth|credential|authentication)\b/i.test(lower),
        hasPerformance: /\b(performance|optimize|slow)\b/i.test(lower),
        hasUI: /\b(ui|component|frontend|react|vue)\b/i.test(lower),
        hasAPI: /\b(api|endpoint|route|rest)\b/i.test(lower),
        hasTests: /\b(test|spec|coverage)\b/i.test(lower),
    };
}
function extractFileCount(summary) {
    const match = summary.match(/(\d+)\s+files?/i);
    return match ? parseInt(match[1], 10) : 0;
}
//# sourceMappingURL=context-analyzer.js.map