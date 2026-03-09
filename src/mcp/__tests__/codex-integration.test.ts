import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCodex } from '../codex-core.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

vi.mock('child_process');

vi.mock('../cli-detection.js', () => ({
  detectCodexCli: vi.fn(() => ({ available: true })),
  getCliCommand: vi.fn((name: string) => process.platform === 'win32' ? `${name}.cmd` : name),
  getSpawnEnv: vi.fn(() => process.env),
}));

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = Object.assign(new EventEmitter(), {
    write: vi.fn(),
    end: vi.fn()
  });
  kill = vi.fn();
}

describe('Codex Integration', () => {
  let mockChild: MockChildProcess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChild = new MockChildProcess();
    vi.mocked(spawn).mockReturnValue(mockChild as any);
  });

  describe('executeCodex', () => {
    it('executes successfully with valid response', async () => {
      const promise = executeCodex('test prompt', 'gpt-5.3-codex');

      setTimeout(() => {
        mockChild.stdout.emit('data', Buffer.from('{"type":"content","text":"response"}'));
        mockChild.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result).toContain('response');
    });

    it('handles model error', async () => {
      const promise = executeCodex('test', 'bad-model');

      setTimeout(() => {
        mockChild.stdout.emit('data', Buffer.from('{"type":"error","message":"model_not_found"}'));
        mockChild.emit('close', 1);
      }, 10);

      await expect(promise).rejects.toThrow('model error');
    });

    it('handles rate limit error', async () => {
      const promise = executeCodex('test', 'gpt-5.3-codex');

      setTimeout(() => {
        mockChild.stdout.emit('data', Buffer.from('{"type":"error","message":"429 rate limit"}'));
        mockChild.emit('close', 1);
      }, 10);

      await expect(promise).rejects.toThrow('rate limit');
    });

    it('passes reasoning effort parameter', async () => {
      const promise = executeCodex('test', 'gpt-5.3-codex', undefined, 'high');

      setTimeout(() => {
        mockChild.stdout.emit('data', Buffer.from('{"type":"content","text":"ok"}'));
        mockChild.emit('close', 0);
      }, 10);

      await promise;
      const expectedCmd = process.platform === 'win32' ? 'codex.cmd' : 'codex';
      expect(spawn).toHaveBeenCalledWith(expectedCmd, expect.arrayContaining(['-c', 'model_reasoning_effort="high"']), expect.any(Object));
    });
  });
});
