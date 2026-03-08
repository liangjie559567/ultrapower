/**
 * Persistent Error Log
 *
 * Replaces the 60-second expiring error state with a persistent JSONL log.
 * Each line is a JSON-encoded ErrorLogEntry.
 */
import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
const MAX_ENTRIES = 100;
const LOG_FILE = '.omc/logs/errors.jsonl';
function getLogPath(directory) {
    return join(directory, LOG_FILE);
}
/**
 * Append an error entry to the persistent log.
 * Automatically adds timestamp and rotates if over MAX_ENTRIES.
 */
export function appendError(directory, entry) {
    try {
        const logPath = getLogPath(directory);
        const logDir = dirname(logPath);
        if (!existsSync(logDir)) {
            mkdirSync(logDir, { recursive: true });
        }
        const fullEntry = {
            timestamp: new Date().toISOString(),
            ...entry,
        };
        appendFileSync(logPath, JSON.stringify(fullEntry) + '\n', 'utf-8');
        // Rotate if needed
        const lines = readFileSync(logPath, 'utf-8')
            .split('\n')
            .filter((l) => l.trim() !== '');
        if (lines.length > MAX_ENTRIES) {
            const trimmed = lines.slice(lines.length - MAX_ENTRIES);
            writeFileSync(logPath, trimmed.join('\n') + '\n', 'utf-8');
        }
    }
    catch {
        // Silent — never let logging break the main flow
    }
}
/**
 * Read the most recent n error entries (default 10).
 * Returns empty array if the log file does not exist.
 */
export function readRecentErrors(directory, n = 10) {
    try {
        const logPath = getLogPath(directory);
        if (!existsSync(logPath)) {
            return [];
        }
        const lines = readFileSync(logPath, 'utf-8')
            .split('\n')
            .filter((l) => l.trim() !== '');
        return lines
            .slice(-n)
            .map((line) => JSON.parse(line));
    }
    catch {
        return [];
    }
}
/**
 * Clear the error log file.
 */
export function clearErrorLog(directory) {
    try {
        const logPath = getLogPath(directory);
        if (existsSync(logPath)) {
            writeFileSync(logPath, '', 'utf-8');
        }
    }
    catch {
        // Silent
    }
}
//# sourceMappingURL=index.js.map