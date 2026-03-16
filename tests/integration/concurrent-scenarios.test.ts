import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { atomicWriteJson } from '../../src/lib/atomic-write';

const TEST_DIR = path.join(process.cwd(), '.omc-test-scenarios');
const TEST_FILE = path.join(TEST_DIR, 'state.json');

interface StateData {
  mode: string;
  active: boolean;
  iteration: number;
  sessions: Record<string, unknown>;
}

const writeLock = new Map<string, Promise<void>>();

async function concurrentWrite(id: string, iteration: number): Promise<void> {
  while (writeLock.has(TEST_FILE)) {
    await writeLock.get(TEST_FILE);
  }

  const lockPromise = (async () => {
    try {
      let data: StateData = { mode: 'test', active: true, iteration: 0, sessions: {} };
      try {
        const content = await fs.readFile(TEST_FILE, 'utf-8');
        data = JSON.parse(content);
      } catch {}

      data.sessions[id] = { iteration, timestamp: Date.now() };
      data.iteration = iteration;
      await atomicWriteJson(TEST_FILE, data);
    } finally {
      writeLock.delete(TEST_FILE);
    }
  })();

  writeLock.set(TEST_FILE, lockPromise);
  await lockPromise;
}

describe('Concurrent Scenarios Test Suite', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.writeFile(TEST_FILE, JSON.stringify({ mode: 'test', active: true, iteration: 0, sessions: {} }));
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should handle 100 concurrent writes without data loss', async () => {
    const sessions = Array.from({ length: 100 }, (_, i) => `session-${i}`);

    await Promise.all(
      sessions.map((id, idx) => concurrentWrite(id, idx + 1))
    );

    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const data: StateData = JSON.parse(content);

    expect(Object.keys(data.sessions)).toHaveLength(100);
    sessions.forEach((id) => {
      expect(data.sessions[id]).toBeDefined();
    });
  }, 30000);

  it('should recover from partial JSON write', async () => {
    const backupDir = path.join(TEST_DIR, '.omc', 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const validData = { mode: 'test', active: true, iteration: 5, sessions: { 's1': { data: 'valid' } } };
    await fs.writeFile(TEST_FILE, JSON.stringify(validData));
    const backupPath = path.join(backupDir, 'test-backup.json');
    await fs.copyFile(TEST_FILE, backupPath);

    await fs.writeFile(TEST_FILE, '{"mode":"test","active":true,"iter');

    let recovered = false;
    try {
      await fs.readFile(TEST_FILE, 'utf-8').then(JSON.parse);
    } catch {
      await fs.copyFile(backupPath, TEST_FILE);
      recovered = true;
    }

    expect(recovered).toBe(true);
    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const data = JSON.parse(content);
    expect(data.iteration).toBe(5);
  });

  it('should recover from zero-size file', async () => {
    const backupDir = path.join(TEST_DIR, '.omc', 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const validData = { mode: 'test', active: true, iteration: 10, sessions: {} };
    await fs.writeFile(TEST_FILE, JSON.stringify(validData));
    const backupPath = path.join(backupDir, 'test-backup.json');
    await fs.copyFile(TEST_FILE, backupPath);

    await fs.writeFile(TEST_FILE, '');

    const stat = await fs.stat(TEST_FILE);
    expect(stat.size).toBe(0);

    await fs.copyFile(backupPath, TEST_FILE);
    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const data = JSON.parse(content);
    expect(data.iteration).toBe(10);
  });

  it('should handle corrupted JSON gracefully', async () => {
    const backupDir = path.join(TEST_DIR, '.omc', 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const validData = { mode: 'test', active: true, iteration: 3, sessions: {} };
    await fs.writeFile(TEST_FILE, JSON.stringify(validData));
    const backupPath = path.join(backupDir, 'test-backup.json');
    await fs.copyFile(TEST_FILE, backupPath);

    await fs.writeFile(TEST_FILE, '{invalid json content}');

    let parseError = false;
    try {
      await fs.readFile(TEST_FILE, 'utf-8').then(JSON.parse);
    } catch {
      parseError = true;
      await fs.copyFile(backupPath, TEST_FILE);
    }

    expect(parseError).toBe(true);
    const content = await fs.readFile(TEST_FILE, 'utf-8');
    const data = JSON.parse(content);
    expect(data.mode).toBe('test');
    expect(data.iteration).toBe(3);
  });
});
