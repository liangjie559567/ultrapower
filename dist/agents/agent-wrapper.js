/**
 * Agent 调用包装器
 * 为 Agent 调用添加超时保护和降级策略
 */
import { timeoutManager } from './timeout-manager.js';
import { getAgentTimeout } from './timeout-config.js';
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('agents:agent-wrapper');
/**
 * 带超时保护的 Agent 调用
 */
export async function callAgentWithTimeout(agentFn, options) {
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
        }
        catch (error) {
            timeoutManager.stop(taskId);
            if (error instanceof Error && error.name === 'AbortError') {
                // 超时
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    logger.warn(`[agent-wrapper] Timeout on attempt ${attempt + 1}, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
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
//# sourceMappingURL=agent-wrapper.js.map