import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { MCPConfigSchema, MCPConfig } from './schema.js';

/**
 * Load MCP configuration from .mcp.json
 */
export function loadConfig(cwd: string = process.cwd()): MCPConfig {
  const configPath = join(cwd, '.mcp.json');

  if (!existsSync(configPath)) {
    return { mcpServers: {} };
  }

  const content = readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(content);

  return MCPConfigSchema.parse(parsed);
}
