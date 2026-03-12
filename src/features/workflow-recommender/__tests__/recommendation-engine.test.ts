import { describe, it, expect } from 'vitest';
import { getRecommendation } from './recommendation-engine.js.js';

describe('Recommendation Engine', () => {
  it('recommends security-reviewer for security context', () => {
    const rec = getRecommendation('feature-single', { hasSecurity: true });
    expect(rec.primary).toBe('security-reviewer');
    expect(rec.confidence).toBeGreaterThan(80);
  });

  it('recommends deep-executor for large scope', () => {
    const rec = getRecommendation('feature-single', { fileCount: 15 });
    expect(rec.primary).toBe('deep-executor');
  });

  it('recommends architect for architecture work', () => {
    const rec = getRecommendation('feature-single', { hasArchitecture: true });
    expect(rec.primary).toBe('architect');
  });

  it('recommends ultrawork for multiple features', () => {
    const rec = getRecommendation('feature-multiple', {});
    expect(rec.primary).toBe('ultrawork');
  });

  it('recommends debugger for bug fixes', () => {
    const rec = getRecommendation('bug-fix', {});
    expect(rec.primary).toBe('debugger');
  });

  it('recommends designer for UI work', () => {
    const rec = getRecommendation('feature-single', { hasUI: true });
    expect(rec.primary).toBe('designer');
  });

  it('recommends api-reviewer for API changes', () => {
    const rec = getRecommendation('feature-single', { hasAPI: true });
    expect(rec.primary).toBe('api-reviewer');
  });
});
