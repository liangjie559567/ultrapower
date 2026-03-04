import { describe, it, expect } from 'vitest';
import { matchSkills, fuzzyMatch, extractContext, calculateConfidence } from '../matcher.js';
import type { SkillInput } from '../types.js';

describe('Skill Matcher', () => {
  describe('matchSkills', () => {
    const skills: SkillInput[] = [
      { id: '1', name: 'auth-skill', triggers: ['auth', 'authentication', 'login'] },
      { id: '2', name: 'test-skill', triggers: ['test', 'testing', 'tdd'] },
      { id: '3', name: 'api-skill', triggers: ['api', 'rest', 'graphql'] },
    ];

    it('returns empty array for empty prompt', () => {
      const results = matchSkills('', skills);
      expect(results).toEqual([]);
    });

    it('matches exact trigger', () => {
      const results = matchSkills('auth', skills);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].skillId).toBe('1');
      expect(results[0].confidence).toBeGreaterThan(0);
    });

    it('matches pattern with wildcard', () => {
      const results = matchSkills('auth*', skills);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].skillId).toBe('1');
    });

    it('performs fuzzy matching', () => {
      const results = matchSkills('authen', skills);
      expect(results.length).toBeGreaterThan(0);
    });

    it('respects threshold option', () => {
      const results = matchSkills('xyz', skills, { threshold: 90 });
      expect(results.length).toBe(0);
    });

    it('respects maxResults option', () => {
      const results = matchSkills('test', skills, { maxResults: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('sorts results by confidence', () => {
      const results = matchSkills('auth', skills);
      if (results.length > 1) {
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].confidence).toBeGreaterThanOrEqual(results[i + 1].confidence);
        }
      }
    });
  });

  describe('fuzzyMatch', () => {
    it('returns 0 for empty inputs', () => {
      expect(fuzzyMatch('', '')).toBe(0);
      expect(fuzzyMatch('test', '')).toBe(0);
      expect(fuzzyMatch('', 'test')).toBe(0);
    });

    it('returns 100 for exact match', () => {
      expect(fuzzyMatch('test', 'test')).toBe(100);
    });

    it('returns 80 for substring match', () => {
      expect(fuzzyMatch('authentication', 'auth')).toBe(80);
    });

    it('calculates Levenshtein distance', () => {
      const score = fuzzyMatch('testing', 'test');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('extractContext', () => {
    it('detects error keywords', () => {
      const context = extractContext('Error: something went wrong');
      expect(context.detectedErrors.length).toBeGreaterThan(0);
    });

    it('detects error patterns', () => {
      const context = extractContext('TypeError occurred');
      expect(context.detectedErrors.length).toBeGreaterThan(0);
    });

    it('detects file paths', () => {
      const context = extractContext('Check src/index.ts file');
      expect(context.detectedFiles.length).toBeGreaterThan(0);
    });

    it('detects code patterns', () => {
      const context = extractContext('Use async/await for promises');
      expect(context.detectedPatterns.length).toBeGreaterThan(0);
    });

    it('returns empty arrays for no matches', () => {
      const context = extractContext('simple text');
      expect(context.detectedErrors).toEqual([]);
      expect(context.detectedFiles).toEqual([]);
      expect(context.detectedPatterns).toEqual([]);
    });
  });

  describe('calculateConfidence', () => {
    it('returns 0 for zero total', () => {
      expect(calculateConfidence(0, 0, 'exact')).toBe(0);
    });

    it('applies exact match multiplier', () => {
      const score = calculateConfidence(5, 5, 'exact');
      expect(score).toBe(100);
    });

    it('applies pattern match multiplier', () => {
      const score = calculateConfidence(5, 5, 'pattern');
      expect(score).toBe(90);
    });

    it('applies semantic match multiplier', () => {
      const score = calculateConfidence(5, 5, 'semantic');
      expect(score).toBe(80);
    });

    it('applies fuzzy match multiplier', () => {
      const score = calculateConfidence(5, 5, 'fuzzy');
      expect(score).toBe(70);
    });

    it('clamps score to 100', () => {
      const score = calculateConfidence(10, 5, 'exact');
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
