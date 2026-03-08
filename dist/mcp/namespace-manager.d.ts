/**
 * Namespace Manager for MCP Tools
 * Handles mcp__servername__toolname format
 */
export interface NamespacedTool {
    originalName: string;
    namespacedName: string;
    serverName: string;
}
/**
 * Add namespace prefix to tool name
 */
export declare function addNamespace(serverName: string, toolName: string): string;
/**
 * Parse namespaced tool name
 */
export declare function parseNamespace(namespacedName: string): {
    serverName: string;
    toolName: string;
} | null;
/**
 * Check if tool name is namespaced
 */
export declare function isNamespaced(name: string): boolean;
//# sourceMappingURL=namespace-manager.d.ts.map