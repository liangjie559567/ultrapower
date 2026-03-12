/**
 * Spec Kit Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { shouldUseSpecKit, getSpecKitCommand } from '../index.js';
import { getNextSpecKitStep } from '../router.js';
import { analyzeSpecKitFit } from '../recommender.js';

describe('Spec Kit Integration', () => {
  it('should detect spec kit keywords', () => {
    expect(shouldUseSpecKit('create a constitution')).toBe(true);
    expect(shouldUseSpecKit('write a specification')).toBe(true);
    expect(shouldUseSpecKit('fix a bug')).toBe(false);
  });

  it('should get correct command path', () => {
    const path = getSpecKitCommand('constitution');
    expect(path).toBe('.claude/commands/speckit.constitution.md');
  });

  it('should route workflow correctly', () => {
    const next = getNextSpecKitStep('start');
    expect(next?.stage).toBe('constitution');
    expect(next?.nextCommand).toBe('/speckit.constitution');
  });

  it('should analyze spec kit fit', () => {
    const result = analyzeSpecKitFit('create constitution', {});
    expect(result.useSpecKit).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
