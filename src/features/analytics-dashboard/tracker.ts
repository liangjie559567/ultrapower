import { MetricsStorage } from './storage.js';

export interface SessionEvent {
  timestamp: string;
  type: 'session_start' | 'skill_used' | 'agent_called';
  target?: string;
  success?: boolean;
  duration?: number;
}

export class MetricsTracker {
  static track(event: SessionEvent, cwd: string): void {
    const data = MetricsStorage.load(cwd);
    
    if (event.type === 'session_start') {
      data.sessions.push({ timestamp: event.timestamp });
    } else if (event.type === 'skill_used') {
      data.skills.push(event);
    } else if (event.type === 'agent_called') {
      data.agents.push(event);
    }
    
    MetricsStorage.save(data, cwd);
  }
}
