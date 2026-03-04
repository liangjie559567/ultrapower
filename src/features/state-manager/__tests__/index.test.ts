import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  isStateStale,
  createStateManager,
  getStatePath,
  ensureStateDir,
  clearStateCache,
  getLegacyPaths,
  listStates,
  cleanupWAL
} from '../index.js';

describe('State Manager - Core Functions', () => {
  describe('isStateStale', () => {
    it('detects stale state', () => {
      const now = Date.now();
      const oldTimestamp = new Date(now - 8 * 60 * 60 * 1000).toISOString();
      const result = isStateStale({ updatedAt: oldTimestamp }, now, 4 * 60 * 60 * 1000);
      expect(result).toBe(true);
    });

    it('detects fresh state', () => {
      const now = Date.now();
      const recentTimestamp = new Date(now - 1000).toISOString();
      const result = isStateStale({ updatedAt: recentTimestamp }, now, 4 * 60 * 60 * 1000);
      expect(result).toBe(false);
    });
  });

  describe('StateManager class', () => {
    it('creates instance', () => {
      const manager = createStateManager('test');
      expect(manager).toBeDefined();
    });
  });

  describe('getStatePath', () => {
    it('returns local path for local location', () => {
      const result = getStatePath('autopilot', 'local');
      expect(result).toContain('.omc');
      expect(result).toContain('autopilot');
    });

    it('returns global path for global location', () => {
      const result = getStatePath('autopilot', 'global');
      expect(result).toContain('.omc');
      expect(result).toContain('autopilot');
    });
  });

  describe('ensureStateDir', () => {
    it('creates directory without error', () => {
      expect(() => ensureStateDir('local')).not.toThrow();
    });
  });

  describe('clearStateCache', () => {
    it('clears cache without error', () => {
      expect(() => clearStateCache()).not.toThrow();
    });
  });

  describe('getLegacyPaths', () => {
    it('returns array of legacy paths', () => {
      const paths = getLegacyPaths('autopilot');
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('listStates', () => {
    it('returns array of state files', () => {
      const states = listStates();
      expect(Array.isArray(states)).toBe(true);
    });

    it('filters by location', () => {
      const states = listStates({ location: 'local' });
      expect(Array.isArray(states)).toBe(true);
    });
  });

  describe('cleanupWAL', () => {
    it('runs without error', () => {
      expect(() => cleanupWAL()).not.toThrow();
    });
  });
});
