/**
 * Persistent Error Log
 *
 * Replaces the 60-second expiring error state with a persistent JSONL log.
 * Each line is a JSON-encoded ErrorLogEntry.
 */
export interface ErrorLogEntry {
    timestamp: string;
    tool_name: string;
    error: string;
    context?: Record<string, unknown>;
    session_id?: string;
}
/**
 * Append an error entry to the persistent log.
 * Automatically adds timestamp and rotates if over MAX_ENTRIES.
 */
export declare function appendError(directory: string, entry: Omit<ErrorLogEntry, 'timestamp'>): void;
/**
 * Read the most recent n error entries (default 10).
 * Returns empty array if the log file does not exist.
 */
export declare function readRecentErrors(directory: string, n?: number): ErrorLogEntry[];
/**
 * Clear the error log file.
 */
export declare function clearErrorLog(directory: string): void;
//# sourceMappingURL=index.d.ts.map