/**
 * MCP Server Configuration Schema
 */
import { z } from 'zod';
export const MCPServerConfigSchema = z.object({
    command: z.string().min(1, 'Command is required'),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    disabled: z.boolean().optional().default(false),
    autoApprove: z.array(z.string()).optional().default([]),
});
export const MCPConfigSchema = z.object({
    mcpServers: z.record(MCPServerConfigSchema),
});
export function validateConfig(config) {
    return MCPConfigSchema.parse(config);
}
//# sourceMappingURL=config-schema.js.map