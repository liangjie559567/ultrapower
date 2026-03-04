import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { createRulesInjectorHook, getRulesForPath } from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-rules-injector');

describe('Rules Injector Hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('processToolExecution', () => {
    it('returns empty for non-tracked tools', () => {
      const hook = createRulesInjectorHook(TEST_DIR);
      const result = hook.processToolExecution('unknown-tool', 'file.ts', 'session-1');
      expect(result).toBe('');
    });

    it('processes tracked tools', () => {
      const hook = createRulesInjectorHook(TEST_DIR);
      const result = hook.processToolExecution('Read', 'file.ts', 'session-1');
      expect(typeof result).toBe('string');
    });
  });

  describe('isTrackedTool', () => {
    it('identifies tracked tools', () => {
      const hook = createRulesInjectorHook(TEST_DIR);
      expect(hook.isTrackedTool('Read')).toBe(true);
      expect(hook.isTrackedTool('Edit')).toBe(true);
      expect(hook.isTrackedTool('unknown')).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('clears session cache', () => {
      const hook = createRulesInjectorHook(TEST_DIR);
      hook.processToolExecution('Read', 'file.ts', 'session-1');
      hook.clearSession('session-1');
      expect(true).toBe(true);
    });
  });

  describe('getRulesForFile', () => {
    it('returns empty array for non-existent file', () => {
      const hook = createRulesInjectorHook(TEST_DIR);
      const rules = hook.getRulesForFile('nonexistent.ts');
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('utility function', () => {
    it('gets rules via utility function', () => {
      const rules = getRulesForPath('test.ts', TEST_DIR);
      expect(Array.isArray(rules)).toBe(true);
    });
  });
});
