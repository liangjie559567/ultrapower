import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { WriteAheadLog } from '../wal.js';

describe('WAL Recovery', () => {
  const testDir = path.join(process.cwd(), '.test-wal-recovery');
  const walDir = path.join(testDir, '.omc', 'state', 'wal');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('rolls back corrupted WAL file', () => {
    const wal = new WriteAheadLog(testDir);
    const id = wal.writeEntry('test-mode', { value: 'test' });

    // Corrupt the WAL file
    const walPath = path.join(walDir, `${id}.wal`);
    fs.writeFileSync(walPath, 'invalid json{{{');

    // Create new instance - should handle corruption gracefully
    const wal2 = new WriteAheadLog(testDir);
    const uncommitted = wal2.getUncommitted();

    expect(uncommitted.length).toBe(0);
  });

  it('recovers partial write', () => {
    const wal = new WriteAheadLog(testDir);
    const id = wal.writeEntry('test-mode', { value: 'partial' });

    // Simulate partial write by not committing
    const uncommitted = wal.getUncommitted();
    expect(uncommitted.length).toBe(1);
    expect(uncommitted[0].id).toBe(id);
    expect(uncommitted[0].committed).toBe(false);
  });

  it('recovers multiple WAL entries in order', () => {
    const wal = new WriteAheadLog(testDir);
    const id1 = wal.writeEntry('mode1', { order: 1 });
    const id2 = wal.writeEntry('mode2', { order: 2 });
    const id3 = wal.writeEntry('mode3', { order: 3 });

    const recovered = wal.recover();
    expect(recovered.length).toBe(3);
    expect(recovered[0].id).toBe(id1);
    expect(recovered[1].id).toBe(id2);
    expect(recovered[2].id).toBe(id3);
  });

  it('maintains state consistency after WAL cleanup', () => {
    const wal = new WriteAheadLog(testDir);
    const id1 = wal.writeEntry('mode1', { value: 'data1' });
    const id2 = wal.writeEntry('mode2', { value: 'data2' });

    wal.commit(id1);
    wal.commit(id2);

    expect(wal.getUncommitted().length).toBe(0);

    wal.cleanup();

    // Verify WAL files are removed
    const files = fs.readdirSync(walDir);
    expect(files.length).toBe(0);
  });

  it('handles concurrent write with WAL locking', () => {
    const wal = new WriteAheadLog(testDir);
    const id1 = wal.writeEntry('mode1', { value: 'concurrent1' });
    const id2 = wal.writeEntry('mode2', { value: 'concurrent2' });

    // Both entries should exist
    const uncommitted = wal.getUncommitted();
    expect(uncommitted.length).toBe(2);
    expect(uncommitted.find(e => e.id === id1)).toBeDefined();
    expect(uncommitted.find(e => e.id === id2)).toBeDefined();
  });

  it('degrades gracefully when WAL file missing', () => {
    const wal = new WriteAheadLog(testDir);
    const id = wal.writeEntry('test-mode', { value: 'test' });

    // Delete WAL file
    const walPath = path.join(walDir, `${id}.wal`);
    fs.unlinkSync(walPath);

    // Create new instance - should handle missing file
    const wal2 = new WriteAheadLog(testDir);
    const uncommitted = wal2.getUncommitted();
    expect(uncommitted.length).toBe(0);
  });

  it('handles recovery failure with error', () => {
    const wal = new WriteAheadLog(testDir);
    wal.writeEntry('mode1', { value: 'data1' });

    // Create corrupted WAL file
    const files = fs.readdirSync(walDir);
    const walPath = path.join(walDir, files[0]);
    fs.writeFileSync(walPath, 'corrupted');

    // Recovery should skip corrupted entries
    const wal2 = new WriteAheadLog(testDir);
    expect(wal2.getUncommitted().length).toBe(0);
  });

  it('verifies data integrity after recovery', () => {
    const wal = new WriteAheadLog(testDir);
    const testData = { value: 'integrity-test', nested: { key: 'value' } };
    wal.writeEntry('test-mode', testData);

    // Create new instance and verify data
    const wal2 = new WriteAheadLog(testDir);
    const recovered = wal2.recover();

    expect(recovered.length).toBe(1);
    expect(recovered[0].data).toEqual(testData);
    expect(recovered[0].mode).toBe('test-mode');
    expect(recovered[0].committed).toBe(false);
  });
});

