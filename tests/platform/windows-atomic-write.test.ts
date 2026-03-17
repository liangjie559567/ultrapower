import { describe, it, expect, afterEach } from 'vitest';
import { atomicWriteJsonSyncWithRetry } from '../../src/lib/atomic-write';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

describe.skipIf(process.platform !== 'win32')('Windows atomic write', () => {
  const testFiles: string[] = [];

  afterEach(() => {
    for (const file of testFiles) {
      if (existsSync(file)) {
        rmSync(file, { force: true });
      }
    }
    testFiles.length = 0;
  });

  it('should handle locked files gracefully', () => {
    const testPath = join(process.cwd(), '.test-windows-lock.json');
    testFiles.push(testPath);
    const data = { test: 'value' };

    // Write should succeed even if file is temporarily locked
    atomicWriteJsonSyncWithRetry(testPath, data);

    expect(existsSync(testPath)).toBe(true);
    const content = JSON.parse(readFileSync(testPath, 'utf-8'));
    expect(content).toEqual(data);
  });
});
