/**
 * Agent 状态追踪器
 * 集成进度显示到 Agent 执行流程
 */

import { AgentStatusIndicator, type AgentStatus } from '../cli/progress/index.js';

export interface AgentTask {
  id: string;
  name: string;
  status: AgentStatus;
  startTime?: number;
  endTime?: number;
}

export class AgentStatusTracker {
  private indicator = new AgentStatusIndicator();
  private tasks = new Map<string, AgentTask>();

  register(id: string, name: string): void {
    this.tasks.set(id, { id, name, status: 'idle' });
    this.indicator.add(name, 'idle');
  }

  start(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = 'running';
      task.startTime = Date.now();
      this.indicator.update(task.name, 'running');
    }
  }

  complete(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = 'completed';
      task.endTime = Date.now();
      this.indicator.update(task.name, 'completed');
    }
  }

  fail(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = 'failed';
      task.endTime = Date.now();
      this.indicator.update(task.name, 'failed');
    }
  }

  render(): void {
    this.indicator.render();
  }

  getSummary() {
    return this.indicator.summary();
  }
}
