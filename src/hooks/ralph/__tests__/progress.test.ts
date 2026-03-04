import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  initProgress,
  appendProgress,
  addPattern,
  readProgress,
  getPatterns,
  getRecentLearnings,
  getProgressContext,
  type ProgressEntry
} from '../progress.js';

const TEST_DIR = join(process.cwd(), '.test-ralph-progress');

describe('Ralph Progress', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('Initialization', () => {
    it('creates progress file', () => {
      const result = initProgress(TEST_DIR);
      expect(result).toBe(true);

      const progress = readProgress(TEST_DIR);
      expect(progress).not.toBeNull();
      expect(progress?.entries).toEqual([]);
    });
  });

  describe('Progress Entries', () => {
    it('appends progress entry', () => {
      initProgress(TEST_DIR);

      const entry: ProgressEntry = {
        timestamp: new Date().toISOString(),
        storyId: 'US-001',
        implementation: ['Added feature X'],
        filesChanged: ['src/file.ts'],
        learnings: ['Pattern Y works well']
      };

      const result = appendProgress(TEST_DIR, entry);
      expect(result).toBe(true);

      const progress = readProgress(TEST_DIR);
      expect(progress?.entries).toHaveLength(1);
      expect(progress?.entries[0].storyId).toBe('US-001');
    });
  });

  describe('Patterns', () => {
    it('adds codebase pattern', () => {
      initProgress(TEST_DIR);

      const result = addPattern(TEST_DIR, 'Use factory pattern for services');
      expect(result).toBe(true);

      const patterns = getPatterns(TEST_DIR);
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toContain('factory pattern');
    });
  });

  describe('Context Retrieval', () => {
    it('retrieves recent learnings', () => {
      initProgress(TEST_DIR);

      appendProgress(TEST_DIR, {
        timestamp: new Date().toISOString(),
        storyId: 'US-001',
        implementation: ['Feature'],
        filesChanged: ['file.ts'],
        learnings: ['Learning 1', 'Learning 2']
      });

      const learnings = getRecentLearnings(TEST_DIR, 5);
      expect(learnings).toHaveLength(2);
    });

    it('returns empty array when no progress file', () => {
      const learnings = getRecentLearnings(TEST_DIR, 5);
      expect(learnings).toEqual([]);
    });

    it('returns empty array when no patterns', () => {
      initProgress(TEST_DIR);
      const patterns = getPatterns(TEST_DIR);
      expect(patterns).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('returns null when reading non-existent progress', () => {
      expect(readProgress(TEST_DIR)).toBeNull();
    });

    it('auto-creates file on append without init', () => {
      const entry = {
        timestamp: new Date().toISOString(),
        storyId: 'US-001',
        implementation: ['Feature'],
        filesChanged: ['file.ts'],
        learnings: ['Learning']
      };

      const result = appendProgress(TEST_DIR, entry);
      expect(result).toBe(true);

      const progress = readProgress(TEST_DIR);
      expect(progress?.entries).toHaveLength(1);
    });

    it('auto-creates file on pattern add without init', () => {
      const result = addPattern(TEST_DIR, 'pattern');
      expect(result).toBe(true);

      const patterns = getPatterns(TEST_DIR);
      expect(patterns).toHaveLength(1);
    });
  });

  describe('Progress Context', () => {
    it('returns context with patterns and learnings', () => {
      initProgress(TEST_DIR);
      addPattern(TEST_DIR, 'Use factory pattern');
      appendProgress(TEST_DIR, {
        timestamp: new Date().toISOString(),
        storyId: 'US-001',
        implementation: ['Feature'],
        filesChanged: ['file.ts'],
        learnings: ['Learning 1']
      });

      const context = getProgressContext(TEST_DIR);
      expect(context).toContain('factory pattern');
      expect(context).toContain('Learning 1');
    });

    it('returns empty string when no progress data', () => {
      const context = getProgressContext(TEST_DIR);
      expect(context).toBe('');
    });
  });
});
