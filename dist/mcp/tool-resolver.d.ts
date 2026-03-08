/**
 * Tool Name Resolver for MCP Server
 */
/**
 * Resolve tool name to tool definition
 * Supports both plain names and namespaced names (mcp__server__tool)
 */
export declare function resolveTool(name: string): import("../tools/index.js").GenericToolDefinition | undefined;
/**
 * Get all available tool names
 */
export declare function getAllToolNames(): string[];
//# sourceMappingURL=tool-resolver.d.ts.map