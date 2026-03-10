import { describe, it, expect } from 'vitest';
import { RetryClassifier, OperationType } from '../../src/reliability/retry-classifier';
import { RetryManager } from '../../src/reliability/retry-manager';

describe('RetryClassifier', () => {
  it('classifies non-idempotent operations', () => {
    expect(RetryClassifier.isRetryable('createUser')).toBe(false);
    expect(RetryClassifier.isRetryable('insertRecord')).toBe(false);
    expect(RetryClassifier.isRetryable('sendEmail')).toBe(false);
  });

  it('classifies idempotent operations', () => {
    expect(RetryClassifier.isRetryable('getUser')).toBe(true);
    expect(RetryClassifier.isRetryable('updateUser')).toBe(true);
    expect(RetryClassifier.isRetryable('deleteUser')).toBe(true);
  });

  it('defaults to non-retryable for unknown operations', () => {
    expect(RetryClassifier.isRetryable('unknownOp')).toBe(false);
  });

  it('returns correct metadata', () => {
    const metadata = RetryClassifier.classify('createUser');
    expect(metadata.type).toBe(OperationType.NON_IDEMPOTENT_WRITE);
    expect(metadata.retryable).toBe(false);
  });

  it('integrates with RetryManager to skip non-idempotent retries', async () => {
    let attempts = 0;
    const manager = new RetryManager({ operation: 'createUser', maxRetries: 3 });
    const result = await manager.execute(async () => {
      attempts++;
      throw new Error('fail');
    });
    expect(result.success).toBe(false);
    expect(attempts).toBe(1);
  });

  it('integrates with RetryManager to allow idempotent retries', async () => {
    let attempts = 0;
    const manager = new RetryManager({ operation: 'getUser', maxRetries: 2, baseDelay: 10 });
    const result = await manager.execute(async () => {
      attempts++;
      throw new Error('fail');
    });
    expect(result.success).toBe(false);
    expect(attempts).toBe(3);
  });
});
