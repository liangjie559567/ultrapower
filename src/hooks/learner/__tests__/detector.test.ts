import { describe, it, expect } from 'vitest';
import { detectExtractableMoment, shouldPromptExtraction, generateExtractionPrompt } from '../detector.js';

describe('Extractable Moment Detector', () => {
  describe('detectExtractableMoment', () => {
    it('detects problem-solution pattern in English', () => {
      const message = 'The issue was caused by missing await. Fixed this by adding async/await.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('problem-solution');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('detects problem-solution pattern in Chinese', () => {
      const message = '问题是由于缺少 await 导致的。解决方案是添加 async/await。';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('problem-solution');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });

    it('detects technique pattern', () => {
      const message = 'A better way to handle this is using React hooks instead of class components.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('technique');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    it('detects workaround pattern', () => {
      const message = 'As a workaround, you can temporarily disable the validation until the API is fixed.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('workaround');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('detects optimization pattern', () => {
      const message = 'For better performance, optimize by using memoization with useMemo.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('optimization');
      expect(result.confidence).toBeGreaterThanOrEqual(65);
    });

    it('detects best-practice pattern', () => {
      const message = 'Best practice is to always validate user input before processing.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('best-practice');
      expect(result.confidence).toBeGreaterThanOrEqual(75);
    });

    it('returns no detection for generic message', () => {
      const message = 'Hello, how are you today?';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.suggestedTriggers).toEqual([]);
    });

    it('extracts trigger keywords from message', () => {
      const message = 'The solution is to fix the React authentication error by using JWT tokens.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.suggestedTriggers).toContain('react');
      expect(result.suggestedTriggers).toContain('authentication');
    });

    it('boosts confidence with multiple triggers', () => {
      const messageWithoutTriggers = 'The solution is to use a different approach.';
      const messageWithTriggers = 'The solution is to use React hooks with TypeScript for better performance.';

      const result1 = detectExtractableMoment(messageWithoutTriggers);
      const result2 = detectExtractableMoment(messageWithTriggers);

      expect(result2.confidence).toBeGreaterThan(result1.confidence);
    });

    it('limits suggested triggers to 5', () => {
      const message = 'Fixed React TypeScript API authentication error using Node.js with GraphQL and testing.';
      const result = detectExtractableMoment(message);

      expect(result.suggestedTriggers.length).toBeLessThanOrEqual(5);
    });

    it('combines user and assistant messages', () => {
      const userMessage = 'How do I fix this React error?';
      const assistantMessage = 'The solution is to add error handling.';
      const result = detectExtractableMoment(assistantMessage, userMessage);

      expect(result.detected).toBe(true);
      expect(result.suggestedTriggers).toContain('react');
    });

    it('selects highest confidence pattern', () => {
      const message = 'The issue was caused by missing validation. Best practice is to always validate.';
      const result = detectExtractableMoment(message);

      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('problem-solution');
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe('shouldPromptExtraction', () => {
    it('returns true when confidence meets threshold', () => {
      const detection = {
        detected: true,
        confidence: 70,
        patternType: 'technique' as const,
        suggestedTriggers: ['react'],
        reason: 'Test',
      };

      expect(shouldPromptExtraction(detection, 60)).toBe(true);
    });

    it('returns false when confidence below threshold', () => {
      const detection = {
        detected: true,
        confidence: 50,
        patternType: 'technique' as const,
        suggestedTriggers: ['react'],
        reason: 'Test',
      };

      expect(shouldPromptExtraction(detection, 60)).toBe(false);
    });

    it('returns false when not detected', () => {
      const detection = {
        detected: false,
        confidence: 80,
        patternType: 'technique' as const,
        suggestedTriggers: [],
        reason: 'Test',
      };

      expect(shouldPromptExtraction(detection, 60)).toBe(false);
    });

    it('uses default threshold of 60', () => {
      const detection = {
        detected: true,
        confidence: 65,
        patternType: 'technique' as const,
        suggestedTriggers: ['react'],
        reason: 'Test',
      };

      expect(shouldPromptExtraction(detection)).toBe(true);
    });
  });

  describe('generateExtractionPrompt', () => {
    it('generates prompt for problem-solution', () => {
      const detection = {
        detected: true,
        confidence: 80,
        patternType: 'problem-solution' as const,
        suggestedTriggers: ['react', 'typescript'],
        reason: 'Test',
      };

      const prompt = generateExtractionPrompt(detection);

      expect(prompt).toContain('a problem and its solution');
      expect(prompt).toContain('80%');
      expect(prompt).toContain('react, typescript');
    });

    it('generates prompt for technique', () => {
      const detection = {
        detected: true,
        confidence: 70,
        patternType: 'technique' as const,
        suggestedTriggers: ['hooks'],
        reason: 'Test',
      };

      const prompt = generateExtractionPrompt(detection);

      expect(prompt).toContain('a useful technique');
      expect(prompt).toContain('70%');
      expect(prompt).toContain('hooks');
    });

    it('handles empty triggers', () => {
      const detection = {
        detected: true,
        confidence: 75,
        patternType: 'best-practice' as const,
        suggestedTriggers: [],
        reason: 'Test',
      };

      const prompt = generateExtractionPrompt(detection);

      expect(prompt).toContain('None detected');
    });
  });
});
