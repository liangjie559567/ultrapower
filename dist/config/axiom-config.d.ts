/**
 * axiom-config.ts — Axiom 配置抽象层
 *
 * 从 Axiom config_loader.py 移植的 TypeScript 版本。
 * 提供 ACTIVE_PROVIDER 路由、Evolution 参数和 Dispatcher 超时配置。
 */
export type AxiomProvider = 'claude' | 'codex' | 'gemini';
export interface EvolutionConfig {
    /** 知识条目最低置信度阈值 */
    minConfidence: number;
    /** 种子知识置信度 */
    seedConfidence: number;
    /** 置信度衰减天数 */
    decayDays: number;
    /** 衰减量 */
    decayAmount: number;
    /** 学习队列最大长度 */
    maxLearningQueue: number;
    /** 模式最小出现次数 */
    patternMinOccurrences: number;
}
export interface DispatcherConfig {
    /** 最大重启次数 */
    maxRestarts: number;
    /** 超时分级（秒） */
    timeoutTiers: {
        simple: number;
        medium: number;
        complex: number;
    };
    /** 提示词最大 token 数 */
    promptMaxTokens: number;
    /** 压缩阈值 */
    compressThreshold: number;
}
export interface AxiomConfig {
    /** 当前激活的 Provider */
    activeProvider: AxiomProvider;
    evolution: EvolutionConfig;
    dispatcher: DispatcherConfig;
}
export declare const defaultAxiomConfig: AxiomConfig;
/**
 * 加载 Axiom 配置，支持局部覆盖。
 */
export declare function loadAxiomConfig(overrides?: Partial<AxiomConfig>): AxiomConfig;
/**
 * 根据环境变量 ACTIVE_PROVIDER 解析 Provider。
 * 回退到 'claude'。
 */
export declare function resolveActiveProvider(): AxiomProvider;
//# sourceMappingURL=axiom-config.d.ts.map