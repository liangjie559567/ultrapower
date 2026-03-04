import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { findProjectRoot, findRuleFiles } from '../finder.js';

const TEST_DIR = join(tmpdir(), '.test-rules-finder-' + Date.now());

describe('Rules Finder', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe('findProjectRoot', () => {
    it('finds project root with .git marker', () => {
      const projectDir = join(TEST_DIR, 'project');
      const subDir = join(projectDir, 'src');
      mkdirSync(subDir, { recursive: true });
      mkdirSync(join(projectDir, '.git'));

      const root = findProjectRoot(subDir);
      expect(root).toBe(projectDir);
    });

    it('finds project root with package.json marker', () => {
      const projectDir = join(TEST_DIR, 'project');
      mkdirSync(projectDir, { recursive: true });
      writeFileSync(join(projectDir, 'package.json'), '');

      const root = findProjectRoot(projectDir);
      expect(root).toBe(projectDir);
    });

    it('handles file path by checking parent directory', () => {
      const projectDir = join(TEST_DIR, 'project');
      mkdirSync(projectDir, { recursive: true });
      mkdirSync(join(projectDir, '.git'));
      const filePath = join(projectDir, 'file.ts');
      writeFileSync(filePath, 'content');

      const root = findProjectRoot(filePath);
      expect(root).toBe(projectDir);
    });
  });

  describe('findRuleFiles', () => {
    it('finds .claude/rules files', () => {
      const projectDir = join(TEST_DIR, 'project');
      const rulesDir = join(projectDir, '.claude', 'rules');
      mkdirSync(rulesDir, { recursive: true });
      mkdirSync(join(projectDir, '.git'));
      writeFileSync(join(rulesDir, 'test.md'), '# Rule');
      const currentFile = join(projectDir, 'src', 'index.ts');
      mkdirSync(join(projectDir, 'src'), { recursive: true });
      writeFileSync(currentFile, '');

      const files = findRuleFiles(projectDir, TEST_DIR, currentFile);
      expect(files.length).toBeGreaterThan(0);
      expect(files[0].path).toContain('test.md');
    });

    it('returns empty array when no rules found', () => {
      const projectDir = join(TEST_DIR, 'empty');
      mkdirSync(projectDir, { recursive: true });
      const currentFile = join(projectDir, 'file.ts');
      writeFileSync(currentFile, '');

      const files = findRuleFiles(projectDir, TEST_DIR, currentFile);
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(0);
    });
  });
});
