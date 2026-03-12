/**
 * Agent 状态指示器
 */

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'timeout';

export interface AgentInfo {
  name: string;
  status: AgentStatus;
  progress?: string;
}

export class AgentStatusIndicator {
  private agents = new Map<string, AgentInfo>();

  add(name: string, status: AgentStatus = 'idle'): void {
    this.agents.set(name, { name, status });
  }

  update(name: string, status: AgentStatus, progress?: string): void {
    const agent = this.agents.get(name);
    if (agent) {
      agent.status = status;
      agent.progress = progress;
    }
  }

  render(): void {
    const symbols = {
      idle: '○',
      running: '◉',
      completed: '✓',
      failed: '✗',
      timeout: '⏱'
    };

    console.log('\nAgent Status:');
    for (const agent of this.agents.values()) {
      const symbol = symbols[agent.status];
      const progress = agent.progress ? ` - ${agent.progress}` : '';
      console.log(`  ${symbol} ${agent.name} [${agent.status}]${progress}`);
    }
  }

  summary(): { total: number; completed: number; failed: number; running: number } {
    let completed = 0, failed = 0, running = 0;

    for (const agent of this.agents.values()) {
      if (agent.status === 'completed') completed++;
      else if (agent.status === 'failed' || agent.status === 'timeout') failed++;
      else if (agent.status === 'running') running++;
    }

    return { total: this.agents.size, completed, failed, running };
  }
}
