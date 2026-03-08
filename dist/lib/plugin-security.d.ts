/**
 * Plugin security validation: static analysis + runtime permission model.
 * Sandbox strategy: Worker Threads (Node.js built-in, no extra deps).
 */
export interface SecurityViolation {
    file: string;
    line: number;
    label: string;
    snippet: string;
}
export interface SecurityReport {
    safe: boolean;
    violations: SecurityViolation[];
}
/**
 * Run static analysis on a plugin directory.
 */
export declare function analyzePlugin(pluginDir: string): SecurityReport;
//# sourceMappingURL=plugin-security.d.ts.map