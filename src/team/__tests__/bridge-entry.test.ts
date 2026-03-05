import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';
import { validateConfigPath, validateBridgeWorkingDirectory, validateAndNormalizeConfig, parseAndValidateConfigPath, loadConfigFromFile } from '../bridge-entry.js';
import type { BridgeConfig } from '../types.js';
import { getClaudeConfigDir } from '../../utils/paths.js';

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

  it('handles parent directory symlink check gracefully when parent exists', () => {
    // Test with a real path where parent exists
    const realPath = join(claudeConfigDir, 'test.json');
    expect(validateConfigPath(realPath, home, claudeConfigDir)).toBe(true);
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

// ═══════════════════════════════════════════════════════════════
// P3 功能测试 - validateConfigPath 实际行为
// ═══════════════════════════════════════════════════════════════

describe('validateConfigPath — Windows path handling', () => {
  it('normalizes backslashes to forward slashes', () => {
    const home = 'C:\\Users\\test';
    const claudeConfigDir = 'C:\\Users\\test\\.claude';
    const configPath = 'C:\\Users\\test\\.claude\\config.json';
    expect(validateConfigPath(configPath, home, claudeConfigDir)).toBe(true);
  });

  it('handles mixed slashes', () => {
    const home = 'C:/Users/test';
    const claudeConfigDir = 'C:/Users/test/.claude';
    const configPath = 'C:\\Users\\test\\.omc\\config.json';
    expect(validateConfigPath(configPath, home, claudeConfigDir)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// P3 功能测试 - validateBridgeWorkingDirectory
// ═══════════════════════════════════════════════════════════════

describe('validateBridgeWorkingDirectory', () => {
  it('throws if directory does not exist', () => {
    expect(() => validateBridgeWorkingDirectory('/nonexistent/path/xyz123')).toThrow('does not exist');
  });

  it('throws if path is a file not a directory', () => {
    const tmpFile = join(tmpdir(), `test-file-${Date.now()}.txt`);
    writeFileSync(tmpFile, 'test');
    try {
      expect(() => validateBridgeWorkingDirectory(tmpFile)).toThrow('not a directory');
    } finally {
      rmSync(tmpFile, { force: true });
    }
  });

  it('throws error for directory without git worktree or outside home', () => {
    const tmpDir = join(tmpdir(), `test-noworktree-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    try {
      expect(() => validateBridgeWorkingDirectory(tmpDir)).toThrow();
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// P4 配置验证测试
// ═══════════════════════════════════════════════════════════════

describe('bridge-entry config validation', () => {
  it('validates provider must be codex or gemini', () => {
    const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');
    expect(source).toContain("config.provider !== 'codex' && config.provider !== 'gemini'");
  });

  it('validates required fields are present', () => {
    const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');
    const requiredFields = ['teamName', 'workerName', 'provider', 'workingDirectory'];
    for (const field of requiredFields) {
      expect(source).toContain(field);
    }
  });

  it('applies default values for optional fields', () => {
    const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');
    expect(source).toContain('config.pollIntervalMs = config.pollIntervalMs || 3000');
    expect(source).toContain('config.taskTimeoutMs = config.taskTimeoutMs || 600_000');
    expect(source).toContain('config.maxConsecutiveErrors = config.maxConsecutiveErrors || 3');
  });

  it('validates permissionEnforcement values', () => {
    const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');
    expect(source).toContain("validModes.includes(config.permissionEnforcement)");
  });

  it('validates permissions arrays when enforcement is active', () => {
    const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');
    expect(source).toContain("Array.isArray(p.allowedPaths)");
    expect(source).toContain("Array.isArray(p.deniedPaths)");
    expect(source).toContain("Array.isArray(p.allowedCommands)");
  });

  it('rejects dangerous allowedPaths patterns', () => {
    const source = readFileSync(resolveSourceFile('../bridge-entry.ts'), 'utf-8');
    expect(source).toContain("dangerousPatterns.includes(pattern)");
    expect(source).toContain('Dangerous allowedPaths pattern rejected');
  });
});

// ═══════════════════════════════════════════════════════════════
// P5 validateAndNormalizeConfig 功能测试
// ═══════════════════════════════════════════════════════════════

describe('validateAndNormalizeConfig', () => {
  const validConfig: BridgeConfig = {
    teamName: 'test-team',
    workerName: 'worker1',
    provider: 'codex',
    workingDirectory: process.cwd(),
  };

  it('throws if teamName is missing', () => {
    const config = { ...validConfig, teamName: '' };
    expect(() => validateAndNormalizeConfig(config as any)).toThrow('Missing required config field: teamName');
  });

  it('throws if workerName is missing', () => {
    const config = { ...validConfig, workerName: '' };
    expect(() => validateAndNormalizeConfig(config as any)).toThrow('Missing required config field: workerName');
  });

  it('throws if provider is missing', () => {
    const config = { ...validConfig, provider: '' };
    expect(() => validateAndNormalizeConfig(config as any)).toThrow('Missing required config field: provider');
  });

  it('throws if workingDirectory is missing', () => {
    const config = { ...validConfig, workingDirectory: '' };
    expect(() => validateAndNormalizeConfig(config as any)).toThrow('Missing required config field: workingDirectory');
  });

  it('throws if provider is invalid', () => {
    const config = { ...validConfig, provider: 'invalid' as any };
    expect(() => validateAndNormalizeConfig(config)).toThrow("Invalid provider: invalid. Must be 'codex' or 'gemini'");
  });

  it('accepts codex provider', () => {
    const config = { ...validConfig, provider: 'codex' as const };
    const result = validateAndNormalizeConfig(config);
    expect(result.provider).toBe('codex');
  });

  it('accepts gemini provider', () => {
    const config = { ...validConfig, provider: 'gemini' as const };
    const result = validateAndNormalizeConfig(config);
    expect(result.provider).toBe('gemini');
  });

  it('sanitizes teamName', () => {
    const config = { ...validConfig, teamName: 'test@team!' };
    const result = validateAndNormalizeConfig(config);
    expect(result.teamName).toBe('testteam');
  });

  it('sanitizes workerName', () => {
    const config = { ...validConfig, workerName: 'work$er#1' };
    const result = validateAndNormalizeConfig(config);
    expect(result.workerName).toBe('worker1');
  });

  it('applies default pollIntervalMs', () => {
    const result = validateAndNormalizeConfig(validConfig);
    expect(result.pollIntervalMs).toBe(3000);
  });

  it('applies default taskTimeoutMs', () => {
    const result = validateAndNormalizeConfig(validConfig);
    expect(result.taskTimeoutMs).toBe(600_000);
  });

  it('applies default maxConsecutiveErrors', () => {
    const result = validateAndNormalizeConfig(validConfig);
    expect(result.maxConsecutiveErrors).toBe(3);
  });

  it('applies default outboxMaxLines', () => {
    const result = validateAndNormalizeConfig(validConfig);
    expect(result.outboxMaxLines).toBe(500);
  });

  it('applies default maxRetries', () => {
    const result = validateAndNormalizeConfig(validConfig);
    expect(result.maxRetries).toBe(5);
  });

  it('applies default permissionEnforcement', () => {
    const result = validateAndNormalizeConfig(validConfig);
    expect(result.permissionEnforcement).toBe('off');
  });

  it('preserves custom pollIntervalMs', () => {
    const config = { ...validConfig, pollIntervalMs: 5000 };
    const result = validateAndNormalizeConfig(config);
    expect(result.pollIntervalMs).toBe(5000);
  });

  it('throws if permissionEnforcement is invalid', () => {
    const config = { ...validConfig, permissionEnforcement: 'invalid' as any };
    expect(() => validateAndNormalizeConfig(config)).toThrow("Invalid permissionEnforcement: invalid. Must be 'off', 'audit', or 'enforce'");
  });

  it('accepts permissionEnforcement: off', () => {
    const config = { ...validConfig, permissionEnforcement: 'off' as const };
    const result = validateAndNormalizeConfig(config);
    expect(result.permissionEnforcement).toBe('off');
  });

  it('accepts permissionEnforcement: audit', () => {
    const config = { ...validConfig, permissionEnforcement: 'audit' as const };
    const result = validateAndNormalizeConfig(config);
    expect(result.permissionEnforcement).toBe('audit');
  });

  it('accepts permissionEnforcement: enforce', () => {
    const config = { ...validConfig, permissionEnforcement: 'enforce' as const };
    const result = validateAndNormalizeConfig(config);
    expect(result.permissionEnforcement).toBe('enforce');
  });

  it('throws if allowedPaths is not an array', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const,
      permissions: { allowedPaths: 'not-array' as any }
    };
    expect(() => validateAndNormalizeConfig(config)).toThrow('permissions.allowedPaths must be an array of strings');
  });

  it('throws if deniedPaths is not an array', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const,
      permissions: { deniedPaths: 'not-array' as any }
    };
    expect(() => validateAndNormalizeConfig(config)).toThrow('permissions.deniedPaths must be an array of strings');
  });

  it('throws if allowedCommands is not an array', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const,
      permissions: { allowedCommands: 'not-array' as any }
    };
    expect(() => validateAndNormalizeConfig(config)).toThrow('permissions.allowedCommands must be an array of strings');
  });

  it('throws if allowedPaths contains dangerous pattern **', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const,
      permissions: { allowedPaths: ['**'] }
    };
    expect(() => validateAndNormalizeConfig(config)).toThrow('Dangerous allowedPaths pattern rejected: "**"');
  });

  it('throws if allowedPaths contains dangerous pattern *', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const,
      permissions: { allowedPaths: ['*'] }
    };
    expect(() => validateAndNormalizeConfig(config)).toThrow('Dangerous allowedPaths pattern rejected: "*"');
  });

  it('accepts safe allowedPaths patterns', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const,
      permissions: { allowedPaths: ['src/**/*.ts', 'test/**'] }
    };
    const result = validateAndNormalizeConfig(config);
    expect(result.permissions?.allowedPaths).toEqual(['src/**/*.ts', 'test/**']);
  });
});

// ═══════════════════════════════════════════════════════════════
// P6 parseAndValidateConfigPath 测试
// ═══════════════════════════════════════════════════════════════

describe('parseAndValidateConfigPath', () => {
  const home = homedir().replace(/\\/g, '/');
  const claudeDir = getClaudeConfigDir().replace(/\\/g, '/');

  it('throws if --config flag is missing', () => {
    const argv = ['node', 'bridge-entry.js'];
    expect(() => parseAndValidateConfigPath(argv)).toThrow('Usage: node bridge-entry.js --config');
  });

  it('throws if config path is missing after --config', () => {
    const argv = ['node', 'bridge-entry.js', '--config'];
    expect(() => parseAndValidateConfigPath(argv)).toThrow('Usage: node bridge-entry.js --config');
  });

  it('throws if config path is outside trusted location', () => {
    const argv = ['node', 'bridge-entry.js', '--config', '/tmp/config.json'];
    expect(() => parseAndValidateConfigPath(argv)).toThrow('Config path must be under');
  });

  it('accepts config path under .claude directory', () => {
    const configPath = join(claudeDir, 'teams', 'test', 'config.json');
    const argv = ['node', 'bridge-entry.js', '--config', configPath];
    const result = parseAndValidateConfigPath(argv);
    expect(result).toContain('.claude');
  });

  it('accepts config path under .omc directory', () => {
    const configPath = join(home, 'project', '.omc', 'config.json');
    const argv = ['node', 'bridge-entry.js', '--config', configPath];
    const result = parseAndValidateConfigPath(argv);
    expect(result).toContain('.omc');
  });
});

// ═══════════════════════════════════════════════════════════════
// P7 loadConfigFromFile 测试
// ═══════════════════════════════════════════════════════════════

describe('loadConfigFromFile', () => {
  const testDir = join(homedir(), '.omc', 'test-bridge-entry');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('throws if config file does not exist', () => {
    const configPath = join(testDir, 'nonexistent.json');
    expect(() => loadConfigFromFile(configPath)).toThrow('Failed to read config');
  });

  it('throws if config file is invalid JSON', () => {
    const configPath = join(testDir, 'invalid.json');
    writeFileSync(configPath, 'not json');
    expect(() => loadConfigFromFile(configPath)).toThrow('Failed to read config');
  });

  it('throws if config is missing required fields', () => {
    const configPath = join(testDir, 'incomplete.json');
    writeFileSync(configPath, JSON.stringify({ teamName: 'test' }));
    expect(() => loadConfigFromFile(configPath)).toThrow('Missing required config field');
  });

  it('loads and validates valid config', () => {
    const configPath = join(testDir, 'valid.json');
    const config = {
      teamName: 'test-team',
      workerName: 'worker1',
      provider: 'codex',
      workingDirectory: process.cwd()
    };
    writeFileSync(configPath, JSON.stringify(config));
    const result = loadConfigFromFile(configPath);
    expect(result.teamName).toBe('test-team');
    expect(result.provider).toBe('codex');
  });

  it('applies defaults when loading config', () => {
    const configPath = join(testDir, 'minimal.json');
    const config = {
      teamName: 'test-team',
      workerName: 'worker1',
      provider: 'gemini',
      workingDirectory: process.cwd()
    };
    writeFileSync(configPath, JSON.stringify(config));
    const result = loadConfigFromFile(configPath);
    expect(result.pollIntervalMs).toBe(3000);
    expect(result.taskTimeoutMs).toBe(600_000);
  });

  it('throws if provider is invalid in config file', () => {
    const configPath = join(testDir, 'bad-provider.json');
    const config = {
      teamName: 'test-team',
      workerName: 'worker1',
      provider: 'invalid',
      workingDirectory: process.cwd()
    };
    writeFileSync(configPath, JSON.stringify(config));
    expect(() => loadConfigFromFile(configPath)).toThrow("Invalid provider");
  });

  it('throws if workingDirectory is invalid', () => {
    const configPath = join(testDir, 'bad-dir.json');
    const config = {
      teamName: 'test-team',
      workerName: 'worker1',
      provider: 'codex',
      workingDirectory: '/nonexistent/path'
    };
    writeFileSync(configPath, JSON.stringify(config));
    expect(() => loadConfigFromFile(configPath)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// P8 边界条件和集成测试
// ═══════════════════════════════════════════════════════════════

describe('validateAndNormalizeConfig — permission edge cases', () => {
  const validConfig: BridgeConfig = {
    teamName: 'test-team',
    workerName: 'worker1',
    provider: 'codex',
    workingDirectory: process.cwd(),
  };

  it('skips permission validation when permissionEnforcement is off', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'off' as const,
      permissions: { allowedPaths: 'invalid' as any }
    };
    // Should not throw because enforcement is off
    const result = validateAndNormalizeConfig(config);
    expect(result.permissionEnforcement).toBe('off');
  });

  it('validates permissions only when enforcement is not off', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'audit' as const,
      permissions: { allowedPaths: 'invalid' as any }
    };
    expect(() => validateAndNormalizeConfig(config)).toThrow('must be an array');
  });

  it('accepts config without permissions object', () => {
    const config = {
      ...validConfig,
      permissionEnforcement: 'enforce' as const
    };
    const result = validateAndNormalizeConfig(config);
    expect(result.permissionEnforcement).toBe('enforce');
  });

  it('rejects all dangerous patterns', () => {
    const dangerousPatterns = ['**', '*', '!.git/**', '!.env*', '!**/.env*'];
    for (const pattern of dangerousPatterns) {
      const config = {
        ...validConfig,
        permissionEnforcement: 'enforce' as const,
        permissions: { allowedPaths: [pattern] }
      };
      expect(() => validateAndNormalizeConfig(config)).toThrow('Dangerous allowedPaths pattern rejected');
    }
  });

  it('preserves all custom config values', () => {
    const config = {
      ...validConfig,
      pollIntervalMs: 5000,
      taskTimeoutMs: 300_000,
      maxConsecutiveErrors: 5,
      outboxMaxLines: 1000,
      maxRetries: 10,
      permissionEnforcement: 'audit' as const
    };
    const result = validateAndNormalizeConfig(config);
    expect(result.pollIntervalMs).toBe(5000);
    expect(result.taskTimeoutMs).toBe(300_000);
    expect(result.maxConsecutiveErrors).toBe(5);
    expect(result.outboxMaxLines).toBe(1000);
    expect(result.maxRetries).toBe(10);
    expect(result.permissionEnforcement).toBe('audit');
  });
});

// ═══════════════════════════════════════════════════════════════
// P9 集成测试 - 完整配置流程
// ═══════════════════════════════════════════════════════════════

describe('full config loading flow', () => {
  const testDir = join(homedir(), '.omc', 'test-full-flow');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('successfully loads and normalizes a complete config', () => {
    const configPath = join(testDir, 'complete.json');
    const config = {
      teamName: 'test@team!',
      workerName: 'work$er#1',
      provider: 'codex',
      workingDirectory: process.cwd(),
      pollIntervalMs: 2000,
      taskTimeoutMs: 300_000,
      maxConsecutiveErrors: 5,
      outboxMaxLines: 1000,
      maxRetries: 10,
      permissionEnforcement: 'audit',
      permissions: {
        allowedPaths: ['src/**/*.ts'],
        deniedPaths: ['.env'],
        allowedCommands: ['npm test']
      }
    };
    writeFileSync(configPath, JSON.stringify(config));

    const result = loadConfigFromFile(configPath);

    expect(result.teamName).toBe('testteam');
    expect(result.workerName).toBe('worker1');
    expect(result.provider).toBe('codex');
    expect(result.pollIntervalMs).toBe(2000);
    expect(result.permissionEnforcement).toBe('audit');
    expect(result.permissions?.allowedPaths).toEqual(['src/**/*.ts']);
  });

  it('handles config with minimal fields and applies all defaults', () => {
    const configPath = join(testDir, 'minimal-complete.json');
    const config = {
      teamName: 'minimal',
      workerName: 'worker',
      provider: 'gemini',
      workingDirectory: process.cwd()
    };
    writeFileSync(configPath, JSON.stringify(config));

    const result = loadConfigFromFile(configPath);

    expect(result.pollIntervalMs).toBe(3000);
    expect(result.taskTimeoutMs).toBe(600_000);
    expect(result.maxConsecutiveErrors).toBe(3);
    expect(result.outboxMaxLines).toBe(500);
    expect(result.maxRetries).toBe(5);
    expect(result.permissionEnforcement).toBe('off');
  });
});
