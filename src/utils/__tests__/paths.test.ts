import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { toForwardSlash, toShellPath, getDataDir, getConfigDir, safeUnlinkSync, safeRmSync } from '../paths.js';

const TEST_DIR = join(process.cwd(), '.test-utils-paths');

describe('cross-platform path utilities', () => {
  describe('toForwardSlash', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(toForwardSlash('C:\\Users\\test\\.claude')).toBe('C:/Users/test/.claude');
    });

    it('should leave forward slashes unchanged', () => {
      expect(toForwardSlash('/home/user/.claude')).toBe('/home/user/.claude');
    });

    it('should handle mixed slashes', () => {
      expect(toForwardSlash('C:\\Users/test\\.claude')).toBe('C:/Users/test/.claude');
    });

    it('should handle empty string', () => {
      expect(toForwardSlash('')).toBe('');
    });

    it('should handle UNC paths', () => {
      expect(toForwardSlash('\\\\server\\share\\path')).toBe('//server/share/path');
    });
  });

  describe('toShellPath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(toShellPath('C:\\Users\\test')).toBe('C:/Users/test');
    });

    it('should quote paths with spaces', () => {
      expect(toShellPath('/path/with spaces/file')).toBe('"/path/with spaces/file"');
    });

    it('should quote Windows paths with spaces', () => {
      expect(toShellPath('C:\\Program Files\\app')).toBe('"C:/Program Files/app"');
    });

    it('should not quote paths without spaces', () => {
      expect(toShellPath('/simple/path')).toBe('/simple/path');
    });

    it('should handle empty string', () => {
      expect(toShellPath('')).toBe('');
    });
  });

  describe('getDataDir', () => {
    const originalPlatform = process.platform;
    const originalEnv = { ...process.env };

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      process.env = { ...originalEnv };
    });

    it('should use LOCALAPPDATA on Windows when set', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env.LOCALAPPDATA = 'C:\\Users\\Test\\AppData\\Local';
      expect(getDataDir()).toBe('C:\\Users\\Test\\AppData\\Local');
    });

    it('should use XDG_DATA_HOME on Unix when set', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env.XDG_DATA_HOME = '/custom/data';
      expect(getDataDir()).toBe('/custom/data');
    });

    it('should fall back to .local/share on Unix when XDG not set', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      delete process.env.XDG_DATA_HOME;
      const result = getDataDir();
      expect(result).toContain('.local');
      expect(result).toContain('share');
    });
  });

  describe('getConfigDir', () => {
    const originalPlatform = process.platform;
    const originalEnv = { ...process.env };

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      process.env = { ...originalEnv };
    });

    it('should use APPDATA on Windows when set', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming';
      expect(getConfigDir()).toBe('C:\\Users\\Test\\AppData\\Roaming');
    });

    it('should use XDG_CONFIG_HOME on Unix when set', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      process.env.XDG_CONFIG_HOME = '/custom/config';
      expect(getConfigDir()).toBe('/custom/config');
    });

    it('should fall back to .config on Unix when XDG not set', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      delete process.env.XDG_CONFIG_HOME;
      const result = getConfigDir();
      expect(result).toContain('.config');
    });
  });

  describe('safeUnlinkSync', () => {
    beforeEach(() => {
      if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
      mkdirSync(TEST_DIR, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    });

    it('should delete existing file and return true', () => {
      const filePath = join(TEST_DIR, 'test.txt');
      writeFileSync(filePath, 'content');
      expect(safeUnlinkSync(filePath)).toBe(true);
      expect(existsSync(filePath)).toBe(false);
    });

    it('should return false for non-existent file', () => {
      const filePath = join(TEST_DIR, 'nonexistent.txt');
      expect(safeUnlinkSync(filePath)).toBe(false);
    });

    it('should handle permission errors gracefully', () => {
      expect(safeUnlinkSync('/root/protected.txt')).toBe(false);
    });
  });

  describe('safeRmSync', () => {
    beforeEach(() => {
      if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
      mkdirSync(TEST_DIR, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    });

    it('should delete existing directory and return true', () => {
      const dirPath = join(TEST_DIR, 'subdir');
      mkdirSync(dirPath);
      expect(safeRmSync(dirPath)).toBe(true);
      expect(existsSync(dirPath)).toBe(false);
    });

    it('should return false for non-existent directory', () => {
      const dirPath = join(TEST_DIR, 'nonexistent');
      expect(safeRmSync(dirPath)).toBe(false);
    });

    it('should handle nested directories', () => {
      const dirPath = join(TEST_DIR, 'nested', 'deep', 'dir');
      mkdirSync(dirPath, { recursive: true });
      const topDir = join(TEST_DIR, 'nested');
      expect(safeRmSync(topDir)).toBe(true);
      expect(existsSync(topDir)).toBe(false);
    });
  });
});
