/**
 * Public API for ultrapower
 * @module api
 */

export * from './agents.js';
export * from './hooks.js';
export * from './tools.js';
export * from './features.js';

// Core session management
export {
  createSisyphusSession,
  enhancePrompt,
  getOmcSystemPrompt,
  type SisyphusOptions,
  type SisyphusSession
} from '../index.js';

// Configuration
export { loadConfig } from '../config/loader.js';
export type { PluginConfig } from '../shared/types.js';

// MCP servers
export { getDefaultMcpServers, toSdkMcpFormat } from '../mcp/servers.js';
