/**
 * Namespace Manager for MCP Tools
 * Manages tool registration with namespace support and conflict detection
 */
import { GenericToolDefinition } from '../tools/index.js';
export declare class NamespaceManager {
    private tools;
    private namespaces;
    /**
     * Register tools under a namespace
     */
    registerTools(namespace: string, tools: GenericToolDefinition[]): void;
    /**
     * Resolve tool by name (supports both namespaced and plain names)
     */
    resolveTool(name: string): GenericToolDefinition | undefined;
    /**
     * Get all registered tool names
     */
    getAllToolNames(): string[];
    /**
     * Get tools by namespace
     */
    getNamespaceTools(namespace: string): string[];
}
//# sourceMappingURL=namespace.d.ts.map