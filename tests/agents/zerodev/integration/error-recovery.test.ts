import { describe, it, expect, beforeEach } from 'vitest';
import { ZeroDevStateManager } from '../../../../dist/agents/zerodev/state-manager.js';
import { InputError } from '../../../../dist/agents/zerodev/types.js';
import { detectPlatform } from '../../../../dist/agents/zerodev/requirement-clarifier.js';

describe('错误恢复机制', () => {
  let stateManager: ZeroDevStateManager;
  let sessionId: string;

  beforeEach(() => {
    stateManager = new ZeroDevStateManager();
    sessionId = `error-recovery-${Date.now()}`;
  });

  it('应该处理状态写入失败', async () => {
    const invalidData = { circular: {} as any };
    invalidData.circular.ref = invalidData;

    await expect(
      stateManager.writeState('test', sessionId, invalidData)
    ).rejects.toThrow();
  });

  it('应该处理状态读取失败', async () => {
    const state = await stateManager.readState('nonexistent', 'invalid-session');
    expect(state).toBeNull();
  });

  it('应该处理空输入错误', () => {
    expect(() => detectPlatform('')).toThrow(InputError);
  });

  it('应该处理超长输入错误', () => {
    expect(() => detectPlatform('a'.repeat(1001))).toThrow();
  });
});
