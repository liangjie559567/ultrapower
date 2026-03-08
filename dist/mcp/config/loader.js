/**
 * MCP Configuration Loader
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { MCPConfigSchema } from './schema.js';
export function loadConfig(projectDir) {
    const configs = [];
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
function mergeConfigs(configs) {
    const merged = { mcpServers: {} };
    for (const config of configs) {
        Object.assign(merged.mcpServers, config.mcpServers);
    }
    return merged;
}
function expandEnvVars(config) {
    const expanded = { mcpServers: {} };
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
function expandString(str) {
    return str.replace(/\$\{([^}:]+)(?::-(.*?))?\}/g, (_, name, def) => {
        const val = process.env[name];
        if (val !== undefined)
            return val;
        if (def !== undefined)
            return def;
        throw new Error(`Environment variable ${name} is not defined`);
    });
}
//# sourceMappingURL=loader.js.map