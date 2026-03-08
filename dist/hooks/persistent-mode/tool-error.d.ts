/**
 * Tool error state management
 * Extracted to break circular dependencies
 */
export interface ToolErrorState {
    tool_name: string;
    tool_input_preview?: string;
    error: string;
    timestamp: string;
    retry_count: number;
}
export declare function readLastToolError(directory: string): ToolErrorState | null;
export declare function clearToolErrorState(directory: string): void;
export declare function getToolErrorRetryGuidance(toolError: ToolErrorState | null): string;
//# sourceMappingURL=tool-error.d.ts.map