import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAgentTimeout, DEFAULT_TIMEOUT_CONFIG } from '../timeout-config.js';

describe('timeout-config', () => {
  beforeEach(() => {
    delete process.env.OMC_AGENT_TIMEOUT;
  });

  describe('getAgentTimeout', () => {
    it('返回 Agent 类型特定超时', () => {
      expect(getAgentTimeout('explore')).toBe(60000);
      expect(getAgentTimeout('executor')).toBe(600000);
      expect(getAgentTimeout('deep-executor')).toBe(1800000);
    });

    it('返回模型特定超时', () => {
      expect(getAgentTimeout('unknown', 'haiku')).toBe(120000);
      expect(getAgentTimeout('unknown', 'sonnet')).toBe(600000);
      expect(getAgentTimeout('unknown', 'opus')).toBe(1800000);
    });

    it('Agent 类型优先于模型', () => {
      expect(getAgentTimeout('explore', 'opus')).toBe(60000);
    });

    it('返回默认超时', () => {
      expect(getAgentTimeout('unknown')).toBe(300000);
    });

    it('环境变量覆盖所有配置', () => {
      process.env.OMC_AGENT_TIMEOUT = '999999';
      expect(getAgentTimeout('explore')).toBe(999999);
      expect(getAgentTimeout('unknown', 'opus')).toBe(999999);
    });

    it('忽略无效环境变量', () => {
      process.env.OMC_AGENT_TIMEOUT = 'invalid';
      expect(getAgentTimeout('explore')).toBe(60000);
    });
  });
});
