import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
export function logAuditEvent(eventType, severity, details, workingDirectory) {
    const entry = {
        timestamp: new Date().toISOString(),
        eventType,
        severity,
        details
    };
    const logDir = join(workingDirectory || process.cwd(), '.omc');
    const logPath = join(logDir, 'audit.log');
    mkdirSync(logDir, { recursive: true });
    appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
}
//# sourceMappingURL=auditLog.js.map