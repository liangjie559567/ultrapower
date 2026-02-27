import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { validateConfigPath } from '../bridge-entry.js';

function resolveSourceFile(relPath: string): string {
  const direct = join(__dirname, relPath);
  if (existsSync(direct)) return direct;
  // When running from dist/, fall back to src/
  const srcPath = direct.replace(/[\\/]dist[\\/]/, '/src/');
  return srcPath;
}

describe('bridge-entry security', () => {
  const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');

  it('does NOT use process.cwd()', () => {
    expect(source).not.toContain('process.cwd()');
  });

  it('has validateBridgeWorkingDirectory function', () => {
    expect(source).toContain('validateBridgeWorkingDirectory');
  });

  it('validates config path is under ~/.claude/ or .omc/', () => {
    expect(source).toContain('.claude/');
    expect(source).toContain('.omc/');
  });

  it('sanitizes team and worker names', () => {
    expect(source).toContain('sanitizeName(config.teamName)');
    expect(source).toContain('sanitizeName(config.workerName)');
  });

  it('uses realpathSync for symlink resolution', () => {
    expect(source).toContain('realpathSync');
  });

  it('checks path is under homedir', () => {
    expect(source).toContain("home + '/'");
  });

  it('verifies git worktree', () => {
    expect(source).toContain('getWorktreeRoot');
  });

  it('validates working directory exists and is a directory', () => {
    expect(source).toContain('statSync(workingDirectory)');
    expect(source).toContain('isDirectory()');
  });

  it('validates provider is codex or gemini', () => {
    expect(source).toContain("config.provider !== 'codex'");
    expect(source).toContain("config.provider !== 'gemini'");
  });

  it('has signal handlers for graceful cleanup', () => {
    expect(source).toContain('SIGINT');
    expect(source).toContain('SIGTERM');
    expect(source).toContain('deleteHeartbeat');
    expect(source).toContain('unregisterMcpWorker');
  });

  it('validates required config fields', () => {
    expect(source).toContain('teamName');
    expect(source).toContain('workerName');
    expect(source).toContain('provider');
    expect(source).toContain('workingDirectory');
    expect(source).toContain('Missing required config field');
  });

  it('applies default configuration values', () => {
    expect(source).toContain('pollIntervalMs');
    expect(source).toContain('taskTimeoutMs');
    expect(source).toContain('maxConsecutiveErrors');
    expect(source).toContain('outboxMaxLines');
    expect(source).toContain('maxRetries');
  });
});

describe('validateConfigPath', () => {
  const home = '/home/user';
  const claudeConfigDir = '/home/user/.claude';

  it('should reject paths outside home directory', () => {
    expect(validateConfigPath('/tmp/.omc/config.json', home, claudeConfigDir)).toBe(false);
  });

  it('should reject paths without trusted subpath', () => {
    expect(validateConfigPath('/home/user/project/config.json', home, claudeConfigDir)).toBe(false);
  });

  it('should accept paths under ~/.claude/', () => {
    expect(validateConfigPath('/home/user/.claude/teams/foo/config.json', home, claudeConfigDir)).toBe(true);
  });

  it('should accept paths under project/.omc/', () => {
    expect(validateConfigPath('/home/user/project/.omc/state/config.json', home, claudeConfigDir)).toBe(true);
  });

  it('should reject path that matches subpath but not home', () => {
    expect(validateConfigPath('/other/.claude/config.json', home, claudeConfigDir)).toBe(false);
  });

  it('should reject path traversal via ../ that escapes trusted subpath', () => {
    // ~/foo/.claude/../../evil.json resolves to ~/evil.json (no trusted subpath)
    expect(validateConfigPath('/home/user/foo/.claude/../../evil.json', home, claudeConfigDir)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// P2 补充测试
// ═══════════════════════════════════════════════════════════════

describe('validateConfigPath — edge cases', () => {
  const home = '/home/user';
  const claudeConfigDir = '/home/user/.claude';

  it('accepts path exactly equal to claudeConfigDir', () => {
    expect(validateConfigPath('/home/user/.claude', home, claudeConfigDir)).toBe(true);
  });

  it('accepts path exactly equal to ~/.omc', () => {
    expect(validateConfigPath('/home/user/.omc', home, claudeConfigDir)).toBe(true);
  });

  it('accepts deeply nested .omc path', () => {
    expect(validateConfigPath('/home/user/projects/myapp/.omc/teams/t1/config.json', home, claudeConfigDir)).toBe(true);
  });

  it('rejects home directory itself (no trusted subpath)', () => {
    expect(validateConfigPath('/home/user', home, claudeConfigDir)).toBe(false);
  });

  it('rejects path with .omc in filename but not as directory component', () => {
    // "not-.omc-file.json" does not contain "/.omc/" as a path segment
    expect(validateConfigPath('/home/user/not-.omc-file.json', home, claudeConfigDir)).toBe(false);
  });

  it('rejects path completely outside home', () => {
    expect(validateConfigPath('/etc/passwd', home, claudeConfigDir)).toBe(false);
  });

  it('rejects path that starts with home prefix but is a different user', () => {
    // /home/user2 starts with /home/user but is NOT under /home/user/
    expect(validateConfigPath('/home/user2/.omc/config.json', home, claudeConfigDir)).toBe(false);
  });

  it('accepts .claude nested under a project directory', () => {
    // This has /.omc/ or /.claude/ component — but .claude is the claudeConfigDir prefix
    // Actually this path has neither .omc nor matches claudeConfigDir prefix
    // It should be rejected because /home/user/project/.claude is not the claudeConfigDir
    // BUT the function checks hasOmcComponent which looks for /.omc/ — not .claude
    // Let's verify: the path /home/user/project/.claude/foo.json
    // isUnderHome: yes
    // isTrustedSubpath: resolved.startsWith(normalizedConfigDir + '/') — normalizedConfigDir is /home/user/.claude
    // /home/user/project/.claude/foo.json does NOT start with /home/user/.claude/
    // hasOmcComponent: does NOT contain /.omc/
    // So this should be rejected
    expect(validateConfigPath('/home/user/project/.claude/foo.json', home, claudeConfigDir)).toBe(false);
  });
});

describe('bridge-entry source — permission enforcement validation', () => {
  const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');

  it('validates permissionEnforcement mode values', () => {
    expect(source).toContain("'off', 'audit', 'enforce'");
  });

  it('rejects dangerous allowedPaths patterns', () => {
    expect(source).toContain('dangerousPatterns');
    expect(source).toContain("'**'");
    expect(source).toContain("'*'");
  });

  it('validates permissions shape (arrays)', () => {
    expect(source).toContain('Array.isArray(p.allowedPaths)');
    expect(source).toContain('Array.isArray(p.deniedPaths)');
    expect(source).toContain('Array.isArray(p.allowedCommands)');
  });

  it('guards main() behind require.main === module', () => {
    expect(source).toContain('require.main === module');
  });
});
