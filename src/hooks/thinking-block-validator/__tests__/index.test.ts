import { describe, it, expect } from 'vitest';
import { isExtendedThinkingModel, hasContentParts } from '../index.js';

describe('thinking-block-validator hook', () => {
  it('should detect extended thinking models', () => {
    expect(isExtendedThinkingModel('claude-sonnet-4')).toBe(true);
    expect(isExtendedThinkingModel('claude-opus-4')).toBe(true);
    expect(isExtendedThinkingModel('gpt-4')).toBe(false);
  });

  it('should detect content parts', () => {
    expect(hasContentParts([{ type: 'text', text: 'test' }])).toBe(true);
    expect(hasContentParts([])).toBe(false);
  });

  it('should handle model with thinking suffix', () => {
    expect(isExtendedThinkingModel('model-thinking')).toBe(true);
    expect(isExtendedThinkingModel('model-high')).toBe(true);
  });
});
