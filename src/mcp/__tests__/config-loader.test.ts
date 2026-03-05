import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig } from '../config-loader';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('config-loader', () => {
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

  it('should load and validate config', () => {
    const configPath = join(testDir, '.omc', 'mcp-config.json');
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        test: {
          command: 'node',
          args: ['server.js'],
        }
      }
    }));

    const config = loadConfig(testDir);
    expect(config.mcpServers.test.command).toBe('node');
    expect(config.mcpServers.test.args).toEqual(['server.js']);
  });

  it('should expand environment variables', () => {
    process.env.TEST_VAR = 'test-value';
    const configPath = join(testDir, '.omc', 'mcp-config.json');
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        test: {
          command: '${TEST_VAR}',
        }
      }
    }));

    const config = loadConfig(testDir);
    expect(config.mcpServers.test.command).toBe('test-value');
  });

  it('should use default value when env var not defined', () => {
    const configPath = join(testDir, '.omc', 'mcp-config.json');
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        test: {
          command: '${UNDEFINED_VAR:-default}',
        }
      }
    }));

    const config = loadConfig(testDir);
    expect(config.mcpServers.test.command).toBe('default');
  });

  it('should throw error for undefined env var without default', () => {
    const configPath = join(testDir, '.omc', 'mcp-config.json');
    writeFileSync(configPath, JSON.stringify({
      mcpServers: {
        test: {
          command: '${UNDEFINED_VAR}',
        }
      }
    }));

    expect(() => loadConfig(testDir)).toThrow('Environment variable UNDEFINED_VAR is not defined');
  });
});
