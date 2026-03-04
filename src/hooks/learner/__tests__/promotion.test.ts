import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getRecentPromotions, getPromotionCandidates, promoteLearning, listPromotableLearnings } from '../promotion.js';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Skill Promotion', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `promotion-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getRecentPromotions', () => {
    it('returns empty array when pattern library does not exist', async () => {
      const results = await getRecentPromotions(7, testDir);
      expect(results).toEqual([]);
    });

    it('returns empty array when no active patterns', async () => {
      const axiomDir = join(testDir, '.omc', 'axiom', 'evolution');
      mkdirSync(axiomDir, { recursive: true });
      writeFileSync(join(axiomDir, 'pattern_library.md'), '# Pattern Library\n\n## Patterns\n');

      const results = await getRecentPromotions(7, testDir);
      expect(results).toEqual([]);
    });

    it('returns recent promotions within date range', async () => {
      const axiomDir = join(testDir, '.omc', 'axiom', 'evolution');
      mkdirSync(axiomDir, { recursive: true });

      const content = `# Pattern Library

| ID | Name | Category | Occurrences | Confidence | Status |
|----|------|----------|-------------|------------|--------|
| pattern-1 | Recent Pattern | test | 5 | 0.9 | active |
| pattern-2 | Old Pattern | test | 3 | 0.8 | inactive |
`;
      writeFileSync(join(axiomDir, 'pattern_library.md'), content);

      const results = await getRecentPromotions(7, testDir);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Recent Pattern');
    });
  });

  describe('getPromotionCandidates', () => {
    it('returns empty array when progress file does not exist', () => {
      const results = getPromotionCandidates(testDir);
      expect(results).toEqual([]);
    });

    it('filters out short learnings', () => {
      const omcDir = join(testDir, '.omc');
      mkdirSync(omcDir, { recursive: true });

      const content = `## [2026-03-03T10:00:00Z] - TEST-001

- Implemented feature

Files Changed:
- src/test.ts

Learnings:
- short
- This is a valid learning with enough content to pass the filter

---
`;
      writeFileSync(join(omcDir, 'progress.txt'), content);

      const results = getPromotionCandidates(testDir);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].learning).toContain('valid learning');
    });

    it('sorts by trigger count', () => {
      const omcDir = join(testDir, '.omc');
      mkdirSync(omcDir, { recursive: true });

      const content = `## [2026-03-03T10:00:00Z] - TEST-001

- Implemented features

Files Changed:
- src/test.ts

Learnings:
- Simple learning without any technical keywords here
- Learning with react and typescript keywords
- Learning with react, typescript, and api keywords

---
`;
      writeFileSync(join(omcDir, 'progress.txt'), content);

      const results = getPromotionCandidates(testDir);
      expect(results.length).toBeGreaterThan(0);
      if (results.length > 1) {
        expect(results[0].suggestedTriggers.length).toBeGreaterThanOrEqual(results[1].suggestedTriggers.length);
      }
    });

    it('respects limit parameter', () => {
      const ralphDir = join(testDir, '.omc', 'ralph');
      mkdirSync(ralphDir, { recursive: true });

      const learnings = Array.from({ length: 20 }, (_, i) =>
        `- Learning ${i} with react and typescript keywords`
      ).join('\n');

      const content = `# Progress\n\n## Learnings\n\n${learnings}`;
      writeFileSync(join(ralphDir, 'ralph-progress.md'), content);

      const results = getPromotionCandidates(testDir, 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('promoteLearning', () => {
    it('creates skill with correct structure', () => {
      const candidate = {
        learning: 'Use react hooks for state management',
        storyId: 'TEST-001',
        timestamp: '2026-03-03T10:00:00Z',
        suggestedTriggers: ['react', 'state'],
      };

      const result = promoteLearning(
        candidate,
        'react-hooks-skill',
        ['hooks'],
        'project',
        testDir
      );

      expect(result.success).toBe(true);
      expect(result.path).toContain('react-hooks-skill');
    });
  });

  describe('listPromotableLearnings', () => {
    it('returns empty message when no candidates', () => {
      const result = listPromotableLearnings(testDir);
      expect(result).toContain('No promotion candidates found');
    });

    it('formats candidates as markdown', () => {
      const omcDir = join(testDir, '.omc');
      mkdirSync(omcDir, { recursive: true });

      const content = `## [2026-03-03T10:00:00Z] - TEST-001

- Implemented features

Files Changed:
- src/test.ts

Learnings:
- Learning with react and typescript keywords for testing

---
`;
      writeFileSync(join(omcDir, 'progress.txt'), content);

      const result = listPromotableLearnings(testDir);
      expect(result).toContain('Promotion Candidates');
      expect(result).toContain('react');
      expect(result).toContain('typescript');
    });
  });
});
