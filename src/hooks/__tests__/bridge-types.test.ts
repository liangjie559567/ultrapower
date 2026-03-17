/**
 * Type guard tests for bridge-types.ts
 */

import { describe, it, expect } from 'vitest';
import {
  isHookType,
  isHookInput,
  isHookOutput,
  isString,
  isObject,
  type HookType,
} from '../bridge-types.js';

describe('Type Guards', () => {
  describe('isHookType', () => {
    it('should return true for valid hook types', () => {
      expect(isHookType('permission-request')).toBe(true);
      expect(isHookType('session-end')).toBe(true);
      expect(isHookType('pre-tool-use')).toBe(true);
    });

    it('should return false for invalid hook types', () => {
      expect(isHookType('invalid-hook')).toBe(false);
      expect(isHookType('')).toBe(false);
      expect(isHookType(123)).toBe(false);
      expect(isHookType(null)).toBe(false);
      expect(isHookType(undefined)).toBe(false);
    });
  });

  describe('isHookInput', () => {
    it('should return true for valid objects', () => {
      expect(isHookInput({})).toBe(true);
      expect(isHookInput({ sessionId: 'test' })).toBe(true);
      expect(isHookInput({ toolName: 'test', toolInput: {} })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isHookInput(null)).toBe(false);
      expect(isHookInput(undefined)).toBe(false);
      expect(isHookInput('string')).toBe(false);
      expect(isHookInput(123)).toBe(false);
      expect(isHookInput([])).toBe(false);
    });
  });

  describe('isHookOutput', () => {
    it('should return true for valid HookOutput', () => {
      expect(isHookOutput({ continue: true })).toBe(true);
      expect(isHookOutput({ continue: false, message: 'test' })).toBe(true);
      expect(isHookOutput({ continue: true, reason: 'blocked' })).toBe(true);
    });

    it('should return false for invalid HookOutput', () => {
      expect(isHookOutput({})).toBe(false);
      expect(isHookOutput({ continue: 'yes' })).toBe(false);
      expect(isHookOutput(null)).toBe(false);
      expect(isHookOutput(undefined)).toBe(false);
      expect(isHookOutput('string')).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('test')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString('123')).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject({ nested: { obj: true } })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });
});
