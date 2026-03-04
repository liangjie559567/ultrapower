/**
 * Agent 调用包装器
 * 为 Agent 调用添加超时保护和降级策略
 */

import { timeoutManager } from './timeout-manager.js';
import { getAgentTimeout } from './timeout-config.js';

export interface AgentCallOptions {
  agentType: string;
  model?: string;
  prompt: string;
  maxRetries?: number;
}

export interface AgentCallResult {
  success: boolean;
  output?: string;
  error?: string;
  timedOut?: boolean;
  retried?: boolean;
}

/**
 * 带超时保护的 Agent 调用
 */
export async function callAgentWithTimeout(
  agentFn: (signal: AbortSignal) => Promise<string>,
  options: AgentCallOptions
): Promise<AgentCallResult> {
  const { agentType, model, maxRetries = 1 } = options;
  const taskId = `${agentType}-${Date.now()}`;

  let attempt = 0;

  while (attempt <= maxRetries) {
    const controller = timeoutManager.start(taskId, agentType, model);

    try {
      const output = await agentFn(controller.signal);
      timeoutManager.stop(taskId);

      return {
        success: true,
        output,
        retried: attempt > 0,
      };
    } catch (error) {
      timeoutManager.stop(taskId);

      if (error instanceof Error && error.name === 'AbortError') {
        // 超时
        if (attempt < maxRetries) {
          attempt++;
          continue;
        }

        return {
          success: false,
          error: `Agent timeout after ${getAgentTimeout(agentType, model)}ms`,
          timedOut: true,
        };
      }

      // 其他错误
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
  };
}
