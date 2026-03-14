import { MetricsStorage } from './storage.js';
export class MetricsTracker {
    static track(event, cwd) {
        const data = MetricsStorage.load(cwd);
        if (event.type === 'session_start') {
            data.sessions.push({ timestamp: event.timestamp });
        }
        else if (event.type === 'skill_used') {
            data.skills.push(event);
        }
        else if (event.type === 'agent_called') {
            data.agents.push(event);
        }
        MetricsStorage.save(data, cwd);
    }
}
//# sourceMappingURL=tracker.js.map