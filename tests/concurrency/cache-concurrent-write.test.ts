import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readStateWithCache, invalidateStateCache } from '../../src/lib/state-cache';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('Cache Concurrent Write', () => {
  const testDir = join(process.cwd(), '.test-cache');
  const testFile = join(testDir, 'state.json');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    invalidateStateCache(testFile);
  });

  afterEach(() => {
    try { unlinkSync(testFile); } catch {}
  });

  it('should handle concurrent writes without corruption', async () => {
    const writes = Array.from({ length: 10 }, (_, i) =>
      Promise.resolve().then(() => {
        writeFileSync(testFile, JSON.stringify({ value: i }));
        return readStateWithCache(testFile, { value: i });
      })
    );

    const results = await Promise.all(writes);
    expect(results).toHaveLength(10);
  });

  it('should invalidate cache on concurrent updates', async () => {
    writeFileSync(testFile, JSON.stringify({ value: 0 }));
    const first = readStateWithCache(testFile, { value: 0 });

    writeFileSync(testFile, JSON.stringify({ value: 1 }));
    invalidateStateCache(testFile);
    const second = readStateWithCache(testFile, { value: 1 });

    expect(first).toEqual({ value: 0 });
    expect(second).toEqual({ value: 1 });
  });
});
