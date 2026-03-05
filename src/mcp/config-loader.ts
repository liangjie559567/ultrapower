/**
 * MCP Configuration Loader
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { validateConfig, MCPConfig, MCPServerConfig } from './config-schema.js';

export function loadConfig(projectDir?: string): MCPConfig {
  const configs: MCPConfig[] = [];

  // Load user-level config
  const userConfigPath = join(homedir(), '.omc', 'mcp-config.json');
  if (existsSync(userConfigPath)) {
    const userConfig = JSON.parse(readFileSync(userConfigPath, 'utf-8'));
    configs.push(validateConfig(userConfig));
  }

  // Load project-level config
  if (projectDir) {
    const projectConfigPath = join(projectDir, '.omc', 'mcp-config.json');
    if (existsSync(projectConfigPath)) {
      const projectConfig = JSON.parse(readFileSync(projectConfigPath, 'utf-8'));
      configs.push(validateConfig(projectConfig));
    }
  }

  // Merge and expand env vars
  const merged = mergeConfigs(configs);
  return expandEnvVars(merged);
}

function mergeConfigs(configs: MCPConfig[]): MCPConfig {
  const merged: MCPConfig = { mcpServers: {} };

  for (const config of configs) {
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      merged.mcpServers[name] = serverConfig;
    }
  }

  return merged;
}

function expandEnvVars(config: MCPConfig): MCPConfig {
  const expanded: MCPConfig = { mcpServers: {} };

  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    expanded.mcpServers[name] = {
      ...serverConfig,
      command: expandString(serverConfig.command),
      args: serverConfig.args?.map(expandString),
      env: serverConfig.env ? expandEnvObject(serverConfig.env) : undefined,
    };
  }

  return expanded;
}

function expandString(str: string): string {
  return str.replace(/\$\{([^}:]+)(?::-(.*?))?\}/g, (_, varName, defaultValue) => {
    const value = process.env[varName];
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable ${varName} is not defined`);
  });
}

function expandEnvObject(env: Record<string, string>): Record<string, string> {
  const expanded: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    expanded[key] = expandString(value);
  }
  return expanded;
}
