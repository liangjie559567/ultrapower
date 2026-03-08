import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MCPConfigSchema } from './schema.js';
/**
 * Load MCP configuration from .mcp.json
 */
export function loadConfig(cwd = process.cwd()) {
    const configPath = join(cwd, '.mcp.json');
    if (!existsSync(configPath)) {
        return { mcpServers: {} };
    }
    const content = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    return MCPConfigSchema.parse(parsed);
}
//# sourceMappingURL=config-loader.js.map