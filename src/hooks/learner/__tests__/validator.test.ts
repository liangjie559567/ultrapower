import { describe, it, expect } from 'vitest';
import { validateExtractionRequest, validateSkillMetadata } from '../validator.js';
import type { SkillExtractionRequest, SkillMetadata } from '../types.js';

describe('Skill Validator', () => {
  describe('validateExtractionRequest', () => {
    it('validates complete valid request', () => {
      const request: SkillExtractionRequest = {
        problem: 'Need to handle authentication',
        solution: 'Use JWT tokens with refresh mechanism',
        triggers: ['auth', 'authentication', 'login'],
      };

      const result = validateExtractionRequest(request);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.score).toBe(100);
    });

    it('rejects request with short problem', () => {
      const request: SkillExtractionRequest = {
        problem: 'short',
        solution: 'Valid solution text here',
        triggers: ['test'],
      };

      const result = validateExtractionRequest(request);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('problem (minimum 10 characters)');
      expect(result.score).toBe(70);
    });

    it('rejects request with short solution', () => {
      const request: SkillExtractionRequest = {
        problem: 'Valid problem description',
        solution: 'short',
        triggers: ['test'],
      };

      const result = validateExtractionRequest(request);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('solution (minimum 20 characters)');
      expect(result.score).toBe(70);
    });

    it('rejects request with missing triggers', () => {
      const request: SkillExtractionRequest = {
        problem: 'Valid problem description',
        solution: 'Valid solution text here',
        triggers: [],
      };

      const result = validateExtractionRequest(request);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('triggers (at least one required)');
      expect(result.score).toBe(80);
    });

    it('warns about short triggers', () => {
      const request: SkillExtractionRequest = {
        problem: 'Valid problem description',
        solution: 'Valid solution text here',
        triggers: ['ab', 'test'],
      };

      const result = validateExtractionRequest(request);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Short triggers may cause false matches: ab');
      expect(result.score).toBe(95);
    });

    it('warns about generic triggers', () => {
      const request: SkillExtractionRequest = {
        problem: 'Valid problem description',
        solution: 'Valid solution text here',
        triggers: ['the', 'test'],
      };

      const result = validateExtractionRequest(request);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Generic triggers should be avoided: the');
      expect(result.score).toBe(90);
    });
  });

  describe('validateSkillMetadata', () => {
    it('validates complete valid metadata', () => {
      const metadata: SkillMetadata = {
        id: 'test-skill-123',
        name: 'test-skill',
        description: 'Test skill description',
        triggers: ['test', 'testing'],
        source: 'extracted',
        extractedAt: new Date().toISOString(),
      };

      const result = validateSkillMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
      expect(result.score).toBe(100);
    });

    it('rejects metadata with missing required fields', () => {
      const metadata: Partial<SkillMetadata> = {
        name: 'test-skill',
      };

      const result = validateSkillMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it('rejects metadata with empty triggers', () => {
      const metadata: Partial<SkillMetadata> = {
        id: 'test-123',
        name: 'test-skill',
        description: 'Test description',
        triggers: [],
        source: 'extracted',
      };

      const result = validateSkillMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('triggers (empty array)');
    });

    it('rejects metadata with invalid source', () => {
      const metadata: Partial<SkillMetadata> = {
        id: 'test-123',
        name: 'test-skill',
        description: 'Test description',
        triggers: ['test'],
        source: 'invalid' as any,
      };

      const result = validateSkillMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Invalid source value: invalid');
      expect(result.score).toBe(90);
    });
  });
});
