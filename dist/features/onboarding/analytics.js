import { promises as fs } from 'fs';
import path from 'path';
const ANALYTICS_PATH = '.omc/onboarding/analytics.json';
export class AnalyticsCollector {
    static async track(type, data) {
        const event = {
            type,
            timestamp: new Date().toISOString(),
            ...data
        };
        let events = [];
        try {
            const content = await fs.readFile(ANALYTICS_PATH, 'utf-8');
            events = JSON.parse(content).events || [];
        }
        catch {
            await fs.mkdir(path.dirname(ANALYTICS_PATH), { recursive: true });
        }
        events.push(event);
        await fs.writeFile(ANALYTICS_PATH, JSON.stringify({ events }, null, 2));
    }
}
//# sourceMappingURL=analytics.js.map