import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getChangedFiles, getUntrackedFiles, getAllChangedFiles } from '../incremental-processor.js';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-incremental');
const execOpts = { cwd: TEST_DIR };

describe('Incremental Processor', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    execSync('git init', execOpts);
    execSync('git config user.email "test@test.com"', execOpts);
    execSync('git config user.name "Test"', execOpts);
    execSync('git config commit.gpgsign false', execOpts);
    writeFileSync(join(TEST_DIR, 'file1.txt'), 'initial');
    execSync('git add file1.txt', execOpts);
    execSync('git commit -m "initial"', execOpts);
  });

  it('detects changed files', async () => {
    writeFileSync(join(TEST_DIR, 'file1.txt'), 'modified');
    execSync('git add file1.txt', execOpts);
    const changed = await getChangedFiles('HEAD', TEST_DIR);
    expect(changed).toContain('file1.txt');
  });

  it('detects untracked files', async () => {
    writeFileSync(join(TEST_DIR, 'file2.txt'), 'new');
    const untracked = await getUntrackedFiles(TEST_DIR);
    expect(untracked).toContain('file2.txt');
  });

  it('gets all changed files', async () => {
    writeFileSync(join(TEST_DIR, 'file1.txt'), 'modified');
    execSync('git add file1.txt', execOpts);
    writeFileSync(join(TEST_DIR, 'file2.txt'), 'new');
    const all = await getAllChangedFiles('HEAD', TEST_DIR);
    expect(all).toContain('file1.txt');
    expect(all).toContain('file2.txt');
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });
});
