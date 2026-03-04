import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  ensureDirectoryStructure,
  validateConfigFiles,
  setEnvironmentVariables
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-setup');

describe('setup hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should create required directories', () => {
    const created = ensureDirectoryStructure(TEST_DIR);
    expect(created.length).toBeGreaterThan(0);
    expect(existsSync(join(TEST_DIR, '.omc/state'))).toBe(true);
  });

  it('should validate config files', () => {
    const validated = validateConfigFiles(TEST_DIR);
    expect(Array.isArray(validated)).toBe(true);
  });

  it('should set environment variables', () => {
    const envVars = setEnvironmentVariables();
    expect(Array.isArray(envVars)).toBe(true);
  });
});
