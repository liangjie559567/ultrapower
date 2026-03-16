import { appendFileSync, existsSync, statSync } from 'fs';
import { renameSyncWithRetry } from './fs-utils.js';
import { ensureDirSync } from './atomic-write.js';
import { join } from 'path';
const LOG_PATH = '.omc/logs/security-audit.jsonl';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const SENSITIVE_FIELDS = ['token', 'apiKey', 'password', 'secret', 'accessToken', 'refreshToken', 'privateKey'];
function sanitize(data) {
    if (!data || typeof data !== 'object')
        return data;
    if (Array.isArray(data)) {
        return data.map(item => sanitize(item));
    }
    const sanitized = { ...data };
    for (const key in sanitized) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitize(sanitized[key]);
        }
    }
    return sanitized;
}
function rotate(logPath) {
    if (!existsSync(logPath))
        return;
    const stats = statSync(logPath);
    if (stats.size <= MAX_SIZE)
        return;
    for (let i = 6; i >= 1; i--) {
        const old = `${logPath}.${i}`;
        const next = `${logPath}.${i + 1}`;
        if (existsSync(old))
            renameSyncWithRetry(old, next);
    }
    renameSyncWithRetry(logPath, `${logPath}.1`);
}
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.INFO;
function log(level, message, meta) {
    const levelValue = LOG_LEVELS[level];
    if (levelValue < currentLevel)
        return;
    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
    });
    console.log(entry);
}
export const logger = {
    info: (message, meta) => log('INFO', message, meta),
    warn: (message, meta) => log('WARN', message, meta),
    error: (message, meta) => log('ERROR', message, meta),
    debug: (message, meta) => log('DEBUG', message, meta)
};
export function security(event, data) {
    const logPath = join(process.cwd(), LOG_PATH);
    ensureDirSync(join(process.cwd(), '.omc/logs'));
    rotate(logPath);
    const entry = JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        data: sanitize(data)
    }) + '\n';
    appendFileSync(logPath, entry, 'utf-8');
}
//# sourceMappingURL=logger.js.map