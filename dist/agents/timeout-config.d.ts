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
export declare const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig;
/**
 * 获取 Agent 的超时时间
 * 优先级：环境变量 > Agent 类型 > 模型 > 默认值
 */
export declare function getAgentTimeout(agentType: string, model?: string, config?: TimeoutConfig): number;
//# sourceMappingURL=timeout-config.d.ts.map