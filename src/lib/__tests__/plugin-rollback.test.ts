import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createSnapshot, restoreSnapshot, listSnapshots } from '../plugin-rollback.js';

function tmpDir(): string {
  const d = join(tmpdir(), `omc-rb-test-${Date.now()}`);
  mkdirSync(d, { recursive: true });
  return d;
}

describe('plugin-rollback', () => {
  let base: string;
  beforeEach(() => { base = tmpDir(); });
  afterEach(() => { rmSync(base, { recursive: true, force: true }); });

  function makeInstallPath(name = 'myplugin'): string {
    const p = join(base, 'install', name);
    mkdirSync(p, { recursive: true });
    writeFileSync(join(p, 'index.js'), 'export const v = 1;');
    return p;
  }

  it('createSnapshot returns meta with correct fields', () => {
    const installPath = makeInstallPath();
    // Override SNAPSHOTS_DIR by using a temp path via env trick not needed —
    // just verify the meta object shape
    const meta = createSnapshot('myplugin', '1.0.0', installPath);
    expect(meta.plugin).toBe('myplugin');
    expect(meta.version).toBe('1.0.0');
    expect(meta.snapshotPath).toContain('myplugin@1.0.0');
    expect(meta.snapshotAt).toBeTruthy();
  });

  it('restoreSnapshot returns false when no snapshot exists', () => {
    const installPath = makeInstallPath();
    const ok = restoreSnapshot('nonexistent', '9.9.9', installPath);
    expect(ok).toBe(false);
  });

  it('createSnapshot + restoreSnapshot round-trips file content', () => {
    const installPath = makeInstallPath();
    createSnapshot('myplugin', '1.0.0', installPath);
    // Overwrite install with new content
    writeFileSync(join(installPath, 'index.js'), 'export const v = 2;');
    const ok = restoreSnapshot('myplugin', '1.0.0', installPath);
    expect(ok).toBe(true);
    const content = readFileSync(join(installPath, 'index.js'), 'utf-8');
    expect(content).toBe('export const v = 1;');
  });

  it('listSnapshots returns empty array when no snapshots exist', () => {
    const result = listSnapshots('noplugin-' + Date.now());
    expect(result).toEqual([]);
  });

  it('listSnapshots returns created snapshots sorted newest first', () => {
    const installPath = makeInstallPath();
    createSnapshot('myplugin', '1.0.0', installPath);
    createSnapshot('myplugin', '2.0.0', installPath);
    const list = listSnapshots('myplugin');
    expect(list.length).toBeGreaterThanOrEqual(2);
    // newest first
    expect(list[0]!.snapshotAt >= list[1]!.snapshotAt).toBe(true);
  });
});
