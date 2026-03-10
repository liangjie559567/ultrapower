import { beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(async () => {
  vi.clearAllTimers();
  await new Promise(resolve => setImmediate(resolve));
});
