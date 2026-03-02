import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { buildDepTree, detectConflicts } from '../plugin-deps.js';

function tmpDir(): string {
  const d = join(tmpdir(), `omc-deps-test-${Date.now()}`);
  mkdirSync(d, { recursive: true });
  return d;
}

describe('plugin-deps', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  it('buildDepTree returns root node with no deps for empty dir', () => {
    const tree = buildDepTree(dir, 'myplugin', '1.0.0');
    expect(tree.name).toBe('myplugin');
    expect(tree.version).toBe('1.0.0');
    expect(tree.deps).toEqual([]);
  });

  it('buildDepTree reads dependencies from package.json', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({
      dependencies: { lodash: '^4.0.0' }
    }));
    const tree = buildDepTree(dir, 'myplugin', '1.0.0');
    expect(tree.deps.length).toBe(1);
    expect(tree.deps[0]!.name).toBe('lodash');
  });

  it('detectConflicts returns clean=true for no conflicts', () => {
    const tree = buildDepTree(dir, 'myplugin', '1.0.0');
    const report = detectConflicts(tree);
    expect(report.clean).toBe(true);
    expect(report.conflicts).toEqual([]);
  });

  it('detectConflicts detects version conflicts', () => {
    // Manually build a tree with conflicting versions
    const tree = {
      name: 'root', version: '1.0.0', depth: 0,
      deps: [
        { name: 'lodash', version: '^4.0.0', depth: 1, deps: [] },
        { name: 'lodash', version: '^3.0.0', depth: 1, deps: [] },
      ]
    };
    const report = detectConflicts(tree);
    expect(report.clean).toBe(false);
    expect(report.conflicts[0]!.name).toBe('lodash');
    expect(report.conflicts[0]!.versions).toContain('^4.0.0');
    expect(report.conflicts[0]!.versions).toContain('^3.0.0');
  });

  it('buildDepTree respects maxDepth=0', () => {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({
      dependencies: { lodash: '^4.0.0' }
    }));
    const tree = buildDepTree(dir, 'myplugin', '1.0.0', 0, 0);
    expect(tree.deps).toEqual([]);
  });
});
