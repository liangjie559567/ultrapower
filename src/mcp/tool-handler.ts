/**
 * Tool Call Handler for MCP Server
 */

import { resolveTool } from './tool-resolver.js';
import { withTimeout } from './timeout.js';

/**
 * Handle tool call request with error handling and timeout protection
 */
export async function handleToolCall(name: string, args: unknown) {
  const tool = resolveTool(name);

  if (!tool) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true
    };
  }

  try {
    const result = await withTimeout(() => tool.handler(args ?? {}));
    return {
      content: result.content,
      isError: false
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${message}` }],
      isError: true
    };
  }
}
