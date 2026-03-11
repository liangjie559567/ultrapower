/**
 * Audit logging for delegation enforcement
 * Logs all Edit/Write operations for analysis
 */
import * as fs from 'fs';
import * as path from 'path';
import { OmcPaths } from '../../lib/worktree-paths.js';
const LOG_DIR = OmcPaths.LOGS;
const LOG_FILE = 'delegation-audit.jsonl';
/**
 * Log an audit entry for delegation enforcement
 */
export function logAuditEntry(entry) {
    const fullEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
    };
    const logDir = path.join(process.cwd(), LOG_DIR);
    const logPath = path.join(logDir, LOG_FILE);
    // Fire-and-forget async logging
    (async () => {
        try {
            await fs.promises.mkdir(logDir, { recursive: true });
            await fs.promises.appendFile(logPath, JSON.stringify(fullEntry) + '\n');
        }
        catch (_err) {
            console.error('[delegation-audit] Failed to write log:', _err);
        }
    })();
}
/**
 * Read audit log entries (for analysis)
 */
export async function readAuditLog(directory) {
    try {
        const logPath = path.join(directory || process.cwd(), LOG_DIR, LOG_FILE);
        try {
            await fs.promises.access(logPath);
        }
        catch {
            return [];
        }
        const content = await fs.promises.readFile(logPath, 'utf-8');
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line));
    }
    catch {
        return [];
    }
}
/**
 * Get audit summary statistics
 */
export async function getAuditSummary(directory) {
    const entries = await readAuditLog(directory);
    const byExtension = {};
    for (const entry of entries) {
        if (entry.decision === 'warned') {
            const ext = path.extname(entry.filePath) || 'unknown';
            byExtension[ext] = (byExtension[ext] || 0) + 1;
        }
    }
    return {
        total: entries.length,
        allowed: entries.filter(e => e.decision === 'allowed').length,
        warned: entries.filter(e => e.decision === 'warned').length,
        byExtension,
    };
}
//# sourceMappingURL=audit.js.map