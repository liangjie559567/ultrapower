import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getChangedFiles, getUntrackedFiles, getAllChangedFiles } from '../incremental-processor.js';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-incremental');

describe('Incremental Processor', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
    execSync('git init');
    execSync('git config user.email "test@test.com"');
    execSync('git config user.name "Test"');
    execSync('git config commit.gpgsign false');
    writeFileSync('file1.txt', 'initial');
    execSync('git add file1.txt');
    execSync('git commit -m "initial"');
  });

  it('detects changed files', async () => {
    writeFileSync('file1.txt', 'modified');
    execSync('git add file1.txt');
    const changed = await getChangedFiles('HEAD');
    expect(changed).toContain('file1.txt');
  });

  it('detects untracked files', async () => {
    writeFileSync('file2.txt', 'new');
    const untracked = await getUntrackedFiles();
    expect(untracked).toContain('file2.txt');
  });

  it('gets all changed files', async () => {
    writeFileSync('file1.txt', 'modified');
    execSync('git add file1.txt');
    writeFileSync('file2.txt', 'new');
    const all = await getAllChangedFiles('HEAD');
    expect(all).toContain('file1.txt');
    expect(all).toContain('file2.txt');
  });

  afterEach(() => {
    process.chdir('..');
    rmSync(TEST_DIR, { recursive: true, force: true });
  });
});
