/**
 * Namespace Manager for MCP Tools
 * Manages tool registration with namespace support and conflict detection
 */

import { GenericToolDefinition } from '../tools/index.js';

export class NamespaceManager {
  private tools = new Map<string, GenericToolDefinition>();
  private namespaces = new Map<string, Set<string>>();

  /**
   * Register tools under a namespace
   */
  registerTools(namespace: string, tools: GenericToolDefinition[]): void {
    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Set());
    }

    const nsTools = this.namespaces.get(namespace)!;

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
  resolveTool(name: string): GenericToolDefinition | undefined {
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
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tools by namespace
   */
  getNamespaceTools(namespace: string): string[] {
    const nsTools = this.namespaces.get(namespace);
    return nsTools ? Array.from(nsTools) : [];
  }
}
