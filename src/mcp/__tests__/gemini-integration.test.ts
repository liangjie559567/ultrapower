import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGemini } from '../gemini-core.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

vi.mock('child_process');

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = Object.assign(new EventEmitter(), {
    write: vi.fn(),
    end: vi.fn()
  });
  kill = vi.fn();
}

describe('Gemini Integration', () => {
  let mockChild: MockChildProcess;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChild = new MockChildProcess();
    vi.mocked(spawn).mockReturnValue(mockChild as any);
  });

  describe('executeGemini', () => {
    it('executes successfully with valid response', async () => {
      const promise = executeGemini('test prompt', 'gemini-3-pro-preview');

      setTimeout(() => {
        mockChild.stdout.emit('data', Buffer.from('{"candidates":[{"content":{"parts":[{"text":"response"}]}}]}'));
        mockChild.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result).toContain('response');
    });

    it('handles model error', async () => {
      const promise = executeGemini('test', 'bad-model');

      setTimeout(() => {
        mockChild.stderr.emit('data', Buffer.from('Error: model not found'));
        mockChild.emit('close', 1);
      }, 10);

      await expect(promise).rejects.toThrow();
    });

    it('handles quota exceeded error', async () => {
      const promise = executeGemini('test', 'gemini-3-pro-preview');

      setTimeout(() => {
        mockChild.stderr.emit('data', Buffer.from('Error: quota exceeded'));
        mockChild.emit('close', 1);
      }, 10);

      await expect(promise).rejects.toThrow('quota');
    });
  });
});
