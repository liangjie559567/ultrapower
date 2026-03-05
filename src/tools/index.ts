/**
 * Tool Registry and MCP Server Creation
 *
 * This module exports all custom tools and provides helpers
 * for creating MCP servers with the Claude Agent SDK.
 */

import { z } from 'zod';
import { lspTools } from './lsp-tools.js';
import { astTools } from './ast-tools.js';
import { pythonReplTool } from './python-repl/index.js';
import { stateTools } from './state-tools.js';
import { notepadTools } from './notepad-tools.js';
import { memoryTools } from './memory-tools.js';
import { traceTools } from './trace-tools.js';
import { skillsTools } from './skills-tools.js';
import { registerToolWithBothNames } from './tool-prefix-migration.js';

export { lspTools } from './lsp-tools.js';
export { astTools } from './ast-tools.js';
export { pythonReplTool } from './python-repl/index.js';
export { stateTools } from './state-tools.js';
export { notepadTools } from './notepad-tools.js';
export { memoryTools } from './memory-tools.js';
export { traceTools } from './trace-tools.js';
export { skillsTools } from './skills-tools.js';

/**
 * Generic tool definition type
 */
export interface GenericToolDefinition {
  name: string;
  description: string;
  schema: z.ZodRawShape;
  handler: (args: unknown) => Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }>;
}

/**
 * All custom tools available in the system
 * Each tool is registered with both legacy (underscore) and new (ultrapower:) names
 */
export const allCustomTools: GenericToolDefinition[] = [
  ...(lspTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  ...(astTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  ...registerToolWithBothNames(pythonReplTool as unknown as GenericToolDefinition),
  ...(stateTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  ...(notepadTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  ...(memoryTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  ...(traceTools as unknown as GenericToolDefinition[]).flatMap(registerToolWithBothNames),
  ...skillsTools as unknown as GenericToolDefinition[]
];

/**
 * Get tools by category
 */
export function getToolsByCategory(category: 'lsp' | 'ast' | 'python' | 'state' | 'notepad' | 'memory' | 'trace' | 'skills' | 'all'): GenericToolDefinition[] {
  switch (category) {
    case 'lsp':
      return lspTools as unknown as GenericToolDefinition[];
    case 'ast':
      return astTools as unknown as GenericToolDefinition[];
    case 'python':
      return [pythonReplTool as unknown as GenericToolDefinition];
    case 'state':
      return stateTools as unknown as GenericToolDefinition[];
    case 'notepad':
      return notepadTools as unknown as GenericToolDefinition[];
    case 'memory':
      return memoryTools as unknown as GenericToolDefinition[];
    case 'trace':
      return traceTools as unknown as GenericToolDefinition[];
    case 'skills':
      return skillsTools as unknown as GenericToolDefinition[];
    case 'all':
      return allCustomTools;
  }
}

/**
 * Create a Zod schema object from a tool's schema definition
 */
export function createZodSchema<T extends z.ZodRawShape>(schema: T): z.ZodObject<T> {
  return z.object(schema);
}

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
export function toSdkToolFormat(tool: GenericToolDefinition): SdkToolFormat {
  const zodSchema = z.object(tool.schema);
  const jsonSchema = zodToJsonSchema(zodSchema);

  return {
    name: tool.name,
    description: tool.description,
    inputSchema: jsonSchema
  };
}

/**
 * Simple Zod to JSON Schema converter for tool definitions
 */
function zodToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
} {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = value as z.ZodTypeAny;
    properties[key] = zodTypeToJsonSchema(zodType);

    // Check if the field is required (not optional)
    if (!zodType.isOptional()) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required
  };
}

/**
 * Convert individual Zod types to JSON Schema
 */
function zodTypeToJsonSchema(zodType: z.ZodTypeAny): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Handle optional wrapper
  if (zodType instanceof z.ZodOptional) {
    return zodTypeToJsonSchema(zodType._def.innerType);
  }

  // Handle default wrapper
  if (zodType instanceof z.ZodDefault) {
    const inner = zodTypeToJsonSchema(zodType._def.innerType);
    inner.default = zodType._def.defaultValue();
    return inner;
  }

  // Get description if available
  const description = zodType._def.description;
  if (description) {
    result.description = description;
  }

  // Handle basic types
  if (zodType instanceof z.ZodString) {
    result.type = 'string';
  } else if (zodType instanceof z.ZodNumber) {
    result.type = zodType._def.checks?.some((c: { kind: string }) => c.kind === 'int')
      ? 'integer'
      : 'number';
  } else if (zodType instanceof z.ZodBoolean) {
    result.type = 'boolean';
  } else if (zodType instanceof z.ZodArray) {
    result.type = 'array';
    result.items = zodTypeToJsonSchema(zodType._def.type);
  } else if (zodType instanceof z.ZodEnum) {
    result.type = 'string';
    result.enum = zodType._def.values;
  } else if (zodType instanceof z.ZodObject) {
    return zodToJsonSchema(zodType);
  } else {
    // Fallback for unknown types
    result.type = 'string';
  }

  return result;
}
