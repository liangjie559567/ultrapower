import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
export function auditLog(category, event) {
    const logEntry = {
        ...event,
        timestamp: new Date().toISOString(),
        category,
    };
    const logPath = join(process.cwd(), '.omc', 'audit.log');
    appendFileSync(logPath, JSON.stringify(logEntry) + '\n', { flag: 'a' });
}
//# sourceMappingURL=auditLog.js.map