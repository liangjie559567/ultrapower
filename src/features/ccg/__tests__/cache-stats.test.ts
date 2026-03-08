import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fileCache } from '../file-cache.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-cache-stats');

describe('FileCache Hit Rate Monitoring', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    writeFileSync(join(TEST_DIR, 'file1.txt'), 'test');
    fileCache.clear();
    fileCache.resetStats();
  });

  it('tracks cache hits and misses', async () => {
    await fileCache.readdir(TEST_DIR);
    let stats = fileCache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);

    await fileCache.readdir(TEST_DIR);
    stats = fileCache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('50.00%');
  });

  it('calculates hit rate correctly', async () => {
    for (let i = 0; i < 3; i++) await fileCache.readdir(TEST_DIR);

    const stats = fileCache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('66.67%');
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });
});
