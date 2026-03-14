import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runQualityGateSync } from '../quality-gate-sync.js';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-quality-gate');

describe('runQualityGateSync', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should pass with clean code', () => {
    const file = join(TEST_DIR, 'clean.ts');
    writeFileSync(file, 'const x: number = 1;');

    const result = runQualityGateSync([file], TEST_DIR);

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect TODO comments', () => {
    const file = join(TEST_DIR, 'todo.ts');
    writeFileSync(file, '// TODO: implement this');

    const result = runQualityGateSync([file], TEST_DIR);

    expect(result.score).toBe(90);
    expect(result.issues).toContain(`${file}: Contains TODO/FIXME`);
  });

  it('should detect console.log', () => {
    const file = join(TEST_DIR, 'console.ts');
    writeFileSync(file, 'console.log("debug");');

    const result = runQualityGateSync([file], TEST_DIR);

    expect(result.score).toBe(95);
    expect(result.issues).toContain(`${file}: Contains console.log`);
  });

  it('should detect any type', () => {
    const file = join(TEST_DIR, 'any.ts');
    writeFileSync(file, 'const x: any = 1;');

    const result = runQualityGateSync([file], TEST_DIR);

    expect(result.score).toBe(95);
    expect(result.issues).toContain(`${file}: Uses 'any' type`);
  });

  it('should accumulate multiple issues', () => {
    const file = join(TEST_DIR, 'bad.ts');
    writeFileSync(file, '// TODO: fix\nconsole.log("x");\nconst y: any = 1;');

    const result = runQualityGateSync([file], TEST_DIR);

    expect(result.score).toBe(80);
    expect(result.issues).toHaveLength(3);
  });

  it('should fail when score below 60', () => {
    const files = [];
    for (let i = 0; i < 10; i++) {
      const file = join(TEST_DIR, `bad${i}.ts`);
      writeFileSync(file, '// TODO: implement');
      files.push(file);
    }

    const result = runQualityGateSync(files, TEST_DIR);

    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should skip when requested', () => {
    const file = join(TEST_DIR, 'bad.ts');
    writeFileSync(file, '// TODO: bad code');

    const result = runQualityGateSync([file], TEST_DIR, true);

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('should ignore non-ts/js files', () => {
    const file = join(TEST_DIR, 'readme.md');
    writeFileSync(file, 'TODO: write docs');

    const result = runQualityGateSync([file], TEST_DIR);

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });
});
