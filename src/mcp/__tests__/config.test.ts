import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config/config-loader.js';
import { replaceEnvVars, replaceEnvVarsInObject } from '../config/env-replacer.js';

const TEST_DIR = join(process.cwd(), '.test-config');
const CONFIG_PATH = join(TEST_DIR, '.mcp.json');

describe('Config System', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      require('fs').mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(CONFIG_PATH)) {
      unlinkSync(CONFIG_PATH);
    }
  });

  describe('loadConfig', () => {
    it('should load valid config', () => {
      const config = {
        mcpServers: {
          filesystem: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem'],
          },
        },
      };
      writeFileSync(CONFIG_PATH, JSON.stringify(config));

      const loaded = loadConfig(TEST_DIR);
      expect(loaded.mcpServers.filesystem.command).toBe('npx');
    });

    it('should return empty config if file not exists', () => {
      const loaded = loadConfig(TEST_DIR);
      expect(loaded.mcpServers).toEqual({});
    });
  });

  describe('replaceEnvVars', () => {
    it('should replace environment variables', () => {
      process.env.TEST_VAR = 'test-value';
      expect(replaceEnvVars('${TEST_VAR}')).toBe('test-value');
      delete process.env.TEST_VAR;
    });

    it('should handle missing variables', () => {
      expect(replaceEnvVars('${MISSING_VAR}')).toBe('');
    });
  });

  describe('replaceEnvVarsInObject', () => {
    it('should replace in nested objects', () => {
      process.env.TEST_KEY = 'secret';
      const obj = { env: { API_KEY: '${TEST_KEY}' } };
      const result = replaceEnvVarsInObject(obj);
      expect(result.env.API_KEY).toBe('secret');
      delete process.env.TEST_KEY;
    });
  });
});
