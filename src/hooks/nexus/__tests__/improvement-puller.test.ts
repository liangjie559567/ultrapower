import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadPendingImprovements } from '../improvement-puller.js';

describe('loadPendingImprovements', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `nexus-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('returns empty array when no improvement files', () => {
    const result = loadPendingImprovements(testDir);
    expect(result).toEqual([]);
  });

  it('loads pending improvement files', () => {
    const improvementsDir = join(testDir, '.omc/nexus/improvements');
    mkdirSync(improvementsDir, { recursive: true });
    const imp = {
      id: 'imp-001',
      createdAt: '2026-02-26T00:00:00Z',
      source: 'evolution_engine',
      type: 'skill_update',
      targetFile: 'skills/test/SKILL.md',
      confidence: 85,
      diff: '--- a\n+++ b',
      reason: 'test reason',
      evidence: {},
      status: 'pending',
      testResult: null,
    };
    writeFileSync(join(improvementsDir, 'imp-001.json'), JSON.stringify(imp));
    const result = loadPendingImprovements(testDir);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('imp-001');
  });

  it('skips non-pending improvements', () => {
    const improvementsDir = join(testDir, '.omc/nexus/improvements');
    mkdirSync(improvementsDir, { recursive: true });
    const applied = { id: 'imp-002', status: 'applied' };
    writeFileSync(join(improvementsDir, 'imp-002.json'), JSON.stringify(applied));
    const result = loadPendingImprovements(testDir);
    expect(result).toEqual([]);
  });
});
