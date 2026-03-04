import { describe, it, expect, beforeEach } from 'vitest';
import {
  isSpawnedPid,
  clearSpawnedPids,
  isGeminiRetryableError,
  GEMINI_DEFAULT_MODEL,
  GEMINI_YOLO
} from '../gemini-core.js';

describe('Gemini Core', () => {
  beforeEach(() => {
    clearSpawnedPids();
  });

  describe('PID tracking', () => {
    it('returns false for untracked PID', () => {
      expect(isSpawnedPid(12345)).toBe(false);
    });

    it('clears tracked PIDs', () => {
      clearSpawnedPids();
      expect(isSpawnedPid(99999)).toBe(false);
    });
  });

  describe('isGeminiRetryableError', () => {
    it('detects rate limit in stdout', () => {
      const result = isGeminiRetryableError('Error: quota exceeded');
      expect(result.isError).toBe(true);
      expect(result.type).toBe('rate_limit');
    });

    it('detects rate limit in stderr', () => {
      const result = isGeminiRetryableError('', '429 too many requests');
      expect(result.isError).toBe(true);
      expect(result.type).toBe('rate_limit');
    });

    it('detects model not found', () => {
      const result = isGeminiRetryableError('model_not_found: invalid-model');
      expect(result.isError).toBe(true);
      expect(result.type).toBe('model');
    });

    it('detects model not supported', () => {
      const result = isGeminiRetryableError('model is not supported');
      expect(result.isError).toBe(true);
      expect(result.type).toBe('model');
    });

    it('returns false for normal output', () => {
      const result = isGeminiRetryableError('Success');
      expect(result.isError).toBe(false);
      expect(result.type).toBe('none');
    });
  });

  describe('constants', () => {
    it('exports default model', () => {
      expect(typeof GEMINI_DEFAULT_MODEL).toBe('string');
      expect(GEMINI_DEFAULT_MODEL.length).toBeGreaterThan(0);
    });

    it('exports YOLO flag', () => {
      expect(typeof GEMINI_YOLO).toBe('boolean');
    });
  });
});
