/**
 * Type definitions for MCP tool schemas
 * Eliminates need for `as any` in tool definitions
 */
export interface ToolSchema {
    type: string;
    description?: string;
    items?: {
        type: string;
    };
    enum?: readonly string[];
}
export type ToolSchemaMap = Record<string, ToolSchema>;
export interface AskGeminiArgs {
    agent_role: string;
    prompt?: string;
    prompt_file?: string;
    output_file?: string;
    files?: string[];
    model?: string;
    background?: boolean;
    working_directory?: string;
}
export interface AskCodexArgs {
    agent_role: string;
    prompt?: string;
    prompt_file?: string;
    output_file?: string;
    context_files?: string[];
    model?: string;
    reasoning_effort?: string;
    background?: boolean;
    working_directory?: string;
}
export interface WaitForJobArgs {
    job_id: string;
    timeout_ms?: number;
}
export interface CheckJobStatusArgs {
    job_id: string;
}
export interface KillJobArgs {
    job_id: string;
    signal?: string;
}
export interface ListJobsArgs {
    status_filter?: 'active' | 'completed' | 'failed' | 'all';
    limit?: number;
}
//# sourceMappingURL=tool-types.d.ts.map