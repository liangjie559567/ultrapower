import type { BridgeConfig } from './types.js';
/**
 * Validate that a config path is under the user's home directory
 * and contains a trusted subpath (Claude config dir or ~/.omc/).
 * Resolves the path first to defeat traversal attacks like ~/foo/.claude/../../evil.json.
 */
export declare function validateConfigPath(configPath: string, homeDir: string, claudeConfigDir: string): boolean;
/**
 * Validate the bridge working directory is safe:
 * - Must exist and be a directory
 * - Must resolve (via realpathSync) to a path under the user's home directory
 * - Must be inside a git worktree
 */
export declare function validateBridgeWorkingDirectory(workingDirectory: string): void;
/**
 * Validate and normalize a bridge config object.
 * Throws on validation errors.
 */
export declare function validateAndNormalizeConfig(config: BridgeConfig): BridgeConfig;
/**
 * Parse and validate config file path from command line arguments.
 * Returns the validated config path.
 */
export declare function parseAndValidateConfigPath(argv: string[]): string;
/**
 * Load and validate config from file.
 */
export declare function loadConfigFromFile(configPath: string): BridgeConfig;
//# sourceMappingURL=bridge-entry.d.ts.map