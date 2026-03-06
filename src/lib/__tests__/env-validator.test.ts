import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnvName,
  validateEnvValue,
  getValidatedEnv,
  addToWhitelist,
} from '../env-validator.js';

describe('env-validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvName', () => {
    it('accepts whitelisted names', () => {
      expect(validateEnvName('PATH').valid).toBe(true);
      expect(validateEnvName('HOME').valid).toBe(true);
      expect(validateEnvName('NODE_ENV').valid).toBe(true);
    });

    it('rejects non-whitelisted names', () => {
      const result = validateEnvName('MALICIOUS_VAR');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('not_whitelisted');
    });

    it('rejects empty names', () => {
      const result = validateEnvName('');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('empty_or_invalid_name');
    });
  });

  describe('validateEnvValue', () => {
    it('accepts safe values', () => {
      expect(validateEnvValue('/usr/bin', 'PATH').valid).toBe(true);
      expect(validateEnvValue('production', 'NODE_ENV').valid).toBe(true);
    });

    it('rejects shell metacharacters', () => {
      expect(validateEnvValue('test;rm -rf /', 'PATH').valid).toBe(false);
      expect(validateEnvValue('test|cat', 'PATH').valid).toBe(false);
      expect(validateEnvValue('test`whoami`', 'PATH').valid).toBe(false);
    });

    it('rejects path traversal', () => {
      const result = validateEnvValue('../../../etc/passwd', 'PATH');
      expect(result.valid).toBe(false);
    });

    it('rejects line breaks', () => {
      expect(validateEnvValue('test\nmalicious', 'PATH').valid).toBe(false);
    });
  });

  describe('getValidatedEnv', () => {
    it('returns validated env value', () => {
      process.env.NODE_ENV = 'test';
      expect(getValidatedEnv('NODE_ENV')).toBe('test');
    });

    it('throws on non-whitelisted name', () => {
      expect(() => getValidatedEnv('EVIL_VAR')).toThrow('not allowed');
    });

    it('throws on injection pattern', () => {
      process.env.PATH = 'test;rm -rf /';
      expect(() => getValidatedEnv('PATH')).toThrow('unsafe content');
    });
  });

  describe('addToWhitelist', () => {
    it('adds valid names', () => {
      addToWhitelist('CUSTOM_VAR');
      expect(validateEnvName('CUSTOM_VAR').valid).toBe(true);
    });

    it('rejects invalid format', () => {
      addToWhitelist('invalid-name');
      expect(validateEnvName('invalid-name').valid).toBe(false);
    });
  });
});
