/**
 * Agent 超时配置
 * 支持按 Agent 类型和模型配置不同的超时时间
 */

export interface TimeoutConfig {
  default: number;
  byAgentType: Record<string, number>;
  byModel: Record<string, number>;
}

/**
 * 默认超时配置（单位：毫秒）
 */
export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  default: 300000, // 5 分钟

  byAgentType: {
    // 快速任务
    explore: 60000, // 1 分钟
    'style-reviewer': 120000, // 2 分钟
    writer: 180000, // 3 分钟

    // 标准任务
    executor: 600000, // 10 分钟
    debugger: 600000,
    planner: 600000,
    verifier: 300000, // 5 分钟
    'quality-reviewer': 300000,
    'security-reviewer': 300000,

    // 复杂任务
    'deep-executor': 1800000, // 30 分钟
    architect: 900000, // 15 分钟
    analyst: 900000,
    'code-reviewer': 900000,
  },

  byModel: {
    haiku: 120000, // 2 分钟
    sonnet: 600000, // 10 分钟
    opus: 1800000, // 30 分钟
  },
};

/**
 * 获取 Agent 的超时时间
 * 优先级：环境变量 > Agent 类型 > 模型 > 默认值
 */
export function getAgentTimeout(
  agentType: string,
  model?: string,
  config: TimeoutConfig = DEFAULT_TIMEOUT_CONFIG
): number {
  // 环境变量覆盖
  const envTimeout = process.env.OMC_AGENT_TIMEOUT;
  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Agent 类型特定超时
  if (config.byAgentType[agentType]) {
    return config.byAgentType[agentType];
  }

  // 模型特定超时
  if (model && config.byModel[model]) {
    return config.byModel[model];
  }

  // 默认超时
  return config.default;
}
