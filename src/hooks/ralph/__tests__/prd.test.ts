import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import {
  readPrd,
  writePrd,
  findPrdPath,
  getPrdStatus,
  markStoryComplete,
  markStoryIncomplete,
  getStory,
  getNextStory,
  createSimplePrd,
  createPrd,
  formatPrdStatus,
  type PRD
} from '../prd.js';

const TEST_DIR = join(process.cwd(), '.test-ralph-prd');

describe('Ralph PRD', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('File Operations', () => {
    it('writes and reads PRD', () => {
      const prd: PRD = {
        project: 'test-project',
        branchName: 'feature/test',
        description: 'Test PRD',
        userStories: [
          {
            id: 'US-001',
            title: 'Test Story',
            description: 'As a user, I want to test',
            acceptanceCriteria: ['Criterion 1'],
            priority: 1,
            passes: false
          }
        ]
      };

      const written = writePrd(TEST_DIR, prd);
      expect(written).toBe(true);

      const read = readPrd(TEST_DIR);
      expect(read).toEqual(prd);
    });

    it('finds PRD in .omc directory', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      writePrd(TEST_DIR, prd);

      const found = findPrdPath(TEST_DIR);
      expect(found).toBe(join(TEST_DIR, '.omc', 'prd.json'));
    });
  });

  describe('PRD Status', () => {
    it('calculates status correctly', () => {
      const prd: PRD = {
        project: 'test',
        branchName: 'feature/test',
        description: 'Test',
        userStories: [
          { id: 'US-001', title: 'Story 1', description: 'Test', acceptanceCriteria: [], priority: 1, passes: true },
          { id: 'US-002', title: 'Story 2', description: 'Test', acceptanceCriteria: [], priority: 2, passes: false }
        ]
      };

      const status = getPrdStatus(prd);

      expect(status.total).toBe(2);
      expect(status.completed).toBe(1);
      expect(status.pending).toBe(1);
      expect(status.allComplete).toBe(false);
    });

    it('identifies next story by priority', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1', 'Task 2']);
      writePrd(TEST_DIR, prd);

      const next = getNextStory(TEST_DIR);
      expect(next?.priority).toBe(1);
    });
  });

  describe('Story Management', () => {
    it('marks story as complete', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      writePrd(TEST_DIR, prd);

      const result = markStoryComplete(TEST_DIR, 'US-001', 'Completed successfully');
      expect(result).toBe(true);

      const updated = readPrd(TEST_DIR);
      expect(updated?.userStories[0].passes).toBe(true);
      expect(updated?.userStories[0].notes).toBe('Completed successfully');
    });

    it('marks story as incomplete', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      prd.userStories[0].passes = true;
      writePrd(TEST_DIR, prd);

      const result = markStoryIncomplete(TEST_DIR, 'US-001', 'Needs rework');
      expect(result).toBe(true);

      const updated = readPrd(TEST_DIR);
      expect(updated?.userStories[0].passes).toBe(false);
      expect(updated?.userStories[0].notes).toBe('Needs rework');
    });

    it('gets story by id', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      writePrd(TEST_DIR, prd);

      const story = getStory(TEST_DIR, 'US-001');
      expect(story).not.toBeNull();
      expect(story?.id).toBe('US-001');
    });

    it('returns null for non-existent story', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      writePrd(TEST_DIR, prd);

      expect(getStory(TEST_DIR, 'US-999')).toBeNull();
    });

    it('returns false when PRD not found', () => {
      const result = markStoryComplete(TEST_DIR, 'US-001', 'note');
      expect(result).toBe(false);
    });

    it('returns false when story not found', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      writePrd(TEST_DIR, prd);

      const result = markStoryComplete(TEST_DIR, 'US-999', 'note');
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('returns null when reading non-existent PRD', () => {
      expect(readPrd(TEST_DIR)).toBeNull();
    });

    it('returns null when finding path for non-existent PRD', () => {
      expect(findPrdPath(TEST_DIR)).toBeNull();
    });

    it('returns null for next story when no PRD', () => {
      expect(getNextStory(TEST_DIR)).toBeNull();
    });

    it('handles all stories complete', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      prd.userStories[0].passes = true;
      writePrd(TEST_DIR, prd);

      const status = getPrdStatus(prd);
      expect(status.allComplete).toBe(true);
      expect(status.nextStory).toBeNull();
    });
  });

  describe('PRD Creation', () => {
    it('creates multi-story PRD with custom priorities', () => {
      const prd = createPrd('test', 'feature/multi', 'Multi-story feature', [
        { id: 'US-001', title: 'Story 1', description: 'First', acceptanceCriteria: ['AC1'], priority: 2 },
        { id: 'US-002', title: 'Story 2', description: 'Second', acceptanceCriteria: ['AC2'], priority: 1 }
      ]);

      expect(prd.userStories).toHaveLength(2);
      expect(prd.userStories[0].priority).toBe(2);
      expect(prd.userStories[1].priority).toBe(1);
      expect(prd.userStories[0].passes).toBe(false);
    });

    it('auto-assigns priorities when not specified', () => {
      const prd = createPrd('test', 'feature/auto', 'Auto priority', [
        { id: 'US-001', title: 'Story 1', description: 'First', acceptanceCriteria: [] },
        { id: 'US-002', title: 'Story 2', description: 'Second', acceptanceCriteria: [] }
      ]);

      expect(prd.userStories[0].priority).toBe(1);
      expect(prd.userStories[1].priority).toBe(2);
    });

    it('handles corrupted PRD file', () => {
      const omcDir = join(TEST_DIR, '.omc');
      mkdirSync(omcDir, { recursive: true });
      require('fs').writeFileSync(join(omcDir, 'prd.json'), 'invalid json');

      expect(readPrd(TEST_DIR)).toBeNull();
    });

    it('validates PRD structure', () => {
      const omcDir = join(TEST_DIR, '.omc');
      mkdirSync(omcDir, { recursive: true });
      require('fs').writeFileSync(join(omcDir, 'prd.json'), JSON.stringify({ project: 'test' }));

      expect(readPrd(TEST_DIR)).toBeNull();
    });

    it('rejects PRD with invalid userStories', () => {
      const omcDir = join(TEST_DIR, '.omc');
      mkdirSync(omcDir, { recursive: true });
      require('fs').writeFileSync(join(omcDir, 'prd.json'), JSON.stringify({
        project: 'test',
        branchName: 'feature/test',
        description: 'Test',
        userStories: 'not-an-array'
      }));

      expect(readPrd(TEST_DIR)).toBeNull();
    });
  });

  describe('Formatting', () => {
    it('formats PRD status when all complete', () => {
      const prd = createSimplePrd('test', 'feature/test', ['Task 1']);
      prd.userStories[0].passes = true;
      const status = getPrdStatus(prd);

      const formatted = formatPrdStatus(status);
      expect(formatted).toContain('[PRD Status: 1/1 stories complete]');
      expect(formatted).toContain('All stories are COMPLETE');
    });

    it('formats PRD status with remaining stories', () => {
      const prd = createPrd('test', 'feature/test', 'Test feature', [
        { id: 'US-001', title: 'Task 1', description: 'First', acceptanceCriteria: ['AC1'] },
        { id: 'US-002', title: 'Task 2', description: 'Second', acceptanceCriteria: ['AC2'] }
      ]);
      prd.userStories[0].passes = true;
      const status = getPrdStatus(prd);

      const formatted = formatPrdStatus(status);
      expect(formatted).toContain('[PRD Status: 1/2 stories complete]');
      expect(formatted).toContain('Remaining');
      expect(formatted).toContain('US-002');
    });
  });
});
