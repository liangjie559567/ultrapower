// src/team/bridge-entry.ts
//
// Entry point for the bridge daemon, invoked from tmux:
//   node dist/team/bridge-entry.js --config /path/to/config.json
//
// Config via temp file, not inline JSON argument.

import { readFileSync, statSync, realpathSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import type { BridgeConfig } from './types.js';
import { runBridge } from './mcp-team-bridge.js';
import { deleteHeartbeat } from './heartbeat.js';
import { unregisterMcpWorker } from './team-registration.js';
import { getWorktreeRoot } from '../lib/worktree-paths.js';
import { getClaudeConfigDir } from '../utils/paths.js';
import { sanitizeName } from './tmux-session.js';

/**
 * Validate that a config path is under the user's home directory
 * and contains a trusted subpath (Claude config dir or ~/.omc/).
 * Resolves the path first to defeat traversal attacks like ~/foo/.claude/../../evil.json.
 */
export function validateConfigPath(configPath: string, homeDir: string, claudeConfigDir: string): boolean {
  // Normalize to forward slashes for cross-platform comparison
  const norm = (p: string) => resolve(p).replace(/\\/g, '/');

  const resolved = norm(configPath);
  const normalizedHome = norm(homeDir);
  const normalizedConfigDir = norm(claudeConfigDir);
  const normalizedOmcDir = norm(homeDir + '/.omc');

  const isUnderHome = resolved.startsWith(normalizedHome + '/') || resolved === normalizedHome;
  const hasOmcComponent = resolved.includes('/.omc/') || resolved.endsWith('/.omc');
  const isTrustedSubpath =
    resolved === normalizedConfigDir ||
    resolved.startsWith(normalizedConfigDir + '/') ||
    resolved === normalizedOmcDir ||
    resolved.startsWith(normalizedOmcDir + '/') ||
    hasOmcComponent;
  if (!isUnderHome || !isTrustedSubpath) return false;

  // Additionally verify via realpathSync on the parent directory (if it exists)
  // to defeat symlink attacks where the parent is a symlink outside home
  try {
    const parentDir = resolve(resolved, '..');
    const realParent = realpathSync(parentDir).replace(/\\/g, '/');
    if (!realParent.startsWith(normalizedHome + '/') && realParent !== normalizedHome) {
      return false;
    }
  } catch {
    // Parent directory doesn't exist yet — allow (file may be about to be created)
  }

  return true;
}

/**
 * Validate the bridge working directory is safe:
 * - Must exist and be a directory
 * - Production: Must resolve to a path under the user's home directory
 * - CI: Must resolve to a path under the CI workspace (GITHUB_WORKSPACE or CI_PROJECT_DIR)
 * - Must be inside a git worktree
 */
export function validateBridgeWorkingDirectory(workingDirectory: string): void {
  // Check exists and is directory
  let stat;
  try {
    stat = statSync(workingDirectory);
  } catch {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  if (!stat.isDirectory()) {
    throw new Error(`workingDirectory is not a directory: ${workingDirectory}`);
  }

  // Resolve symlinks and verify path constraints
  const isCI = process.env.CI === 'true' || process.env.CI === '1' ||
               process.env.GITHUB_ACTIONS === 'true' ||
               process.env.GITLAB_CI === 'true' ||
               process.env.CIRCLECI === 'true' ||
               !!process.env.JENKINS_HOME;

  const resolved = realpathSync(workingDirectory).replace(/\\/g, '/');

  if (!isCI) {
    // Production: strict home directory check
    const home = homedir().replace(/\\/g, '/');
    if (!resolved.startsWith(home + '/') && resolved !== home) {
      throw new Error(`workingDirectory is outside home directory: ${resolved}`);
    }
  } else {
    // CI: validate against workspace
    const workspace = process.env.GITHUB_WORKSPACE || process.env.CI_PROJECT_DIR;
    if (workspace) {
      const wsResolved = realpathSync(workspace).replace(/\\/g, '/');
      if (!resolved.startsWith(wsResolved + '/') && resolved !== wsResolved) {
        throw new Error(`workingDirectory is outside CI workspace: ${resolved}`);
      }
    }
  }

  // Must be inside a git worktree
  const root = getWorktreeRoot(workingDirectory);
  if (!root) {
    throw new Error(`workingDirectory is not inside a git worktree: ${workingDirectory}`);
  }
}

/**
 * Validate and normalize a bridge config object.
 * Throws on validation errors.
 */
export function validateAndNormalizeConfig(config: BridgeConfig): BridgeConfig {
  // Validate required fields
  const required: (keyof BridgeConfig)[] = ['teamName', 'workerName', 'provider', 'workingDirectory'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required config field: ${field}`);
    }
  }

  // Sanitize team and worker names (prevent tmux injection)
  config.teamName = sanitizeName(config.teamName);
  config.workerName = sanitizeName(config.workerName);

  // Validate provider
  if (config.provider !== 'codex' && config.provider !== 'gemini') {
    throw new Error(`Invalid provider: ${config.provider}. Must be 'codex' or 'gemini'.`);
  }

  // Validate working directory before use
  validateBridgeWorkingDirectory(config.workingDirectory);

  // Validate permission enforcement config
  if (config.permissionEnforcement) {
    const validModes = ['off', 'audit', 'enforce'];
    if (!validModes.includes(config.permissionEnforcement)) {
      throw new Error(`Invalid permissionEnforcement: ${config.permissionEnforcement}. Must be 'off', 'audit', or 'enforce'.`);
    }

    // Validate permissions shape when enforcement is active
    if (config.permissionEnforcement !== 'off' && config.permissions) {
      const p = config.permissions;
      if (p.allowedPaths && !Array.isArray(p.allowedPaths)) {
        throw new Error('permissions.allowedPaths must be an array of strings');
      }
      if (p.deniedPaths && !Array.isArray(p.deniedPaths)) {
        throw new Error('permissions.deniedPaths must be an array of strings');
      }
      if (p.allowedCommands && !Array.isArray(p.allowedCommands)) {
        throw new Error('permissions.allowedCommands must be an array of strings');
      }

      // Reject dangerous patterns that could defeat the deny-defaults
      const dangerousPatterns = ['**', '*', '!.git/**', '!.env*', '!**/.env*'];
      for (const pattern of (p.allowedPaths || [])) {
        if (dangerousPatterns.includes(pattern)) {
          throw new Error(`Dangerous allowedPaths pattern rejected: "${pattern}"`);
        }
      }
    }
  }

  // Apply defaults
  config.pollIntervalMs = config.pollIntervalMs || 3000;
  config.taskTimeoutMs = config.taskTimeoutMs || 600_000;
  config.maxConsecutiveErrors = config.maxConsecutiveErrors || 3;
  config.outboxMaxLines = config.outboxMaxLines || 500;
  config.maxRetries = config.maxRetries || 5;
  config.permissionEnforcement = config.permissionEnforcement || 'off';

  return config;
}

/**
 * Parse and validate config file path from command line arguments.
 * Returns the validated config path.
 */
export function parseAndValidateConfigPath(argv: string[]): string {
  const configIdx = argv.indexOf('--config');
  if (configIdx === -1 || !argv[configIdx + 1]) {
    throw new Error('Usage: node bridge-entry.js --config <path-to-config.json>');
  }

  const configPath = resolve(argv[configIdx + 1]);

  // Validate config path is from a trusted location
  const home = homedir();
  const claudeConfigDir = getClaudeConfigDir();
  if (!validateConfigPath(configPath, home, claudeConfigDir)) {
    throw new Error(`Config path must be under ~/ with ${claudeConfigDir} or ~/.omc/ subpath: ${configPath}`);
  }

  return configPath;
}

/**
 * Load and validate config from file.
 */
export function loadConfigFromFile(configPath: string): BridgeConfig {
  let config: BridgeConfig;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read config from ${configPath}: ${(err as Error).message}`);
  }

  return validateAndNormalizeConfig(config);
}

function main(): void {
  let config: BridgeConfig;

  try {
    const configPath = parseAndValidateConfigPath(process.argv);
    config = loadConfigFromFile(configPath);
  } catch (err) {
    console.error(`[bridge] ${(err as Error).message}`);
    process.exit(1);
  }

  // Signal handlers for graceful cleanup on external termination
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      console.error(`[bridge] Received ${sig}, shutting down...`);
      try {
        deleteHeartbeat(config.workingDirectory, config.teamName, config.workerName);
        unregisterMcpWorker(config.teamName, config.workerName, config.workingDirectory);
      } catch { /* best-effort cleanup */ }
      process.exit(0);
    });
  }

  // Run bridge (never returns unless shutdown)
  runBridge(config).catch(err => {
    console.error(`[bridge] Fatal error: ${(err as Error).message}`);
    process.exit(1);
  });
}

// Only run main if this file is the entry point (not imported for testing).
// Note: require.main === module is correct here - this file is bundled to CJS by esbuild.
if (require.main === module) {
  main();
}
