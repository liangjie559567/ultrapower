import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeSkill } from '../writer.js';
import type { SkillExtractionRequest } from '../types.js';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Skill Writer', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `writer-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('writeSkill', () => {
    it('writes skill with valid request', () => {
      const request: SkillExtractionRequest = {
        problem: 'Need to handle authentication properly',
        solution: 'Use JWT tokens with refresh mechanism and secure storage',
        triggers: ['auth', 'authentication'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'auth-skill');

      expect(result.success).toBe(true);
      expect(result.path).toContain('auth-skill');
      expect(existsSync(result.path!)).toBe(true);

      const content = readFileSync(result.path!, 'utf-8');
      expect(content).toContain('# Problem');
      expect(content).toContain('# Solution');
      expect(content).toContain('authentication properly');
    });


    it('rejects request with short problem', () => {
      const request: SkillExtractionRequest = {
        problem: 'short',
        solution: 'Valid solution text here with enough content',
        triggers: ['test'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'test-skill');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quality validation failed');
      expect(result.validation.valid).toBe(false);
    });

    it('rejects request with short solution', () => {
      const request: SkillExtractionRequest = {
        problem: 'Valid problem description here',
        solution: 'short',
        triggers: ['test'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'test-skill');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quality validation failed');
    });

    it('rejects request with missing triggers', () => {
      const request: SkillExtractionRequest = {
        problem: 'Valid problem description here',
        solution: 'Valid solution text here with enough content',
        triggers: [],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'test-skill');

      expect(result.success).toBe(false);
      expect(result.validation.valid).toBe(false);
    });

    it('detects duplicate skill files', () => {
      const request: SkillExtractionRequest = {
        problem: 'Need to handle authentication properly',
        solution: 'Use JWT tokens with refresh mechanism and secure storage',
        triggers: ['auth'],
        targetScope: 'project',
      };

      const result1 = writeSkill(request, testDir, 'auth-skill');
      expect(result1.success).toBe(true);

      const result2 = writeSkill(request, testDir, 'auth-skill');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('already exists');
    });

    it('sanitizes skill name in filename', () => {
      const request: SkillExtractionRequest = {
        problem: 'Need to handle authentication properly',
        solution: 'Use JWT tokens with refresh mechanism and secure storage',
        triggers: ['auth'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'Auth Skill!@#$%');

      expect(result.success).toBe(true);
      expect(result.path).toContain('auth-skill');
      expect(result.path).not.toContain('!');
      expect(result.path).not.toContain('@');
    });

    it('includes metadata in frontmatter', () => {
      const request: SkillExtractionRequest = {
        problem: 'Need to handle authentication properly',
        solution: 'Use JWT tokens with refresh mechanism and secure storage',
        triggers: ['auth', 'jwt'],
        tags: ['security', 'backend'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'auth-skill');

      expect(result.success).toBe(true);
      const content = readFileSync(result.path!, 'utf-8');
      expect(content).toContain('triggers:');
      expect(content).toContain('"auth"');
      expect(content).toContain('"jwt"');
      expect(content).toContain('tags:');
      expect(content).toContain('"security"');
    });

    it('truncates long descriptions', () => {
      const longProblem = 'A'.repeat(300);
      const request: SkillExtractionRequest = {
        problem: longProblem,
        solution: 'Valid solution text here with enough content',
        triggers: ['test'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, 'test-skill');

      expect(result.success).toBe(true);
      const content = readFileSync(result.path!, 'utf-8');
      const descMatch = content.match(/description: "(.+)"/);
      expect(descMatch).toBeDefined();
      expect(descMatch![1].length).toBeLessThanOrEqual(200);
    });

    it('handles very long skill names', () => {
      const longName = 'very-long-skill-name-that-exceeds-fifty-characters-limit-test';
      const request: SkillExtractionRequest = {
        problem: 'Need to handle authentication properly',
        solution: 'Use JWT tokens with refresh mechanism and secure storage',
        triggers: ['auth'],
        targetScope: 'project',
      };

      const result = writeSkill(request, testDir, longName);

      expect(result.success).toBe(true);
      const filename = result.path!.split(/[/\\]/).pop()!;
      expect(filename.length).toBeLessThanOrEqual(53); // 50 + '.md'
    });
  });
});
