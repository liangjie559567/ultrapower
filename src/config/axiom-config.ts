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

export const defaultAxiomConfig: AxiomConfig = {
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
export function loadAxiomConfig(overrides?: Partial<AxiomConfig>): AxiomConfig {
  if (!overrides) return defaultAxiomConfig;
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
export function resolveActiveProvider(): AxiomProvider {
  const env = process.env['ACTIVE_PROVIDER']?.toLowerCase();
  if (env === 'codex' || env === 'gemini' || env === 'claude') {
    return env;
  }
  return 'claude';
}
