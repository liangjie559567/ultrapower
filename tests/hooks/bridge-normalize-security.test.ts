import { describe, it, expect } from 'vitest';
import { normalizeHookInput, SENSITIVE_HOOKS } from '../../src/hooks/bridge-normalize.js';

describe('BUG-002: Sensitive Hook Validation', () => {
  describe('强制完整验证路径', () => {
    it('敏感 hook 必须使用完整 Zod 验证', () => {
      const input = {
        sessionId: 'test-session',
        toolName: 'Read',
        directory: '/test'
      };

      const result = normalizeHookInput(input, 'permission-request');
      expect(result.sessionId).toBe('test-session');
      expect(result.toolName).toBe('Read');
    });

    it('敏感 hook 过滤未知字段', () => {
      const input = {
        sessionId: 'test',
        toolName: 'Read',
        maliciousField: 'exploit'
      };

      const result = normalizeHookInput(input, 'permission-request');
      expect(result.maliciousField).toBeUndefined();
      expect(result.sessionId).toBe('test');
      expect(result.toolName).toBe('Read');
    });
  });

  describe('原型污染防护', () => {
    it('检测并阻止 constructor 字段', () => {
      const input = {
        sessionId: 'test',
        toolName: 'Read',
        constructor: { prototype: {} }
      };

      expect(() => normalizeHookInput(input, 'permission-request')).toThrow(/Prototype pollution attempt blocked/);
    });

    it('检测并阻止 prototype 字段', () => {
      const input = {
        sessionId: 'test',
        toolName: 'Read',
        prototype: {}
      };

      expect(() => normalizeHookInput(input, 'permission-request')).toThrow(/Prototype pollution attempt blocked/);
    });

    it('__proto__ 被过滤但不抛出错误', () => {
      const input = {
        sessionId: 'test',
        toolName: 'Read',
        __proto__: { isAdmin: true }
      };

      const result = normalizeHookInput(input, 'permission-request');
      expect(result.sessionId).toBe('test');
      expect(result.toolName).toBe('Read');
    });
  });

  describe('类型验证', () => {
    it('sessionId 必须是字符串', () => {
      const input = {
        sessionId: 123,
        directory: '/test'
      };

      expect(() => normalizeHookInput(input, 'session-end')).toThrow(/Expected string/);
    });

    it('toolName 必须是字符串', () => {
      const input = {
        toolName: { exploit: true },
        sessionId: 'test'
      };

      expect(() => normalizeHookInput(input, 'permission-request')).toThrow(/Expected string/);
    });
  });

  describe('必需字段验证', () => {
    it('session-end 需要 sessionId 和 directory', () => {
      const input = { sessionId: 'test' };
      expect(() => normalizeHookInput(input, 'session-end')).toThrow(/Missing required keys.*directory/);
    });

    it('permission-request 需要 toolName', () => {
      const input = { sessionId: 'test' };
      expect(() => normalizeHookInput(input, 'permission-request')).toThrow(/Missing required keys.*toolName/);
    });
  });
});
