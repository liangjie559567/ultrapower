/**
 * Agent 超时管理器
 * 负责监控 Agent 执行时间并在超时时中断
 */
import { getAgentTimeout } from './timeout-config.js';
import { SIZE_LIMIT } from '../lib/constants.js';
export class TimeoutManager {
    timers = new Map();
    startTimes = new Map();
    MAX_CONCURRENT_TASKS = SIZE_LIMIT.MAX_CONCURRENT_TASKS;
    /**
     * 启动超时监控
     */
    start(taskId, agentType, model) {
        if (this.timers.size >= this.MAX_CONCURRENT_TASKS) {
            throw new Error(`TimeoutManager: max concurrent tasks (${this.MAX_CONCURRENT_TASKS}) exceeded`);
        }
        this.stop(taskId);
        const controller = new AbortController();
        const timeoutMs = getAgentTimeout(agentType, model);
        const startTime = Date.now();
        this.startTimes.set(taskId, startTime);
        const timer = setTimeout(() => {
            controller.abort();
            this.cleanup(taskId);
        }, timeoutMs);
        this.timers.set(taskId, timer);
        return controller;
    }
    /**
     * 停止超时监控
     */
    stop(taskId) {
        const timer = this.timers.get(taskId);
        if (timer) {
            clearTimeout(timer);
            this.cleanup(taskId);
        }
    }
    /**
     * 获取已运行时间
     */
    getElapsed(taskId) {
        const startTime = this.startTimes.get(taskId);
        return startTime ? Date.now() - startTime : 0;
    }
    cleanup(taskId) {
        this.timers.delete(taskId);
        this.startTimes.delete(taskId);
    }
}
export const timeoutManager = new TimeoutManager();
//# sourceMappingURL=timeout-manager.js.map