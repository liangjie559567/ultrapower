/**
 * Namespace Manager for MCP Tools
 * Manages tool registration with namespace support and conflict detection
 */
export class NamespaceManager {
    tools = new Map();
    namespaces = new Map();
    /**
     * Register tools under a namespace
     */
    registerTools(namespace, tools) {
        if (!this.namespaces.has(namespace)) {
            this.namespaces.set(namespace, new Set());
        }
        const nsTools = this.namespaces.get(namespace);
        for (const tool of tools) {
            const fullName = namespace ? `${namespace}__${tool.name}` : tool.name;
            // Conflict detection
            if (this.tools.has(fullName)) {
                throw new Error(`Tool name conflict: ${fullName} already registered`);
            }
            this.tools.set(fullName, tool);
            nsTools.add(tool.name);
        }
    }
    /**
     * Resolve tool by name (supports both namespaced and plain names)
     */
    resolveTool(name) {
        // Try direct match first
        if (this.tools.has(name)) {
            return this.tools.get(name);
        }
        // Try without namespace prefix for backward compatibility
        for (const [fullName, tool] of this.tools.entries()) {
            if (fullName.endsWith(`__${name}`)) {
                return tool;
            }
        }
        return undefined;
    }
    /**
     * Get all registered tool names
     */
    getAllToolNames() {
        return Array.from(this.tools.keys());
    }
    /**
     * Get tools by namespace
     */
    getNamespaceTools(namespace) {
        const nsTools = this.namespaces.get(namespace);
        return nsTools ? Array.from(nsTools) : [];
    }
}
//# sourceMappingURL=namespace.js.map