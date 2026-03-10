import { describe, it, expect } from 'vitest';
import { mask, maskAttributes } from './masker';

describe('masker', () => {
  it('should mask API keys', () => {
    const text = 'API key: sk_test_1234567890abcdefghij';
    const result = mask(text);
    expect(result).toContain('[APIKEY_REDACTED]');
    expect(result).not.toContain('sk_test_1234567890abcdefghij');
  });

  it('should mask tokens', () => {
    const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const result = mask(text);
    expect(result).toContain('[TOKEN_REDACTED]');
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('should mask passwords', () => {
    const text = 'password: mySecretPass123';
    const result = mask(text);
    expect(result).toContain('[PASSWORD_REDACTED]');
    expect(result).not.toContain('mySecretPass123');
  });

  it('should mask emails', () => {
    const text = 'Contact: user@example.com';
    const result = mask(text);
    expect(result).toContain('[EMAIL_REDACTED]');
    expect(result).not.toContain('user@example.com');
  });

  it('should mask file paths', () => {
    const text = 'File at C:\\Users\\john\\documents\\file.txt';
    const result = mask(text);
    expect(result).toContain('[PATH_REDACTED]');
    expect(result).not.toContain('john');
  });

  it('should mask Unix paths', () => {
    const text = 'File at /home/john/documents/file.txt';
    const result = mask(text);
    expect(result).toContain('[PATH_REDACTED]');
    expect(result).not.toContain('john');
  });

  it('should support custom patterns', () => {
    const text = 'SSN: 123-45-6789';
    const result = mask(text, { ssn: /\d{3}-\d{2}-\d{4}/g });
    expect(result).toContain('[SSN_REDACTED]');
    expect(result).not.toContain('123-45-6789');
  });

  it('should mask multiple sensitive items', () => {
    const text = 'User user@test.com has password: secret123 and token abc123def456ghi789';
    const result = mask(text);
    expect(result).not.toContain('user@test.com');
    expect(result).not.toContain('secret123');
    expect(result).not.toContain('abc123def456ghi789');
  });

  it('should mask attributes object', () => {
    const attrs = {
      user: 'test@example.com',
      count: 42,
      token: 'Bearer secret_token_12345'
    };
    const result = maskAttributes(attrs);
    expect(result.user).toContain('[EMAIL_REDACTED]');
    expect(result.count).toBe(42);
    expect(result.token).toContain('[TOKEN_REDACTED]');
  });

  it('should preserve non-sensitive text', () => {
    const text = 'Hello world, this is a normal message';
    const result = mask(text);
    expect(result).toBe(text);
  });
});
