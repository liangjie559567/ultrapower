import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createSnapshot, restoreSnapshot, listSnapshots } from '../plugin-rollback.js';

function tmpDir(): string {
  const d = join(tmpdir(), `omc-rb-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(d, { recursive: true });
  return d;
}

describe('plugin-rollback', () => {
  let base: string;
  let snapshotsDir: string;

  beforeEach(() => {
    base = tmpDir();
    snapshotsDir = join(base, 'snapshots');
    process.env['OMC_SNAPSHOTS_DIR'] = snapshotsDir;
  });

  afterEach(() => {
    delete process.env['OMC_SNAPSHOTS_DIR'];
    rmSync(base, { recursive: true, force: true });
  });

  function makeInstallPath(name = 'myplugin'): string {
    const p = join(base, 'install', name);
    mkdirSync(p, { recursive: true });
    writeFileSync(join(p, 'index.js'), 'export const v = 1;');
    return p;
  }

  it('createSnapshot returns meta with correct fields', () => {
    const installPath = makeInstallPath();
    const meta = createSnapshot('myplugin', '1.0.0', installPath);
    expect(meta.plugin).toBe('myplugin');
    expect(meta.version).toBe('1.0.0');
    expect(meta.snapshotPath).toContain('myplugin@1.0.0');
    expect(meta.snapshotAt).toBeTruthy();
  });

  it('restoreSnapshot returns false when no snapshot exists', () => {
    const installPath = makeInstallPath();
    expect(restoreSnapshot('nonexistent', '9.9.9', installPath)).toBe(false);
  });

  it('createSnapshot + restoreSnapshot round-trips file content', () => {
    const installPath = makeInstallPath();
    createSnapshot('myplugin', '1.0.0', installPath);
    writeFileSync(join(installPath, 'index.js'), 'export const v = 2;');
    expect(restoreSnapshot('myplugin', '1.0.0', installPath)).toBe(true);
    expect(readFileSync(join(installPath, 'index.js'), 'utf-8')).toBe('export const v = 1;');
  });

  it('listSnapshots returns empty array when no snapshots exist', () => {
    expect(listSnapshots('noplugin-' + Date.now())).toEqual([]);
  });

  it('listSnapshots returns created snapshots sorted newest first', () => {
    const installPath = makeInstallPath();
    createSnapshot('myplugin', '1.0.0', installPath);
    createSnapshot('myplugin', '2.0.0', installPath);
    const list = listSnapshots('myplugin');
    expect(list.length).toBe(2);
    expect(list[0]!.snapshotAt >= list[1]!.snapshotAt).toBe(true);
  });
});
