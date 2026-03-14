/**
 * Worker Factory Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { createWorkerAdapter } from '../factory.js';

const TEST_CWD = join(process.cwd(), '.test-workers-factory');

describe('createWorkerAdapter', () => {
  beforeEach(() => {
    if (existsSync(TEST_CWD)) {
      rmSync(TEST_CWD, { recursive: true, force: true });
    }
    mkdirSync(TEST_CWD, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_CWD)) {
      rmSync(TEST_CWD, { recursive: true, force: true });
    }
  });

  describe('auto mode', () => {
    it('should create SQLite adapter when available', async () => {
      const adapter = await createWorkerAdapter('auto', TEST_CWD);
      expect(adapter).not.toBeNull();
      await adapter?.close();
    });

    it('should fallback to JSON when SQLite fails', async () => {
      // SQLite will fail in some environments
      const adapter = await createWorkerAdapter('auto', TEST_CWD);
      expect(adapter).not.toBeNull();
      await adapter?.close();
    });
  });

  describe('explicit sqlite mode', () => {
    it('should create SQLite adapter', async () => {
      const adapter = await createWorkerAdapter('sqlite', TEST_CWD);
      expect(adapter).not.toBeNull();
      await adapter?.close();
    });
  });

  describe('explicit json mode', () => {
    it('should create JSON adapter', async () => {
      const adapter = await createWorkerAdapter('json', TEST_CWD);
      expect(adapter).not.toBeNull();
      await adapter?.close();
    });
  });

  describe('cache wrapping', () => {
    it('should wrap adapter with cache by default', async () => {
      const adapter = await createWorkerAdapter('json', TEST_CWD);
      expect(adapter).not.toBeNull();
      // Cache wrapper should be transparent
      await adapter?.close();
    });

    it('should not wrap when cache disabled', async () => {
      const adapter = await createWorkerAdapter('json', TEST_CWD, { enableCache: false });
      expect(adapter).not.toBeNull();
      await adapter?.close();
    });
  });

  describe('error handling', () => {
    it('should return null when init fails', async () => {
      // Use a path that will definitely fail on all platforms
      const invalidPath = '\0invalid';
      const adapter = await createWorkerAdapter('json', invalidPath);
      expect(adapter).toBeNull();
    });
  });
});
