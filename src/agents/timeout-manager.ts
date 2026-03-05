/**
 * Agent 超时管理器
 * 负责监控 Agent 执行时间并在超时时中断
 */

import { getAgentTimeout } from './timeout-config.js';

export interface TimeoutEvent {
  agentType: string;
  model?: string;
  startTime: number;
  timeoutMs: number;
  actualDuration: number;
}

export class TimeoutManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private startTimes = new Map<string, number>();

  /**
   * 启动超时监控
   */
  start(taskId: string, agentType: string, model?: string): AbortController {
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
  stop(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.cleanup(taskId);
    }
  }

  /**
   * 获取已运行时间
   */
  getElapsed(taskId: string): number {
    const startTime = this.startTimes.get(taskId);
    return startTime ? Date.now() - startTime : 0;
  }

  private cleanup(taskId: string): void {
    this.timers.delete(taskId);
    this.startTimes.delete(taskId);
  }
}

export const timeoutManager = new TimeoutManager();
