import type { UserBehavior, UserProfile } from './types.js';

export class BehaviorTracker {
  static track(behavior: UserBehavior): void {
    const history = this.loadHistory();
    history.push(behavior);
    this.saveHistory(history.slice(-100));
  }

  static buildProfile(): UserProfile {
    const history = this.loadHistory();
    const workflows = new Map<string, number>();
    const agents = new Map<string, number>();
    const skills = new Map<string, number>();

    for (const b of history) {
      if (b.action === 'workflow_selected') workflows.set(b.target, (workflows.get(b.target) || 0) + 1);
      if (b.action === 'agent_called') agents.set(b.target, (agents.get(b.target) || 0) + 1);
      if (b.action === 'skill_used') skills.set(b.target, (skills.get(b.target) || 0) + 1);
    }

    return {
      preferredWorkflows: Array.from(workflows.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
      frequentAgents: Array.from(agents.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
      skillUsageCount: Object.fromEntries(skills),
      lastActive: new Date().toISOString()
    };
  }

  private static loadHistory(): UserBehavior[] {
    return [];
  }

  private static saveHistory(history: UserBehavior[]): void {}
}
