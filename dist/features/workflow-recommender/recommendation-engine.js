/**
 * Recommendation Engine - 推荐引擎
 */
export function getRecommendation(intent, context) {
    // 安全优先
    if (context.hasSecurity) {
        return {
            primary: 'security-reviewer',
            secondary: 'executor',
            confidence: 90,
            reason: 'Security-related changes detected',
        };
    }
    // 大规模变更
    if (context.fileCount && context.fileCount > 10) {
        return {
            primary: 'deep-executor',
            secondary: 'team',
            confidence: 85,
            reason: `Large scope: ${context.fileCount} files`,
        };
    }
    // 架构设计
    if (context.hasArchitecture) {
        return {
            primary: 'architect',
            secondary: 'planner',
            confidence: 88,
            reason: 'Architecture design needed',
        };
    }
    // UI 相关
    if (context.hasUI) {
        return {
            primary: 'designer',
            secondary: 'executor',
            confidence: 82,
            reason: 'UI/Frontend work detected',
        };
    }
    // API 变更
    if (context.hasAPI) {
        return {
            primary: 'api-reviewer',
            secondary: 'executor',
            confidence: 80,
            reason: 'API changes require review',
        };
    }
    // 性能优化
    if (context.hasPerformance) {
        return {
            primary: 'performance-reviewer',
            secondary: 'executor',
            confidence: 85,
            reason: 'Performance optimization needed',
        };
    }
    // 基于意图的推荐
    switch (intent) {
        case 'feature-multiple':
            return {
                primary: 'ultrawork',
                secondary: 'team',
                confidence: 80,
                reason: 'Multiple features benefit from parallel execution',
            };
        case 'bug-fix':
            return {
                primary: 'debugger',
                secondary: 'executor',
                confidence: 85,
                reason: 'Bug fix requires root cause analysis',
            };
        case 'refactor':
            return {
                primary: 'quality-reviewer',
                secondary: 'executor',
                confidence: 75,
                reason: 'Refactoring benefits from quality review',
            };
        case 'review':
            return {
                primary: 'code-reviewer',
                confidence: 90,
                reason: 'Code review requested',
            };
        case 'explore':
            return {
                primary: 'explore',
                secondary: 'analyst',
                confidence: 88,
                reason: 'Exploration and analysis needed',
            };
        case 'plan':
            return {
                primary: 'planner',
                secondary: 'architect',
                confidence: 85,
                reason: 'Planning phase detected',
            };
        default:
            return {
                primary: 'executor',
                confidence: 70,
                reason: 'Default: single feature implementation',
            };
    }
}
//# sourceMappingURL=recommendation-engine.js.map