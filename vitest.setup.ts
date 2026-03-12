import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  // Clear all timers before each test
  if (typeof globalThis.setTimeout !== 'undefined') {
    const timers = (globalThis as any).__vitest_timers__;
    if (timers) {
      timers.forEach((id: any) => clearTimeout(id));
    }
  }
});

afterEach(async () => {
  // Wait for any pending async operations
  await new Promise(resolve => setImmediate(resolve));

  // Force garbage collection of any lingering promises
  if (global.gc) {
    global.gc();
  }
});
