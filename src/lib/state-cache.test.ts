import { describe, it, expect, beforeEach } from 'vitest';
import { readStateWithCache, invalidateStateCache, getStateCacheStats } from './state-cache.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('state-cache', () => {
  const testDir = join(tmpdir(), 'state-cache-test');
  const testFile = join(testDir, 'test.json');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(testFile, JSON.stringify({ value: 1 }));
    invalidateStateCache(testFile);
  });

  it('caches data and returns frozen object', () => {
    const data = { value: 1 };
    const result = readStateWithCache(testFile, data);

    expect(result).toEqual(data);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('skips mtime check within 1s window', () => {
    const data = { value: 1 };

    // First call - caches data
    readStateWithCache(testFile, data);

    // Second call within 1s - should skip mtime check
    const result = readStateWithCache(testFile, data);
    expect(result).toEqual(data);
  });

  it('invalidates cache correctly', () => {
    const data = { value: 1 };
    readStateWithCache(testFile, data);

    const stats = getStateCacheStats();
    expect(stats.size).toBe(1);

    invalidateStateCache(testFile);
    const statsAfter = getStateCacheStats();
    expect(statsAfter.size).toBe(0);
  });
});
