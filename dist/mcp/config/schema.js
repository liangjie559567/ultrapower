/**
 * MCP Server Configuration Schema
 */
import { z } from 'zod';
export const MCPServerConfigSchema = z.object({
    command: z.string().min(1),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    disabled: z.boolean().optional().default(false),
    autoApprove: z.array(z.string()).optional().default([]),
});
export const MCPConfigSchema = z.object({
    mcpServers: z.record(MCPServerConfigSchema),
});
//# sourceMappingURL=schema.js.map