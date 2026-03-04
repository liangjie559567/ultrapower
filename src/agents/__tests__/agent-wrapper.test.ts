import { describe, it, expect, vi } from 'vitest';
import { callAgentWithTimeout } from '../agent-wrapper.js';

describe('agent-wrapper', () => {
  it('成功调用返回输出', async () => {
    const agentFn = vi.fn().mockResolvedValue('success output');

    const result = await callAgentWithTimeout(agentFn, {
      agentType: 'executor',
      prompt: 'test',
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe('success output');
    expect(result.timedOut).toBeUndefined();
  });

  it('超时后返回错误', async () => {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    const agentFn = vi.fn().mockRejectedValue(error);

    const result = await callAgentWithTimeout(agentFn, {
      agentType: 'explore',
      prompt: 'test',
      maxRetries: 0,
    });

    expect(result.success).toBe(false);
    expect(result.timedOut).toBe(true);
  });

  it('捕获其他错误', async () => {
    const agentFn = vi.fn().mockRejectedValue(new Error('test error'));

    const result = await callAgentWithTimeout(agentFn, {
      agentType: 'executor',
      prompt: 'test',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('test error');
    expect(result.timedOut).toBeUndefined();
  });
});
