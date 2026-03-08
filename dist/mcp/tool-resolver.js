/**
 * Tool Name Resolver for MCP Server
 */
import { allCustomTools } from '../tools/index.js';
import { parseNamespace, isNamespaced } from './namespace-manager.js';
/**
 * Resolve tool name to tool definition
 * Supports both plain names and namespaced names (mcp__server__tool)
 */
export function resolveTool(name) {
    // Try direct match first
    const directMatch = allCustomTools.find(t => t.name === name);
    if (directMatch)
        return directMatch;
    // Try namespaced match
    if (isNamespaced(name)) {
        const parsed = parseNamespace(name);
        if (parsed) {
            return allCustomTools.find(t => t.name === parsed.toolName);
        }
    }
    return undefined;
}
/**
 * Get all available tool names
 */
export function getAllToolNames() {
    return allCustomTools.map(t => t.name);
}
//# sourceMappingURL=tool-resolver.js.map