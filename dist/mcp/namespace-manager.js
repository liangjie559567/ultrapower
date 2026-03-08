/**
 * Namespace Manager for MCP Tools
 * Handles mcp__servername__toolname format
 */
/**
 * Add namespace prefix to tool name
 */
export function addNamespace(serverName, toolName) {
    return `mcp__${serverName}__${toolName}`;
}
/**
 * Parse namespaced tool name
 */
export function parseNamespace(namespacedName) {
    const match = namespacedName.match(/^mcp__([^_]+)__(.+)$/);
    if (!match)
        return null;
    return { serverName: match[1], toolName: match[2] };
}
/**
 * Check if tool name is namespaced
 */
export function isNamespaced(name) {
    return /^mcp__[^_]+__.+$/.test(name);
}
//# sourceMappingURL=namespace-manager.js.map