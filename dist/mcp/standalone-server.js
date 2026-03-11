#!/usr/bin/env node
/**
 * Standalone MCP Server for OMC Tools
 *
 * This server exposes LSP, AST, and Python REPL tools via stdio transport
 * for discovery by Claude Code's MCP management system.
 *
 * Usage: node dist/mcp/standalone-server.js
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall } from './tool-handler.js';
import { mcpServerTools } from '../tools/index.js';
import { z } from 'zod';
// Use MCP server tools (without ultrapower: prefix to avoid name length issues)
const allTools = mcpServerTools;
// Convert Zod schema to JSON Schema for MCP
function zodToJsonSchema(schema) {
    // Handle both ZodObject and raw shape
    const rawShape = schema instanceof z.ZodObject ? schema.shape : schema;
    const properties = {};
    const required = [];
    for (const [key, value] of Object.entries(rawShape)) {
        const zodType = value;
        properties[key] = zodTypeToJsonSchema(zodType);
        // Check if required (not optional) - with safety check
        const isOptional = zodType && typeof zodType.isOptional === 'function' && zodType.isOptional();
        if (!isOptional) {
            required.push(key);
        }
    }
    return {
        type: 'object',
        properties,
        required
    };
}
function zodTypeToJsonSchema(zodType) {
    const result = {};
    // Safety check for undefined zodType
    if (!zodType || !zodType._def) {
        return { type: 'string' };
    }
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
    const description = zodType._def?.description;
    if (description) {
        result.description = description;
    }
    // Handle basic types
    if (zodType instanceof z.ZodString) {
        result.type = 'string';
    }
    else if (zodType instanceof z.ZodNumber) {
        result.type = zodType._def?.checks?.some((c) => c.kind === 'int')
            ? 'integer'
            : 'number';
    }
    else if (zodType instanceof z.ZodBoolean) {
        result.type = 'boolean';
    }
    else if (zodType instanceof z.ZodArray) {
        result.type = 'array';
        result.items = zodType._def?.type ? zodTypeToJsonSchema(zodType._def.type) : { type: 'string' };
    }
    else if (zodType instanceof z.ZodEnum) {
        result.type = 'string';
        result.enum = zodType._def?.values;
    }
    else if (zodType instanceof z.ZodObject) {
        return zodToJsonSchema(zodType.shape);
    }
    else if (zodType instanceof z.ZodRecord) {
        // Handle z.record() - maps to JSON object with additionalProperties
        result.type = 'object';
        if (zodType._def?.valueType) {
            result.additionalProperties = zodTypeToJsonSchema(zodType._def.valueType);
        }
    }
    else {
        result.type = 'string';
    }
    return result;
}
// Create the MCP server
const server = new Server({
    name: 't',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: allTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: zodToJsonSchema(tool.schema),
        })),
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args);
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('OMC Tools MCP Server running on stdio');
}
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=standalone-server.js.map