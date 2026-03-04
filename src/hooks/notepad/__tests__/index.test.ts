import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  initNotepad,
  setPriorityContext,
  addWorkingMemoryEntry,
  getNotepadStats
} from '../index.js';

const TEST_DIR = join(process.cwd(), '.test-notepad');

describe('notepad hook', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  it('should initialize and set priority context', () => {
    const result = initNotepad(TEST_DIR);
    expect(result).toBe(true);

    const setResult = setPriorityContext(TEST_DIR, 'Critical info');
    expect(setResult.success).toBe(true);
    expect(setResult.warning).toBeUndefined();
  });

  it('should add working memory entry', () => {
    initNotepad(TEST_DIR);
    const result = addWorkingMemoryEntry(TEST_DIR, 'Session note');
    expect(result).toBe(true);
  });

  it('should get notepad stats', () => {
    const stats = getNotepadStats(TEST_DIR);
    expect(stats.exists).toBe(false);

    initNotepad(TEST_DIR);
    const stats2 = getNotepadStats(TEST_DIR);
    expect(stats2.exists).toBe(true);
    expect(stats2.workingMemoryEntries).toBe(0);
  });
});
