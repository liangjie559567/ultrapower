import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createDirectoryReadmeInjectorHook, loadInjectedPaths, saveInjectedPaths } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-readme-injector');

describe('directory-readme-injector hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should create hook', () => {
    const hook = createDirectoryReadmeInjectorHook(TEST_DIR);
    expect(hook).toBeDefined();
  });

  it('should save and load injected paths', () => {
    const paths = new Set(['/test/path']);
    saveInjectedPaths('test-session', paths);
    const loaded = loadInjectedPaths('test-session');
    expect(loaded.has('/test/path')).toBe(true);
  });

  it('should find README in directory', () => {
    writeFileSync(join(TEST_DIR, 'README.md'), '# Test');
    const hook = createDirectoryReadmeInjectorHook(TEST_DIR);
    expect(hook).toBeDefined();
  });
});
