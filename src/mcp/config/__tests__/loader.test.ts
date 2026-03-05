import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../loader';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('config loader', () => {
  let testDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    testDir = join(tmpdir(), `mcp-test-${Date.now()}`);
    mkdirSync(join(testDir, '.omc'), { recursive: true });
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    process.env = originalEnv;
  });

  it('should load config', () => {
    writeFileSync(join(testDir, '.omc', 'mcp-config.json'), JSON.stringify({
      mcpServers: { test: { command: 'node' } }
    }));
    const config = loadConfig(testDir);
    expect(config.mcpServers.test.command).toBe('node');
  });

  it('should expand env vars', () => {
    process.env.TEST_VAR = 'value';
    writeFileSync(join(testDir, '.omc', 'mcp-config.json'), JSON.stringify({
      mcpServers: { test: { command: '${TEST_VAR}' } }
    }));
    const config = loadConfig(testDir);
    expect(config.mcpServers.test.command).toBe('value');
  });

  it('should use default value', () => {
    writeFileSync(join(testDir, '.omc', 'mcp-config.json'), JSON.stringify({
      mcpServers: { test: { command: '${UNDEF:-default}' } }
    }));
    const config = loadConfig(testDir);
    expect(config.mcpServers.test.command).toBe('default');
  });

  it('should throw on undefined var', () => {
    writeFileSync(join(testDir, '.omc', 'mcp-config.json'), JSON.stringify({
      mcpServers: { test: { command: '${UNDEF}' } }
    }));
    expect(() => loadConfig(testDir)).toThrow('Environment variable UNDEF is not defined');
  });
});
