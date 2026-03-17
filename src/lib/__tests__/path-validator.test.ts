/**
 * Path traversal protection tests - OWASP attack vectors
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validatePath, SecurityError } from '../path-validator.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('validatePath', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'path-test-'));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('Valid paths', () => {
    it('should allow simple relative path', () => {
      const result = validatePath('file.txt', testDir);
      const resolvedBase = fs.realpathSync(testDir);
      const expected = path.join(resolvedBase, 'file.txt');
      expect(path.normalize(result).toLowerCase()).toBe(path.normalize(expected).toLowerCase());
    });

    it('should allow nested path', () => {
      const result = validatePath(path.join('subdir', 'file.txt'), testDir);
      const resolvedBase = fs.realpathSync(testDir);
      const expected = path.join(resolvedBase, 'subdir', 'file.txt');
      expect(path.normalize(result).toLowerCase()).toBe(path.normalize(expected).toLowerCase());
    });

    it('should allow current directory reference', () => {
      const result = validatePath('./file.txt', testDir);
      const resolvedBase = fs.realpathSync(testDir);
      const expected = path.join(resolvedBase, 'file.txt');
      expect(path.normalize(result).toLowerCase()).toBe(path.normalize(expected).toLowerCase());
    });
  });

  describe('Attack Vector 1: Path traversal with ../', () => {
    it('should block ../../../etc/passwd', () => {
      expect(() => validatePath('../../../etc/passwd', testDir))
        .toThrow(SecurityError);
    });

    it('should block ..\\..\\..\\windows\\system32', () => {
      expect(() => validatePath('..\\..\\..\\windows\\system32', testDir))
        .toThrow(SecurityError);
    });

    it('should block subdir/../../etc/passwd', () => {
      expect(() => validatePath('subdir/../../etc/passwd', testDir))
        .toThrow(SecurityError);
    });
  });

  describe('Attack Vector 2: URL encoding', () => {
    it('should block %2e%2e%2f (../) encoded', () => {
      expect(() => validatePath('%2e%2e%2fetc%2fpasswd', testDir))
        .toThrow(SecurityError);
    });

    it('should block %2e%2e/ (../) partial encoded', () => {
      expect(() => validatePath('%2e%2e/etc/passwd', testDir))
        .toThrow(SecurityError);
    });

    it('should block ..%2f (../) partial encoded', () => {
      expect(() => validatePath('..%2fetc%2fpasswd', testDir))
        .toThrow(SecurityError);
    });
  });

  describe('Attack Vector 3: Double encoding', () => {
    it('should block %252e%252e%252f (double encoded ../)', () => {
      expect(() => validatePath('%252e%252e%252fetc', testDir))
        .toThrow(SecurityError);
    });

    it('should block %252e%252e/ (double encoded ../)', () => {
      expect(() => validatePath('%252e%252e/etc', testDir))
        .toThrow(SecurityError);
    });
  });

  describe('Attack Vector 4: Null byte injection', () => {
    it('should block path with null byte', () => {
      expect(() => validatePath('file.txt\0.jpg', testDir))
        .toThrow(SecurityError);
    });

    it('should block path with null byte in middle', () => {
      expect(() => validatePath('sub\0dir/file.txt', testDir))
        .toThrow(SecurityError);
    });
  });

  describe('Attack Vector 5: Unicode normalization', () => {
    it('should normalize Unicode characters', () => {
      // U+FF0E (fullwidth full stop) normalizes to .
      const result = validatePath('file\uFF0Etxt', testDir);
      // After normalization, fullwidth dot becomes ASCII dot
      const resolvedBase = fs.realpathSync(testDir);
      const expected = path.join(resolvedBase, 'file.txt');
      expect(path.normalize(result).toLowerCase()).toBe(path.normalize(expected).toLowerCase());
    });

    it('should block Unicode path traversal', () => {
      // U+FF0E U+FF0E U+FF0F = ．．／ (fullwidth ../)
      // After normalization becomes ../
      expect(() => validatePath('\uFF0E\uFF0E\uFF0Fetc', testDir))
        .toThrow(SecurityError);
    });
  });

  describe('Attack Vector 6: Symlink traversal', () => {
    it.skip('should block symlink pointing outside base (requires admin on Windows)', () => {
      const linkPath = path.join(testDir, 'link');
      const targetPath = path.join(os.tmpdir(), 'outside');

      fs.mkdirSync(targetPath, { recursive: true });
      try {
        fs.symlinkSync(targetPath, linkPath);
        expect(() => validatePath('link', testDir)).toThrow(SecurityError);
      } finally {
        fs.rmSync(targetPath, { recursive: true, force: true });
        fs.rmSync(linkPath, { force: true });
      }
    });

    it.skip('should allow symlink within base (requires admin on Windows)', () => {
      const targetPath = path.join(testDir, 'target');
      const linkPath = path.join(testDir, 'link');

      fs.mkdirSync(targetPath);
      fs.symlinkSync(targetPath, linkPath);

      const result = validatePath('link', testDir);
      expect(result).toBe(fs.realpathSync(linkPath));
    });
  });

  describe('Mixed attack vectors', () => {
    it('should block URL encoded path traversal', () => {
      expect(() => validatePath('%2e%2e%2f%2e%2e%2fetc', testDir))
        .toThrow(SecurityError);
    });

    it('should block backslash path traversal', () => {
      expect(() => validatePath('..\\..\\etc', testDir))
        .toThrow(SecurityError);
    });

    it('should block absolute path', () => {
      expect(() => validatePath('/etc/passwd', testDir))
        .toThrow(SecurityError);
    });

    it('should block Windows absolute path', () => {
      expect(() => validatePath('C:\\Windows\\System32', testDir))
        .toThrow(SecurityError);
    });

    it('should block UNC path', () => {
      expect(() => validatePath('\\\\server\\share', testDir))
        .toThrow(SecurityError);
    });
  });

  describe('Edge cases', () => {
    it('should handle non-existent file in valid directory', () => {
      const result = validatePath('newfile.txt', testDir);
      const resolvedBase = fs.realpathSync(testDir);
      const expected = path.join(resolvedBase, 'newfile.txt');
      expect(path.normalize(result).toLowerCase()).toBe(path.normalize(expected).toLowerCase());
    });

    it('should handle deeply nested non-existent path', () => {
      const result = validatePath('a/b/c/file.txt', testDir);
      const resolvedBase = fs.realpathSync(testDir);
      const expected = path.join(resolvedBase, 'a', 'b', 'c', 'file.txt');
      expect(path.normalize(result).toLowerCase()).toBe(path.normalize(expected).toLowerCase());
    });

    it('should throw on invalid URL encoding', () => {
      expect(() => validatePath('%ZZ%invalid', testDir))
        .toThrow(SecurityError);
    });
  });
});

