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
export function getCliCommand(baseName) {
    return process.platform === 'win32' ? `${baseName}.cmd` : baseName;
}
/**
 * Get spawn environment with npm global path included
 */
export function getSpawnEnv() {
    const env = { ...process.env };
    if (process.platform === 'win32' && process.env.APPDATA) {
        const npmPath = `${process.env.APPDATA}\\npm`;
        if (!env.PATH?.includes(npmPath)) {
            env.PATH = `${npmPath};${env.PATH || ''}`;
        }
    }
    return env;
}
// Session-level cache for detection results
let codexCache = null;
let geminiCache = null;
/**
 * Detect if Codex CLI is installed and available
 */
export function detectCodexCli(useCache = true) {
    if (useCache && codexCache)
        return codexCache;
    const installHint = 'Install Codex CLI: npm install -g @openai/codex';
    try {
        const codexCmd = getCliCommand('codex');
        const cmd = process.platform === 'win32' ? 'where' : 'which';
        const pathResult = spawnSync(cmd, [codexCmd], { encoding: 'utf-8', timeout: 5000 });
        if (pathResult.status !== 0)
            throw new Error('codex not found');
        const path = pathResult.stdout.trim();
        let version;
        try {
            const versionResult = spawnSync(codexCmd, ['--version'], { encoding: 'utf-8', timeout: 5000 });
            if (versionResult.status === 0)
                version = versionResult.stdout.trim();
        }
        catch {
            // Version check is optional
        }
        const result = { available: true, path, version, installHint };
        codexCache = result;
        return result;
    }
    catch {
        const result = {
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
export function detectGeminiCli(useCache = true) {
    if (useCache && geminiCache)
        return geminiCache;
    const installHint = 'Install Gemini CLI: npm install -g @google/gemini-cli (see https://github.com/google-gemini/gemini-cli)';
    try {
        const geminiCmd = getCliCommand('gemini');
        const cmd = process.platform === 'win32' ? 'where' : 'which';
        const pathResult = spawnSync(cmd, [geminiCmd], { encoding: 'utf-8', timeout: 5000 });
        if (pathResult.status !== 0)
            throw new Error('gemini not found');
        const path = pathResult.stdout.trim();
        let version;
        try {
            const versionResult = spawnSync(geminiCmd, ['--version'], { encoding: 'utf-8', timeout: 5000 });
            if (versionResult.status === 0)
                version = versionResult.stdout.trim();
        }
        catch {
            // Version check is optional
        }
        const result = { available: true, path, version, installHint };
        geminiCache = result;
        return result;
    }
    catch {
        const result = {
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
export function resetDetectionCache() {
    codexCache = null;
    geminiCache = null;
}
//# sourceMappingURL=cli-detection.js.map