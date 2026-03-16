import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { acquireLock, releaseLock } from '../../src/security/concurrency-control';

const TEST_DIR = path.join(process.cwd(), '.omc-test-concurrent');
const TEST_FILE = path.join(TEST_DIR, 'subagent-tracking.json');

interface TrackingData {
  sessions: Record<string, { count: number; timestamp: number }>;
}

async function writeSession(sessionId: string, count: number): Promise<void> {
  const lock = await acquireLock(TEST_FILE, 5000);
  try {
    let data: TrackingData = { sessions: {} };
    try {
      const content = await fs.readFile(TEST_FILE, 'utf-8');
      data = JSON.parse(content);
    } catch {}

    data.sessions[sessionId] = { count, timestamp: Date.now() };
    await fs.writeFile(TEST_FILE, JSON.stringify(data, null, 2));
  } finally {
    await releaseLock(lock);
  }
}

describe('Concurrent Write Pressure Test', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.writeFile(TEST_FILE, JSON.stringify({ sessions: {} }));
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should handle 10 concurrent writes without data loss', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => `session-${i}`);

    await Promise.all(
      sessions.map((id, idx) => writeSession(id, idx + 1))
    );

    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const data: TrackingData = JSON.parse(content);

    expect(Object.keys(data.sessions)).toHaveLength(10);
    sessions.forEach((id, idx) => {
      expect(data.sessions[id]).toBeDefined();
      expect(data.sessions[id].count).toBe(idx + 1);
    });
  });

  it('should not corrupt JSON structure under concurrent load', async () => {
    const writes = Array.from({ length: 20 }, (_, i) =>
      writeSession(`session-${i % 5}`, i)
    );

    await Promise.all(writes);

    const content = await fs.readFile(TEST_FILE, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();

    const data: TrackingData = JSON.parse(content);
    expect(data.sessions).toBeDefined();
    expect(typeof data.sessions).toBe('object');
  });

  it('should timeout and degrade gracefully when lock unavailable', async () => {
    const longLock = await acquireLock(TEST_FILE, 10000);

    const shortWrite = writeSession('timeout-test', 1);

    await expect(shortWrite).rejects.toThrow();

    await releaseLock(longLock);
  });

  it('should maintain data integrity with rapid sequential writes', async () => {
    for (let i = 0; i < 50; i++) {
      await writeSession(`rapid-${i % 10}`, i);
    }

    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const data: TrackingData = JSON.parse(content);

    expect(Object.keys(data.sessions).length).toBeGreaterThan(0);
    expect(Object.keys(data.sessions).length).toBeLessThanOrEqual(10);
  });
});
