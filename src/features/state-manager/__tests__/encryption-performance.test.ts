import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptState, decryptState } from '../encryption.js';

describe('Encryption Performance', () => {
  const originalKey = process.env.OMC_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.OMC_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  });

  afterEach(() => {
    if (originalKey) {
      process.env.OMC_ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.OMC_ENCRYPTION_KEY;
    }
  });

  it('should encrypt in < 15ms', () => {
    const data = {
      mode: 'autopilot',
      active: true,
      phase: 'executing',
      tasks: Array(10).fill({ id: 'task', status: 'pending' })
    };

    const start = performance.now();
    encryptState(data);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(15);
  });

  it('should decrypt in < 15ms', () => {
    const data = {
      mode: 'autopilot',
      active: true,
      phase: 'executing',
      tasks: Array(10).fill({ id: 'task', status: 'pending' })
    };
    const encrypted = encryptState(data);

    const start = performance.now();
    decryptState(encrypted);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(15);
  });
});
