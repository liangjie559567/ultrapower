import { describe, it, expect } from 'vitest';
import { normalizeHookInput } from '../../src/hooks/bridge-normalize.js';

describe('D-06: whitelist validation', () => {
  it('filters unknown fields for tool-call hook', () => {
    const input = { toolName: 'test', toolInput: {}, unknown: 'value', timestamp: '2024-01-01' };
    const normalized = normalizeHookInput(input, 'tool-call');

    expect(normalized.toolName).toBe('test');
    expect(normalized.timestamp).toBe('2024-01-01');
    expect(normalized.unknown).toBeUndefined();
  });

  it('filters unknown fields for session-start hook', () => {
    const input = { sessionId: 'abc', directory: '/tmp', unknown: 'drop', timestamp: '2024-01-01' };
    const normalized = normalizeHookInput(input, 'session-start');

    expect(normalized.sessionId).toBe('abc');
    expect(normalized.directory).toBe('/tmp');
    expect(normalized.timestamp).toBe('2024-01-01');
    expect(normalized.unknown).toBeUndefined();
  });

  it('allows all whitelisted fields for tool-response', () => {
    const input = {
      toolName: 'bash',
      toolOutput: 'result',
      success: true,
      error: null,
      duration: 100
    };
    const normalized = normalizeHookInput(input, 'tool-response');

    expect(normalized.toolName).toBe('bash');
    expect(normalized.toolOutput).toBe('result');
    expect(normalized.success).toBe(true);
    expect(normalized.duration).toBe(100);
  });
});
