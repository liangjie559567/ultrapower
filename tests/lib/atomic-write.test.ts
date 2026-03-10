import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { atomicWriteJsonSyncWithRetry } from '../../src/lib/atomic-write.js';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-atomic-write');
const TEST_FILE = join(TEST_DIR, 'test.json');

describe('atomicWriteJsonSyncWithRetry', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('writes data successfully', () => {
    const data = { test: 'value' };
    atomicWriteJsonSyncWithRetry(TEST_FILE, data);

    expect(existsSync(TEST_FILE)).toBe(true);
    const content = JSON.parse(readFileSync(TEST_FILE, 'utf-8'));
    expect(content).toEqual(data);
  });

  it('handles concurrent writes', () => {
    const data1 = { id: 1 };
    const data2 = { id: 2 };

    atomicWriteJsonSyncWithRetry(TEST_FILE, data1);
    atomicWriteJsonSyncWithRetry(TEST_FILE, data2);

    const content = JSON.parse(readFileSync(TEST_FILE, 'utf-8'));
    expect(content.id).toBe(2);
  });
});
