import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { readState, writeState, clearState, StateLocation } from '../index.js';
import { encryptState, decryptState } from '../encryption.js';

describe('Encryption Integration', () => {
  const testDir = path.join(process.cwd(), '.test-encryption-integration');
  const originalKey = process.env.OMC_ENCRYPTION_KEY;
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Setup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    // Create necessary directories
    const stateDir = path.join(testDir, '.omc', 'state');
    const walDir = path.join(stateDir, 'wal');
    fs.mkdirSync(walDir, { recursive: true });

    // Set test encryption key
    process.env.OMC_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Restore original key
    if (originalKey) {
      process.env.OMC_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.OMC_ENCRYPTION_KEY;
    }
  });

  describe('Encrypted State Read/Write Flow', () => {
    it('should write and read encrypted state', () => {
      const testData = { mode: 'autopilot', value: 42, nested: { key: 'secret' } };

      writeState('autopilot', testData, StateLocation.LOCAL);
      const result = readState('autopilot', StateLocation.LOCAL);

      expect(result.exists).toBe(true);
      expect(result.data).toEqual(testData);
    });

    it('should store encrypted format on disk', () => {
      const testData = { secret: 'sensitive-data' };

      writeState('ralph', testData, StateLocation.LOCAL);

      const statePath = path.join(process.cwd(), '.omc', 'state', 'ralph.json');

      // Wait for file to be written
      expect(fs.existsSync(statePath)).toBe(true);
      const rawContent = fs.readFileSync(statePath, 'utf-8');

      // Should be encrypted format (hex:hex:hex)
      expect(rawContent).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i);
      expect(rawContent).not.toContain('sensitive-data');
    });
  });

  describe('Key Rotation and Migration', () => {
    it('should migrate state when key changes', () => {
      const testData = { value: 'original' };

      // Write with first key
      writeState('team', testData, StateLocation.LOCAL);

      // Change key
      const newKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
      process.env.OMC_ENCRYPTION_KEY = newKey;

      // Read old data (should fail with wrong key)
      const oldResult = readState('team', StateLocation.LOCAL);
      expect(oldResult.exists).toBe(false);

      // Restore original key and read
      process.env.OMC_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const correctResult = readState('team', StateLocation.LOCAL);
      expect(correctResult.exists).toBe(true);

      // Re-encrypt with new key
      process.env.OMC_ENCRYPTION_KEY = newKey;
      if (correctResult.exists) {
        writeState('team', correctResult.data, StateLocation.LOCAL);
      }

      // Verify new encryption works
      const newResult = readState('team', StateLocation.LOCAL);
      expect(newResult.exists).toBe(true);
      expect(newResult.data).toEqual(testData);
    });
  });

  describe('Encryption Failure Fallback', () => {
    it('should write plain JSON when key not set', () => {
      delete process.env.OMC_ENCRYPTION_KEY;

      const testData = { plain: 'data' };
      writeState('pipeline', testData, StateLocation.LOCAL);

      const statePath = path.join(process.cwd(), '.omc', 'state', 'pipeline.json');
      expect(fs.existsSync(statePath)).toBe(true);
      const rawContent = fs.readFileSync(statePath, 'utf-8');

      // Should be plain JSON
      expect(() => JSON.parse(rawContent)).not.toThrow();
      expect(JSON.parse(rawContent)).toEqual(testData);
    });
  });

  describe('Decryption Error Handling', () => {
    it('should handle corrupted encrypted data', () => {
      const statePath = path.join(process.cwd(), '.omc', 'state', 'ultrawork-state.json');
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, 'abc:def:ghi', 'utf-8');

      const result = readState('ultrawork', StateLocation.LOCAL);
      expect(result.exists).toBe(false);
    });

    it('should handle wrong key gracefully', () => {
      const testData = { secret: 'data' };
      writeState('ultraqa', testData, StateLocation.LOCAL);

      // Change to wrong key
      process.env.OMC_ENCRYPTION_KEY = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      const result = readState('ultraqa', StateLocation.LOCAL);
      expect(result.exists).toBe(false);
    });
  });

  describe('Encryption Performance Boundary', () => {
    it('should handle large state files', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `item-${i}`,
          data: 'x'.repeat(100)
        }))
      };

      const start = Date.now();
      writeState('ultrapilot', largeData, StateLocation.LOCAL);
      const writeTime = Date.now() - start;

      const readStart = Date.now();
      const result = readState('ultrapilot', StateLocation.LOCAL);
      const readTime = Date.now() - readStart;

      expect(result.exists).toBe(true);
      expect(result.data).toEqual(largeData);
      expect(writeTime).toBeLessThan(5000);
      expect(readTime).toBeLessThan(5000);
    });
  });

  describe('Encryption with WAL', () => {
    it('should encrypt WAL entries and recover correctly', () => {
      const testData = { wal: 'test', value: 123 };

      // Write state (creates WAL entry)
      writeState('swarm', testData, StateLocation.LOCAL);

      // Verify state is encrypted on disk
      const statePath = path.join(process.cwd(), '.omc', 'state', 'swarm.json');
      expect(fs.existsSync(statePath)).toBe(true);
      const rawContent = fs.readFileSync(statePath, 'utf-8');
      expect(rawContent).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i);

      // Read back and verify
      const result = readState('swarm', StateLocation.LOCAL);
      expect(result.exists).toBe(true);
      expect(result.data).toEqual(testData);
    });
  });
});

