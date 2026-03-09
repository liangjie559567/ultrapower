/**
 * CLI Detection Utility
 *
 * Detects whether Codex and Gemini CLIs are installed and available on the system PATH.
 * Results are cached per-session to avoid repeated filesystem checks.
 */

import { spawnSync } from 'child_process';

/**
 * Get platform-specific CLI command name
 * On Windows, npm global binaries need .cmd extension
 */
export function getCliCommand(baseName: string): string {
  return process.platform === 'win32' ? `${baseName}.cmd` : baseName;
}

export interface CliDetectionResult {
  available: boolean;
  path?: string;
  version?: string;
  error?: string;
  installHint: string;
}

// Session-level cache for detection results
let codexCache: CliDetectionResult | null = null;
let geminiCache: CliDetectionResult | null = null;

/**
 * Detect if Codex CLI is installed and available
 */
export function detectCodexCli(useCache = true): CliDetectionResult {
  if (useCache && codexCache) return codexCache;

  const installHint = 'Install Codex CLI: npm install -g @openai/codex';

  try {
    const codexCmd = getCliCommand('codex');
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const pathResult = spawnSync(cmd, [codexCmd], { encoding: 'utf-8', timeout: 5000 });
    if (pathResult.status !== 0) throw new Error('codex not found');
    const path = pathResult.stdout.trim();
    let version: string | undefined;
    try {
      const versionResult = spawnSync(codexCmd, ['--version'], { encoding: 'utf-8', timeout: 5000 });
      if (versionResult.status === 0) version = versionResult.stdout.trim();
    } catch {
      // Version check is optional
    }

    const result: CliDetectionResult = { available: true, path, version, installHint };
    codexCache = result;
    return result;
  } catch {
    const result: CliDetectionResult = {
      available: false,
      error: 'Codex CLI not found on PATH',
      installHint
    };
    codexCache = result;
    return result;
  }
}

/**
 * Detect if Gemini CLI is installed and available
 */
export function detectGeminiCli(useCache = true): CliDetectionResult {
  if (useCache && geminiCache) return geminiCache;

  const installHint = 'Install Gemini CLI: npm install -g @google/gemini-cli (see https://github.com/google-gemini/gemini-cli)';

  try {
    const geminiCmd = getCliCommand('gemini');
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const pathResult = spawnSync(cmd, [geminiCmd], { encoding: 'utf-8', timeout: 5000 });
    if (pathResult.status !== 0) throw new Error('gemini not found');
    const path = pathResult.stdout.trim();
    let version: string | undefined;
    try {
      const versionResult = spawnSync(geminiCmd, ['--version'], { encoding: 'utf-8', timeout: 5000 });
      if (versionResult.status === 0) version = versionResult.stdout.trim();
    } catch {
      // Version check is optional
    }

    const result: CliDetectionResult = { available: true, path, version, installHint };
    geminiCache = result;
    return result;
  } catch {
    const result: CliDetectionResult = {
      available: false,
      error: 'Gemini CLI not found on PATH',
      installHint
    };
    geminiCache = result;
    return result;
  }
}

/**
 * Reset detection cache (useful for testing)
 */
export function resetDetectionCache(): void {
  codexCache = null;
  geminiCache = null;
}
