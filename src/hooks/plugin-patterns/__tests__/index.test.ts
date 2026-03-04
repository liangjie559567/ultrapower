import { describe, it, expect } from 'vitest';
import { isValidFilePath } from '../index.js';

describe('plugin-patterns hook', () => {
  it('should validate file paths', () => {
    expect(isValidFilePath('test.ts')).toBe(true);
    expect(isValidFilePath('src/index.ts')).toBe(true);
  });

  it('should reject invalid paths', () => {
    expect(isValidFilePath('../etc/passwd')).toBe(false);
    expect(isValidFilePath('test;rm -rf')).toBe(false);
  });

  it('should reject shell metacharacters', () => {
    expect(isValidFilePath('test|cat')).toBe(false);
    expect(isValidFilePath('test`whoami`')).toBe(false);
  });
});
