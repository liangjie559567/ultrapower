/**
 * Python REPL Paths Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import {
  getRuntimeDir,
  shortenSessionId,
  getSessionDir,
  getBridgeSocketPath,
  getBridgeMetaPath,
  getSessionLockPath,
  validatePathSegment,
} from '../paths.js';

describe('shortenSessionId', () => {
  it('should return 12 hex characters', () => {
    const result = shortenSessionId('test-session-123');
    expect(result).toHaveLength(12);
    expect(result).toMatch(/^[0-9a-f]{12}$/);
  });

  it('should be deterministic for same input', () => {
    const id = 'my-session-id';
    const result1 = shortenSessionId(id);
    const result2 = shortenSessionId(id);
    expect(result1).toBe(result2);
  });

  it('should always hash even short inputs to prevent traversal', () => {
    const result = shortenSessionId('..');
    expect(result).toHaveLength(12);
    expect(result).toMatch(/^[0-9a-f]{12}$/);
    expect(result).not.toBe('..');
  });
});

describe('validatePathSegment', () => {
  it('should accept valid segment', () => {
    expect(() => validatePathSegment('valid-name', 'test')).not.toThrow();
  });

  it('should reject empty string', () => {
    expect(() => validatePathSegment('', 'test')).toThrow('required and must be a string');
  });

  it('should reject path traversal with ..', () => {
    expect(() => validatePathSegment('..', 'test')).toThrow('path traversal');
  });

  it('should reject forward slash', () => {
    expect(() => validatePathSegment('a/b', 'test')).toThrow('path traversal');
  });

  it('should reject backslash', () => {
    expect(() => validatePathSegment('a\\b', 'test')).toThrow('path traversal');
  });

  it('should reject null byte', () => {
    expect(() => validatePathSegment('test\0', 'test')).toThrow('null byte');
  });

  it('should reject Windows reserved names', () => {
    expect(() => validatePathSegment('CON', 'test')).toThrow('reserved name');
    expect(() => validatePathSegment('NUL', 'test')).toThrow('reserved name');
    expect(() => validatePathSegment('COM1', 'test')).toThrow('reserved name');
  });

  it('should reject trailing dot', () => {
    expect(() => validatePathSegment('test.', 'test')).toThrow('trailing dot');
  });

  it('should reject trailing space', () => {
    expect(() => validatePathSegment('test ', 'test')).toThrow('trailing dot or space');
  });

  it('should reject whitespace-only string', () => {
    expect(() => validatePathSegment('   ', 'test')).toThrow('empty or whitespace');
  });

  it('should reject segment exceeding 255 bytes', () => {
    const longSegment = 'a'.repeat(256);
    expect(() => validatePathSegment(longSegment, 'test')).toThrow('exceeds maximum length');
  });
});

describe('getRuntimeDir', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return absolute path', () => {
    const result = getRuntimeDir();
    expect(path.isAbsolute(result)).toBe(true);
  });

  it('should include omc in path', () => {
    const result = getRuntimeDir();
    expect(result).toContain('omc');
  });

  it('should reject relative XDG_RUNTIME_DIR', () => {
    process.env.XDG_RUNTIME_DIR = './relative';
    const result = getRuntimeDir();
    expect(result).not.toContain('./relative');
  });

  it('should handle Linux platform', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    const result = getRuntimeDir();
    expect(result).toContain('omc');
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('should handle unknown platform fallback', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'freebsd', configurable: true });
    const result = getRuntimeDir();
    expect(result).toContain('omc');
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('should handle darwin platform', () => {
    const originalPlatform = process.platform;
    const originalXdg = process.env.XDG_RUNTIME_DIR;
    delete process.env.XDG_RUNTIME_DIR;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    const result = getRuntimeDir();
    expect(result).toContain('omc');
    expect(result).toContain('Library');
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
    if (originalXdg) process.env.XDG_RUNTIME_DIR = originalXdg;
  });
});

describe('getSessionDir', () => {
  it('should return path with shortened session ID', () => {
    const sessionId = 'test-session-123';
    const result = getSessionDir(sessionId);
    const shortId = shortenSessionId(sessionId);
    expect(result).toContain(shortId);
  });

  it('should be under runtime directory', () => {
    const result = getSessionDir('test-session');
    const runtimeDir = getRuntimeDir();
    expect(result.startsWith(runtimeDir)).toBe(true);
  });
});

describe('getBridgeSocketPath', () => {
  it('should end with bridge.sock', () => {
    const result = getBridgeSocketPath('test-session');
    expect(result.endsWith('bridge.sock')).toBe(true);
  });

  it('should be under session directory', () => {
    const sessionId = 'test-session';
    const result = getBridgeSocketPath(sessionId);
    const sessionDir = getSessionDir(sessionId);
    expect(result.startsWith(sessionDir)).toBe(true);
  });
});

describe('getBridgeMetaPath', () => {
  it('should end with bridge_meta.json', () => {
    const result = getBridgeMetaPath('test-session');
    expect(result.endsWith('bridge_meta.json')).toBe(true);
  });
});

describe('getSessionLockPath', () => {
  it('should end with session.lock', () => {
    const result = getSessionLockPath('test-session');
    expect(result.endsWith('session.lock')).toBe(true);
  });
});
