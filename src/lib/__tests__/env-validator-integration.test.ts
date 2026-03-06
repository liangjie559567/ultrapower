import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { replaceEnvVars } from '../../mcp/config/env-replacer.js';

describe('env-validator integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('replaces whitelisted env vars', () => {
    process.env.HOME = '/home/user';
    expect(replaceEnvVars('${HOME}/config')).toBe('/home/user/config');
  });

  it('silently skips non-whitelisted vars', () => {
    process.env.EVIL_VAR = 'malicious';
    expect(replaceEnvVars('${EVIL_VAR}/path')).toBe('/path');
  });

  it('silently skips vars with injection patterns', () => {
    process.env.PATH = 'test;rm -rf /';
    expect(replaceEnvVars('${PATH}/bin')).toBe('/bin');
  });
});
