import { describe, it, expect } from 'vitest';
import { ModelFallback, ModelTier } from '../../src/reliability/model-fallback';

describe('ModelFallback', () => {
  it('should succeed with initial model', async () => {
    const fallback = new ModelFallback({ initialModel: 'opus' });
    const result = await fallback.execute(async (model) => {
      return `Success with ${model}`;
    });

    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('opus');
    expect(result.fallbackCount).toBe(0);
  });

  it('should fallback from opus to sonnet', async () => {
    const fallback = new ModelFallback({ initialModel: 'opus' });
    let attempts = 0;

    const result = await fallback.execute(async (model) => {
      attempts++;
      if (model === 'opus') {
        throw new Error('Opus failed');
      }
      return `Success with ${model}`;
    });

    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('sonnet');
    expect(result.fallbackCount).toBe(1);
  });

  it('should fallback through all models', async () => {
    const fallback = new ModelFallback({ initialModel: 'opus' });

    const result = await fallback.execute(async (model) => {
      if (model !== 'haiku') {
        throw new Error(`${model} failed`);
      }
      return `Success with ${model}`;
    });

    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('haiku');
    expect(result.fallbackCount).toBe(2);
  });

  it('should fail when all models fail', async () => {
    const fallback = new ModelFallback({ initialModel: 'opus' });

    const result = await fallback.execute(async () => {
      throw new Error('All models failed');
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('All models failed');
  });

  it('should not fallback when disabled', async () => {
    const fallback = new ModelFallback({
      initialModel: 'opus',
      enableFallback: false
    });

    const result = await fallback.execute(async (model) => {
      throw new Error(`${model} failed`);
    });

    expect(result.success).toBe(false);
    expect(result.fallbackCount).toBe(0);
  });
});
