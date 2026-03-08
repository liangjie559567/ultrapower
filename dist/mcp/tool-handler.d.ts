/**
 * Tool Call Handler for MCP Server
 */
/**
 * Handle tool call request with error handling and timeout protection
 */
export declare function handleToolCall(name: string, args: unknown): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=tool-handler.d.ts.map