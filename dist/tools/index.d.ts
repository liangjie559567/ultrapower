/**
 * Tool Registry and MCP Server Creation
 *
 * This module exports all custom tools and provides helpers
 * for creating MCP servers with the Claude Agent SDK.
 */
import { z } from 'zod';
import { GenericToolDefinition } from './tool-prefix-migration.js';
export { lspTools } from './lsp-tools.js';
export { astTools } from './ast-tools.js';
export { pythonReplTool } from './python-repl/index.js';
export { stateTools } from './state-tools.js';
export { notepadTools } from './notepad-tools.js';
export { memoryTools } from './memory-tools.js';
export { traceTools } from './trace-tools.js';
export { skillsTools } from './skills-tools.js';
export { dependencyAnalyzerTool } from './dependency-analyzer.js';
export { docSyncTool } from './doc-sync.js';
export { parallelOpportunityDetectorTool } from './parallel-opportunity-detector.js';
export { GenericToolDefinition } from './tool-prefix-migration.js';
/**
 * All custom tools available in the system
 * Each tool is registered with both legacy (underscore) and new (ultrapower:) names
 */
export declare const allCustomTools: GenericToolDefinition[];
/**
 * Tools for MCP server (without ultrapower: prefix to avoid name length issues)
 * Filter out tools with ultrapower: prefix to prevent exceeding API name length limits
 */
export declare const mcpServerTools: GenericToolDefinition[];
/**
 * Get tools by category
 */
export declare function getToolsByCategory(category: 'lsp' | 'ast' | 'python' | 'state' | 'notepad' | 'memory' | 'trace' | 'skills' | 'all'): GenericToolDefinition[];
/**
 * Create a Zod schema object from a tool's schema definition
 */
export declare function createZodSchema<T extends z.ZodRawShape>(schema: T): z.ZodObject<T>;
/**
 * Format for creating tools compatible with Claude Agent SDK
 */
export interface SdkToolFormat {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required: string[];
    };
}
/**
 * Convert our tool definitions to SDK format
 */
export declare function toSdkToolFormat(tool: GenericToolDefinition): SdkToolFormat;
//# sourceMappingURL=index.d.ts.map