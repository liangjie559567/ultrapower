import { describe, it, expect } from 'vitest';
import * as path from 'path';

// Import functions directly to test logic
const isPathRoot = (filepath: string): boolean => {
  const parsed = path.parse(filepath);
  return parsed.root === filepath;
};

describe('Platform Detection', () => {
  it('should export platform constants', async () => {
    const platform = await import('../index.js');
    expect(platform.PLATFORM).toBeDefined();
    expect(typeof platform.isWindows).toBe('function');
    expect(typeof platform.isMacOS).toBe('function');
    expect(typeof platform.isLinux).toBe('function');
    expect(typeof platform.isUnix).toBe('function');
  });

  it('should have consistent Unix detection', async () => {
    const platform = await import('../index.js');
    const isUnix = platform.isUnix();
    const isMacOrLinux = platform.isMacOS() || platform.isLinux();
    expect(isUnix).toBe(isMacOrLinux);
  });
});

describe('Path Root Detection', () => {
  it('should detect Unix root path', () => {
    expect(isPathRoot('/')).toBe(true);
  });

  it('should detect Windows root paths', () => {
    expect(isPathRoot('C:\\')).toBe(true);
    expect(isPathRoot('D:\\')).toBe(true);
  });

  it('should return false for non-root paths', () => {
    expect(isPathRoot('/home/user')).toBe(false);
    expect(isPathRoot('C:\\Users')).toBe(false);
    expect(isPathRoot('/var/log')).toBe(false);
  });

  it('should handle relative paths', () => {
    expect(isPathRoot('.')).toBe(false);
    expect(isPathRoot('..')).toBe(false);
    expect(isPathRoot('./src')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isPathRoot('relative/path')).toBe(false);
  });
});
