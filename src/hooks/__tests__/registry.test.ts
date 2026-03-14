import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadHandler } from '../handlers/index.js';
import { HOOK_ROUTES } from '../handlers/route-map.js';
import { requiredKeysForHook, validateHookInput, getSkipHooks, resetSkipHooksCache } from '../validation.js';
import type { HookType, HookInput } from '../bridge-types.js';

describe('Hook Registry - Handler Loading', () => {
  it('loads keyword-detector handler', async () => {
    const handler = await loadHandler('keyword-detector');
    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('loads stop-continuation handler', async () => {
    const handler = await loadHandler('stop-continuation');
    expect(handler).toBeDefined();
  });

  it('loads ralph handler', async () => {
    const handler = await loadHandler('ralph');
    expect(handler).toBeDefined();
  });

  it('returns null for unknown hook type', async () => {
    const handler = await loadHandler('unknown-hook' as HookType);
    expect(handler).toBeNull();
  });
});

describe('Hook Registry - Route Map', () => {
  it('has session-end route', () => {
    expect(HOOK_ROUTES['session-end']).toBeDefined();
  });

  it('has subagent-start route', () => {
    expect(HOOK_ROUTES['subagent-start']).toBeDefined();
  });

  it('has permission-request route', () => {
    expect(HOOK_ROUTES['permission-request']).toBeDefined();
  });

  it('has user-prompt-submit route', () => {
    expect(HOOK_ROUTES['user-prompt-submit']).toBeDefined();
  });
});

describe('Hook Registry - Configuration Validation', () => {
  it('returns required keys for session-end', () => {
    const keys = requiredKeysForHook('session-end');
    expect(keys).toEqual(['sessionId', 'directory']);
  });

  it('returns required keys for permission-request', () => {
    const keys = requiredKeysForHook('permission-request');
    expect(keys).toEqual(['sessionId', 'directory', 'toolName']);
  });

  it('returns required keys for user-prompt-submit', () => {
    const keys = requiredKeysForHook('user-prompt-submit');
    expect(keys).toEqual(['prompt', 'directory']);
  });

  it('returns empty array for unknown hook', () => {
    const keys = requiredKeysForHook('unknown-hook');
    expect(keys).toEqual([]);
  });

  it('validates input with all required fields', () => {
    const input = { sessionId: 'test', directory: '/tmp' };
    const result = validateHookInput(input, ['sessionId', 'directory']);
    expect(result).toBe(true);
  });

  it('rejects input missing required fields', () => {
    const input = { sessionId: 'test' };
    const result = validateHookInput(input, ['sessionId', 'directory']);
    expect(result).toBe(false);
  });

  it('rejects null input', () => {
    const result = validateHookInput(null, ['sessionId']);
    expect(result).toBe(false);
  });
});

describe('Hook Registry - Skip Hooks Cache', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OMC_SKIP_HOOKS;
    resetSkipHooksCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetSkipHooksCache();
  });

  it('returns empty array when OMC_SKIP_HOOKS not set', () => {
    const hooks = getSkipHooks();
    expect(hooks).toEqual([]);
  });

  it('parses single hook from OMC_SKIP_HOOKS', () => {
    process.env.OMC_SKIP_HOOKS = 'session-end';
    resetSkipHooksCache();
    const hooks = getSkipHooks();
    expect(hooks).toEqual(['session-end']);
  });

  it('parses multiple hooks from OMC_SKIP_HOOKS', () => {
    process.env.OMC_SKIP_HOOKS = 'session-end,ralph,autopilot';
    resetSkipHooksCache();
    const hooks = getSkipHooks();
    expect(hooks).toEqual(['session-end', 'ralph', 'autopilot']);
  });

  it('caches skip hooks on subsequent calls', () => {
    process.env.OMC_SKIP_HOOKS = 'test-hook';
    resetSkipHooksCache();
    const first = getSkipHooks();
    process.env.OMC_SKIP_HOOKS = 'different-hook';
    const second = getSkipHooks();
    expect(first).toEqual(second);
  });
});

describe('Hook Registry - Route Execution', () => {
  it('validates input before execution in session-end', async () => {
    const input: HookInput = { sessionId: 'test' };
    const handler = HOOK_ROUTES['session-end'];
    const result = await handler!(input);
    expect(result.continue).toBe(true);
  });

  it('validates input before execution in subagent-start', async () => {
    const input: HookInput = { sessionId: 'test' };
    const handler = HOOK_ROUTES['subagent-start'];
    const result = await handler!(input);
    expect(result.continue).toBe(true);
  });

  it('validates input before execution in permission-request', async () => {
    const input: HookInput = { sessionId: 'test' };
    const handler = HOOK_ROUTES['permission-request'];
    const result = await handler!(input);
    expect(result.continue).toBe(false);
  });
});
