/**
 * Shared types for hook bridge system
 * Extracted to break circular dependency between bridge.ts and bridge-normalize.ts
 */
/**
 * Input format from Claude Code hooks (via stdin)
 */
export interface HookInput {
    /** Session identifier (camelCase) */
    sessionId?: string;
    /** Session identifier (snake_case from Claude Code) */
    session_id?: string;
    /** User prompt text */
    prompt?: string;
    /** Message content (alternative to prompt) */
    message?: {
        content?: string;
    };
    /** Message parts (alternative structure) */
    parts?: Array<{
        type: string;
        text?: string;
    }>;
    /** Tool name (camelCase) */
    toolName?: string;
    /** Tool name (snake_case from Claude Code) */
    tool_name?: string;
    /** Tool input parameters (camelCase) */
    toolInput?: unknown;
    /** Tool input parameters (snake_case from Claude Code) */
    tool_input?: unknown;
    /** Tool output (camelCase) */
    toolOutput?: unknown;
    /** Tool response (snake_case from Claude Code) */
    tool_response?: unknown;
    /** Working directory (camelCase) */
    directory?: string;
    /** Working directory (snake_case from Claude Code) */
    cwd?: string;
    /** Hook event name (snake_case from Claude Code) */
    hook_event_name?: string;
    /** Allow other fields to pass through */
    [key: string]: unknown;
}
/**
 * Output format for Claude Code hooks (to stdout)
 */
export interface HookOutput {
    /** Whether to continue with the operation */
    continue: boolean;
    /** Optional message to inject into context */
    message?: string;
    /** Additional context to inject (for workflow gates) */
    additionalContext?: string;
    /** Reason for blocking (when continue=false) */
    reason?: string;
    /** Modified tool input (for pre-tool hooks) */
    modifiedInput?: unknown;
}
/**
 * Hook types that can be processed
 */
export type HookType = "keyword-detector" | "stop-continuation" | "ralph" | "persistent-mode" | "session-start" | "session-end" | "pre-tool-use" | "post-tool-use" | "autopilot" | "subagent-start" | "subagent-stop" | "pre-compact" | "setup-init" | "setup-maintenance" | "permission-request" | "delegation-enforcer" | "omc-orchestrator-pre-tool" | "omc-orchestrator-post-tool" | "user-prompt-submit" | "file-save" | "setup" | "agent-execution-complete";
/**
 * Hook severity levels for error handling
 */
export declare enum HookSeverity {
    CRITICAL = "critical",// Failure must block operation
    HIGH = "high",// Failure should block (configurable)
    LOW = "low"
}
/**
 * Severity mapping for each hook type
 */
export declare const HOOK_SEVERITY: Record<HookType, HookSeverity>;
//# sourceMappingURL=bridge-types.d.ts.map