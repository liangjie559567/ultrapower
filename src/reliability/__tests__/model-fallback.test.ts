import { describe, it, expect } from 'vitest';
import { ModelFallback, type ModelTier } from '../model-fallback.js';

describe('ModelFallback', () => {
  it('should succeed with initial model', async () => {
    const mf = new ModelFallback({ initialModel: 'opus' });
    const result = await mf.execute(async (model) => `result-${model}`);

    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('opus');
    expect(result.fallbackCount).toBe(0);
  });

  it('should fallback to next model on failure', async () => {
    const mf = new ModelFallback({ initialModel: 'opus' });
    let attempts = 0;

    const result = await mf.execute(async (model) => {
      attempts++;
      if (model === 'opus') throw new Error('opus fail');
      return `success-${model}`;
    });

    expect(result.success).toBe(true);
    expect(result.modelUsed).toBe('sonnet');
    expect(result.fallbackCount).toBe(1);
  });

  it('should fail after all models exhausted', async () => {
    const mf = new ModelFallback({ initialModel: 'opus' });

    const result = await mf.execute(async () => {
      throw new Error('all fail');
    });

    expect(result.success).toBe(false);
    expect(result.fallbackCount).toBe(2);
  });

  it('should not fallback when disabled', async () => {
    const mf = new ModelFallback({ initialModel: 'opus', enableFallback: false });

    const result = await mf.execute(async () => {
      throw new Error('fail');
    });

    expect(result.success).toBe(false);
    expect(result.fallbackCount).toBe(0);
  });

  it('should allow model switching', () => {
    const mf = new ModelFallback({ initialModel: 'opus' });
    mf.setModel('haiku');
    expect(mf.getModel()).toBe('haiku');
  });
});
