import { describe, it, expect, beforeEach } from 'vitest';
import { detectPlatform, extractRequirements } from '../../../src/agents/zerodev/requirement-clarifier';
import { ValidationError, InputError } from '../../../src/agents/zerodev/types';
import { createMockState, createTestSession, expectInputError, expectPlatform } from './test-helpers';
import type { ZeroDevStateManager } from '../../../src/agents/zerodev/state-manager';

describe('requirement-clarifier agent', () => {
  let stateManager: ZeroDevStateManager;
  let sessionId: string;

  beforeEach(() => {
    ({ stateManager, sessionId } = createTestSession());
  });

  describe('状态管理', () => {
    it('应该创建初始状态', async () => {
      const initialState = createMockState({ sessionId });

      await stateManager.writeState('requirement-clarifier', sessionId, initialState);
      const state = await stateManager.readState('requirement-clarifier', sessionId);

      expect(state).toBeDefined();
      expect(state?.sessionId).toBe(sessionId);
      expect(state?.clarificationRound).toBe(0);
    });

    it('应该更新对话历史', async () => {
      const state = createMockState({
        sessionId,
        status: 'processing',
        conversationHistory: [
          { role: 'user', content: '我想做一个待办事项应用', timestamp: new Date().toISOString() }
        ],
        clarificationRound: 1
      });

      await stateManager.writeState('requirement-clarifier', sessionId, state);
      const retrieved = await stateManager.readState('requirement-clarifier', sessionId);

      expect(retrieved?.conversationHistory).toHaveLength(1);
      expect(retrieved?.conversationHistory[0].content).toBe('我想做一个待办事项应用');
    });
  });

  describe('平台识别', () => {
    it('应该识别 web 平台', () => expectPlatform('我想做一个网站', 'web'));
    it('应该识别 mobile 平台', () => expectPlatform('我想做一个手机应用', 'mobile'));
    it('应该识别 api 平台', () => expectPlatform('我想做一个 REST API', 'api'));
    it('应该识别 desktop 平台', () => expectPlatform('我想做一个桌面应用', 'desktop'));
    it('应该识别 plugin 平台', () => expectPlatform('我想做一个浏览器插件', 'plugin'));

    it('应该从项目记忆推断平台', () => {
      expectPlatform('我想做一个应用', 'mobile', { techStack: ['React Native', 'TypeScript'] });
    });
  });

  describe('需求结构化', () => {
    it('应该提取功能需求', () => {
      const input = '用户可以添加、编辑、删除待办事项';
      const requirements = extractRequirements(input);
      expect(requirements.functional).toContain('添加待办事项');
      expect(requirements.functional).toContain('编辑待办事项');
      expect(requirements.functional).toContain('删除待办事项');
    });

    it('应该提取非功能需求', () => {
      const input = '响应时间要小于 2 秒，支持 1000 个并发用户';
      const requirements = extractRequirements(input);
      expect(requirements.nonFunctional).toContain('响应时间 <2s');
      expect(requirements.nonFunctional).toContain('支持 1000 并发');
    });
  });

  describe('多轮对话', () => {
    it('应该限制最多 10 轮对话', async () => {
      const state = createMockState({ sessionId, status: 'processing', clarificationRound: 10 });
      const canContinue = state.clarificationRound < state.maxRounds;
      expect(canContinue).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('应该拒绝空字符串输入', () => {
      expectInputError(() => detectPlatform(''));
      expectInputError(() => extractRequirements(''));
    });

    it('应该拒绝 null/undefined 输入', () => {
      expectInputError(() => detectPlatform(null as any));
      expectInputError(() => detectPlatform(undefined as any));
      expectInputError(() => extractRequirements(null as any));
      expectInputError(() => extractRequirements(undefined as any));
    });

    it('应该拒绝超长输入', () => {
      const longInput1 = 'a'.repeat(1001);
      expect(() => detectPlatform(longInput1)).toThrow(ValidationError);

      const longInput2 = 'a'.repeat(5001);
      expect(() => extractRequirements(longInput2)).toThrow(ValidationError);
    });

    it('应该处理特殊字符和 Unicode', () => {
      expect(() => detectPlatform('我想做一个网站应用 😀🎉')).not.toThrow();
      expect(() => extractRequirements('我想做一个网站应用 😀🎉')).not.toThrow();
      expectPlatform('我想做一个网站应用 😀🎉', 'web');
    });

    it('应该处理项目记忆文件损坏', () => {
      expect(() => detectPlatform('做个应用', { techStack: null, invalid: 'data' } as any)).not.toThrow();
    });

    it('应该处理项目记忆文件缺失', () => {
      expect(() => detectPlatform('做个应用', undefined)).not.toThrow();
      expect(() => detectPlatform('做个应用', null as any)).not.toThrow();
    });

    it('应该从 Electron 技术栈推断 desktop 平台', () => {
      expectPlatform('做个应用', 'desktop', { techStack: ['Electron', 'TypeScript'] });
    });

    it('应该从 Flutter 技术栈推断 mobile 平台', () => {
      expectPlatform('做个应用', 'mobile', { techStack: ['Flutter', 'Dart'] });
    });
  });
});

// 函数已在 src/agents/zerodev/requirement-clarifier.ts 中实现
