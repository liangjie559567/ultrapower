/**
 * axiom-config.ts — Axiom 配置抽象层
 *
 * 从 Axiom config_loader.py 移植的 TypeScript 版本。
 * 提供 ACTIVE_PROVIDER 路由、Evolution 参数和 Dispatcher 超时配置。
 */
export const defaultAxiomConfig = {
    activeProvider: 'claude',
    evolution: {
        minConfidence: 0.5,
        seedConfidence: 0.85,
        decayDays: 30,
        decayAmount: 0.1,
        maxLearningQueue: 50,
        patternMinOccurrences: 3,
    },
    dispatcher: {
        maxRestarts: 3,
        timeoutTiers: { simple: 600, medium: 900, complex: 1200 },
        promptMaxTokens: 4000,
        compressThreshold: 4000,
    },
};
/**
 * 加载 Axiom 配置，支持局部覆盖。
 */
export function loadAxiomConfig(overrides) {
    if (!overrides)
        return defaultAxiomConfig;
    return {
        ...defaultAxiomConfig,
        ...overrides,
        evolution: { ...defaultAxiomConfig.evolution, ...overrides.evolution },
        dispatcher: { ...defaultAxiomConfig.dispatcher, ...overrides.dispatcher },
    };
}
/**
 * 根据环境变量 ACTIVE_PROVIDER 解析 Provider。
 * 回退到 'claude'。
 */
export function resolveActiveProvider() {
    const env = process.env['ACTIVE_PROVIDER']?.toLowerCase();
    if (env === 'codex' || env === 'gemini' || env === 'claude') {
        return env;
    }
    return 'claude';
}
//# sourceMappingURL=axiom-config.js.map