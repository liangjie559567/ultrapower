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
export function addNamespace(serverName: string, toolName: string): string {
  return `mcp__${serverName}__${toolName}`;
}

/**
 * Parse namespaced tool name
 */
export function parseNamespace(namespacedName: string): { serverName: string; toolName: string } | null {
  const match = namespacedName.match(/^mcp__([^_]+)__(.+)$/);
  if (!match) return null;
  return { serverName: match[1], toolName: match[2] };
}

/**
 * Check if tool name is namespaced
 */
export function isNamespaced(name: string): boolean {
  return /^mcp__[^_]+__.+$/.test(name);
}
