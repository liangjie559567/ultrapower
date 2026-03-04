import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { FileContextManager } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-memory');

describe('memory hook', () => {
  let manager: FileContextManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
    manager = new FileContextManager(TEST_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should write and read content', async () => {
    await manager.write('active', 'test content');
    const content = await manager.read('active');
    expect(content).toBe('test content');
  });

  it('should merge content', async () => {
    await manager.write('active', 'line1');
    await manager.merge('active', 'line2');
    const content = await manager.read('active');
    expect(content).toContain('line1');
    expect(content).toContain('line2');
  });

  it('should clear content', async () => {
    await manager.write('active', 'test');
    await manager.clear('active');
    const content = await manager.read('active');
    expect(content).toBe('');
  });
});
