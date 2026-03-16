import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSensitiveFields, decryptSensitiveFields } from './crypto';

describe('crypto', () => {
  const originalKey = process.env.OMC_ENCRYPTION_KEY;
  const testKey = Buffer.from('0'.repeat(64), 'hex').toString('hex');

  beforeEach(() => {
    process.env.OMC_ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.OMC_ENCRYPTION_KEY = originalKey;
  });

  describe('encryptSensitiveFields', () => {
    it('should encrypt specified fields', () => {
      const data = { user: 'alice', token: 'secret123' };
      const encrypted = encryptSensitiveFields(data, ['token']);

      expect(encrypted.user).toBe('alice');
      expect(encrypted.token).not.toBe('secret123');
      expect(typeof encrypted.token).toBe('string');
    });

    it('should handle multiple fields', () => {
      const data = { a: 'val1', b: 'val2', c: 'val3' };
      const encrypted = encryptSensitiveFields(data, ['a', 'c']);

      expect(encrypted.a).not.toBe('val1');
      expect(encrypted.b).toBe('val2');
      expect(encrypted.c).not.toBe('val3');
    });

    it('should handle missing fields', () => {
      const data = { user: 'alice' };
      const encrypted = encryptSensitiveFields(data, ['token']);

      expect(encrypted).toEqual({ user: 'alice' });
    });

    it('should handle non-string fields', () => {
      const data = { user: 'alice', count: 42 };
      const encrypted = encryptSensitiveFields(data, ['count']);

      expect(encrypted.count).toBe(42);
    });

    it('should handle arrays', () => {
      const data = ['a', 'b'];
      const encrypted = encryptSensitiveFields(data, ['0']);

      expect(encrypted[0]).not.toBe('a');
      expect(encrypted[1]).toBe('b');
    });

    it('should handle null/undefined', () => {
      expect(encryptSensitiveFields(null, ['field'])).toBe(null);
      expect(encryptSensitiveFields(undefined, ['field'])).toBe(undefined);
    });

    it('should throw if key not set', () => {
      delete process.env.OMC_ENCRYPTION_KEY;
      expect(() => encryptSensitiveFields({ a: 'b' }, ['a'])).toThrow('OMC_ENCRYPTION_KEY not set');
    });
  });

  describe('decryptSensitiveFields', () => {
    it('should decrypt encrypted fields', () => {
      const data = { user: 'alice', token: 'secret123' };
      const encrypted = encryptSensitiveFields(data, ['token']);
      const decrypted = decryptSensitiveFields(encrypted, ['token']);

      expect(decrypted.token).toBe('secret123');
      expect(decrypted.user).toBe('alice');
    });

    it('should handle multiple fields', () => {
      const data = { a: 'val1', b: 'val2', c: 'val3' };
      const encrypted = encryptSensitiveFields(data, ['a', 'c']);
      const decrypted = decryptSensitiveFields(encrypted, ['a', 'c']);

      expect(decrypted).toEqual(data);
    });

    it('should throw on tampered data', () => {
      const data = { token: 'secret' };
      const encrypted = encryptSensitiveFields(data, ['token']);
      const mid = Math.floor(encrypted.token.length / 2);
      encrypted.token = encrypted.token.slice(0, mid) + 'X' + encrypted.token.slice(mid + 1);

      expect(() => decryptSensitiveFields(encrypted, ['token'])).toThrow();
    });

    it('should throw if key not set', () => {
      delete process.env.OMC_ENCRYPTION_KEY;
      expect(() => decryptSensitiveFields({ a: 'b' }, ['a'])).toThrow('OMC_ENCRYPTION_KEY not set');
    });
  });

  describe('round-trip', () => {
    it('should preserve data through encrypt/decrypt cycle', () => {
      const data = { user: 'alice', token: 'secret123', role: 'admin' };
      const encrypted = encryptSensitiveFields(data, ['token']);
      const decrypted = decryptSensitiveFields(encrypted, ['token']);

      expect(decrypted).toEqual(data);
    });

    it('should handle empty strings', () => {
      const data = { token: '' };
      const encrypted = encryptSensitiveFields(data, ['token']);
      const decrypted = decryptSensitiveFields(encrypted, ['token']);

      expect(decrypted.token).toBe('');
    });

    it('should handle unicode', () => {
      const data = { msg: '你好🎉' };
      const encrypted = encryptSensitiveFields(data, ['msg']);
      const decrypted = decryptSensitiveFields(encrypted, ['msg']);

      expect(decrypted.msg).toBe('你好🎉');
    });
  });
});
