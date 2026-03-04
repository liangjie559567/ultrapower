import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptState, decryptState, isEncrypted, readEncryptedState } from '../encryption.js';

describe('State Encryption', () => {
  const originalKey = process.env.OMC_ENCRYPTION_KEY;

  beforeEach(() => {
    // Set test key (32 bytes = 64 hex chars)
    process.env.OMC_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterEach(() => {
    // Restore original key
    if (originalKey) {
      process.env.OMC_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.OMC_ENCRYPTION_KEY;
    }
  });

  describe('encryptState', () => {
    it('should encrypt JSON data', () => {
      const data = { test: 'value', number: 42 };
      const encrypted = encryptState(data);

      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i);
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('should produce different output each time (random IV)', () => {
      const data = { test: 'value' };
      const encrypted1 = encryptState(data);
      const encrypted2 = encryptState(data);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decryptState', () => {
    it('should decrypt encrypted data', () => {
      const original = { test: 'value', number: 42, nested: { key: 'val' } };
      const encrypted = encryptState(original);
      const decrypted = decryptState(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('should throw on invalid format', () => {
      expect(() => decryptState('invalid')).toThrow('Invalid encrypted format');
      expect(() => decryptState('a:b')).toThrow('Invalid encrypted format');
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted format', () => {
      const encrypted = encryptState({ test: 'value' });
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should reject plain JSON', () => {
      expect(isEncrypted('{"test":"value"}')).toBe(false);
      expect(isEncrypted('plain text')).toBe(false);
    });
  });

  describe('readEncryptedState', () => {
    it('should read encrypted content', () => {
      const original = { test: 'value' };
      const encrypted = encryptState(original);
      const result = readEncryptedState(encrypted);

      expect(result).toEqual(original);
    });

    it('should read plain JSON (backward compatibility)', () => {
      const plainJson = '{"test":"value","number":42}';
      const result = readEncryptedState(plainJson);

      expect(result).toEqual({ test: 'value', number: 42 });
    });
  });
});
