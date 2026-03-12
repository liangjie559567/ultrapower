import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getChangedFiles } from '../git-helper.js';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-git-helper');

describe('getChangedFiles', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    execSync('git init', { cwd: TEST_DIR });
    execSync('git config user.email "test@test.com"', { cwd: TEST_DIR });
    execSync('git config user.name "Test"', { cwd: TEST_DIR });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should return changed files', () => {
    writeFileSync(join(TEST_DIR, 'file1.ts'), 'content');
    execSync('git add .', { cwd: TEST_DIR });
    execSync('git commit -m "initial"', { cwd: TEST_DIR });

    writeFileSync(join(TEST_DIR, 'file1.ts'), 'modified');
    writeFileSync(join(TEST_DIR, 'file2.ts'), 'new');

    const result = getChangedFiles(TEST_DIR);

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(f => f.includes('file1.ts'))).toBe(true);
  });

  it('should return empty array when no changes', () => {
    writeFileSync(join(TEST_DIR, 'file1.ts'), 'content');
    execSync('git add .', { cwd: TEST_DIR });
    execSync('git commit -m "initial"', { cwd: TEST_DIR });

    const result = getChangedFiles(TEST_DIR);

    expect(result).toEqual([]);
  });

  it('should return empty array on git error', () => {
    const nonGitDir = join(TEST_DIR, 'non-git');
    mkdirSync(nonGitDir);

    const result = getChangedFiles(nonGitDir);

    expect(result).toEqual([]);
  });
});
