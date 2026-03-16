import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { assertValidMode } from '../../src/lib/validateMode';
import { encryptSensitiveFields, decryptSensitiveFields } from '../../src/lib/crypto';
import { join } from 'path';

describe('Security Critical Paths', () => {
  describe('Path Traversal Attack Prevention', () => {
    it('should block ../ attack', () => {
      expect(() => assertValidMode('../')).toThrow('Path traversal attempt detected');
    });

    it('should block ..\\ Windows attack', () => {
      expect(() => assertValidMode('..\\')).toThrow('Path traversal attempt detected');
    });

    it('should block %2e%2e/ URL-encoded attack', () => {
      expect(() => assertValidMode('%2e%2e/')).toThrow('Path traversal attempt detected');
    });

    it('should block symlink-style attack with valid mode prefix', () => {
      expect(() => assertValidMode('autopilot/../etc')).toThrow('Path traversal attempt detected');
    });

    it('should block absolute path attack', () => {
      expect(() => assertValidMode('/etc/passwd')).toThrow('Path traversal attempt detected');
      expect(() => assertValidMode('C:\\Windows\\System32')).toThrow('Path traversal attempt detected');
    });

    it('should allow valid modes after validation', () => {
      const validMode = assertValidMode('autopilot');
      const safePath = join('.omc', 'state', `${validMode}-state.json`);
      expect(safePath).toBe(join('.omc', 'state', 'autopilot-state.json'));
    });
  });

  describe('Sensitive Data Encryption/Decryption', () => {
    const originalKey = process.env.OMC_ENCRYPTION_KEY;
    const testKey = Buffer.from('0'.repeat(64), 'hex').toString('hex');

    beforeEach(() => {
      process.env.OMC_ENCRYPTION_KEY = testKey;
    });

    afterEach(() => {
      process.env.OMC_ENCRYPTION_KEY = originalKey;
    });

    it('should correctly encrypt and decrypt sensitive fields', () => {
      const data = { apiKey: 'secret123', user: 'alice' };
      const encrypted = encryptSensitiveFields(data, ['apiKey']);

      expect(encrypted.apiKey).not.toBe('secret123');
      expect(encrypted.user).toBe('alice');

      const decrypted = decryptSensitiveFields(encrypted, ['apiKey']);
      expect(decrypted.apiKey).toBe('secret123');
    });

    it('should detect tampered encrypted data', () => {
      const data = { token: 'secret' };
      const encrypted = encryptSensitiveFields(data, ['token']);

      encrypted.token = encrypted.token.slice(0, -5) + 'XXXXX';

      expect(() => decryptSensitiveFields(encrypted, ['token'])).toThrow();
    });

    it('should handle key rotation scenario', () => {
      const data = { password: 'mypass123' };
      const key1 = Buffer.from('1'.repeat(64), 'hex').toString('hex');
      const key2 = Buffer.from('2'.repeat(64), 'hex').toString('hex');

      process.env.OMC_ENCRYPTION_KEY = key1;
      const encrypted = encryptSensitiveFields(data, ['password']);

      process.env.OMC_ENCRYPTION_KEY = key2;
      expect(() => decryptSensitiveFields(encrypted, ['password'])).toThrow();
    });

    it('should require encryption key for sensitive operations', () => {
      delete process.env.OMC_ENCRYPTION_KEY;

      expect(() => encryptSensitiveFields({ a: 'b' }, ['a'])).toThrow('OMC_ENCRYPTION_KEY not set');
      expect(() => decryptSensitiveFields({ a: 'b' }, ['a'])).toThrow('OMC_ENCRYPTION_KEY not set');
    });

    it('should preserve data integrity through encrypt/decrypt cycle', () => {
      const data = {
        apiKey: 'sk-1234567890',
        webhookUrl: 'https://example.com/webhook',
        publicField: 'visible'
      };

      const encrypted = encryptSensitiveFields(data, ['apiKey', 'webhookUrl']);
      const decrypted = decryptSensitiveFields(encrypted, ['apiKey', 'webhookUrl']);

      expect(decrypted).toEqual(data);
    });
  });
});
