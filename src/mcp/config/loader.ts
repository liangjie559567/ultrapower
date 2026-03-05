/**
 * MCP Configuration Loader
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { MCPConfigSchema, MCPConfig } from './schema.js';

export function loadConfig(projectDir?: string): MCPConfig {
  const configs: MCPConfig[] = [];

  const userPath = join(homedir(), '.omc', 'mcp-config.json');
  if (existsSync(userPath)) {
    configs.push(MCPConfigSchema.parse(JSON.parse(readFileSync(userPath, 'utf-8'))));
  }

  if (projectDir) {
    const projectPath = join(projectDir, '.omc', 'mcp-config.json');
    if (existsSync(projectPath)) {
      configs.push(MCPConfigSchema.parse(JSON.parse(readFileSync(projectPath, 'utf-8'))));
    }
  }

  return expandEnvVars(mergeConfigs(configs));
}

function mergeConfigs(configs: MCPConfig[]): MCPConfig {
  const merged: MCPConfig = { mcpServers: {} };
  for (const config of configs) {
    Object.assign(merged.mcpServers, config.mcpServers);
  }
  return merged;
}

function expandEnvVars(config: MCPConfig): MCPConfig {
  const expanded: MCPConfig = { mcpServers: {} };
  for (const [name, server] of Object.entries(config.mcpServers)) {
    expanded.mcpServers[name] = {
      ...server,
      command: expandString(server.command),
      args: server.args?.map(expandString),
      env: server.env ? Object.fromEntries(Object.entries(server.env).map(([k, v]) => [k, expandString(v)])) : undefined,
    };
  }
  return expanded;
}

function expandString(str: string): string {
  return str.replace(/\$\{([^}:]+)(?::-(.*?))?\}/g, (_, name, def) => {
    const val = process.env[name];
    if (val !== undefined) return val;
    if (def !== undefined) return def;
    throw new Error(`Environment variable ${name} is not defined`);
  });
}
