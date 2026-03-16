import { MetricsStorage } from './storage.js';
export class MetricsTracker {
    static track(event, cwd) {
        const data = MetricsStorage.load(cwd);
        if (event.type === 'session_start') {
            data.sessions.push({ timestamp: event.timestamp });
        }
        else if (event.type === 'skill_used') {
            data.skills.push({
                timestamp: event.timestamp,
                type: event.type,
                target: event.target || '',
                success: event.success ?? false,
                duration: event.duration
            });
        }
        else if (event.type === 'agent_called') {
            data.agents.push({
                timestamp: event.timestamp,
                type: event.type,
                target: event.target || '',
                success: event.success ?? false,
                duration: event.duration
            });
        }
        MetricsStorage.save(data, cwd);
    }
}
//# sourceMappingURL=tracker.js.map