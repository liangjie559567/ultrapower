import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  getCheckpointPath,
  createCompactCheckpoint,
  formatCompactSummary
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-pre-compact');

describe('pre-compact hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should get checkpoint path', () => {
    const path = getCheckpointPath(TEST_DIR);
    expect(path).toContain('.omc');
    expect(path).toContain('checkpoints');
    expect(existsSync(path)).toBe(true);
  });

  it('should create compact checkpoint', async () => {
    const checkpoint = await createCompactCheckpoint(TEST_DIR, 'manual');
    expect(checkpoint.trigger).toBe('manual');
    expect(checkpoint.created_at).toBeDefined();
    expect(checkpoint.todo_summary).toBeDefined();
  });

  it('should format compact summary', async () => {
    const checkpoint = await createCompactCheckpoint(TEST_DIR, 'auto');
    const summary = formatCompactSummary(checkpoint);
    expect(summary).toContain('PreCompact Checkpoint');
    expect(summary).toContain('Trigger: auto');
  });
});
