import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  notepadReadTool,
  notepadWritePriorityTool,
  notepadWriteWorkingTool,
  notepadWriteManualTool,
  notepadPruneTool,
  notepadStatsTool,
} from '../notepad-tools.js';

let TEST_DIR: string;

vi.mock('../../lib/worktree-paths.js', async () => {
  const actual = await vi.importActual('../../lib/worktree-paths.js');
  return {
    ...actual,
    validateWorkingDirectory: vi.fn((workingDirectory?: string) => {
      return workingDirectory || process.cwd();
    }),
  };
});

describe('notepad-tools', () => {
  beforeEach(() => {
    TEST_DIR = mkdtempSync(join(tmpdir(), 'notepad-test-'));
    mkdirSync(join(TEST_DIR, '.omc'), { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe('notepad_read', () => {
    it('should return message when notepad does not exist', async () => {
      const result = await notepadReadTool.handler({
        section: 'all',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('does not exist');
    });

    it('should read all sections when section=all', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      writeFileSync(notepadPath, `## Priority Context\nTest priority\n\n## Working Memory\n- [2026-03-05] Test working\n\n## MANUAL\nTest manual`);

      const result = await notepadReadTool.handler({
        section: 'all',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Priority Context');
      expect(result.content[0].text).toContain('Working Memory');
      expect(result.content[0].text).toContain('MANUAL');
    });

    it('should read priority section only', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      writeFileSync(notepadPath, `## Priority Context\nTest priority content\n\n## Working Memory\n- [2026-03-05] Test`);

      const result = await notepadReadTool.handler({
        section: 'priority',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Priority Context');
      expect(result.content[0].text).toContain('Test priority content');
    });

    it('should read working section only', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      writeFileSync(notepadPath, `## Priority Context\nTest\n\n## Working Memory\n- [2026-03-05] Working entry`);

      const result = await notepadReadTool.handler({
        section: 'working',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Working Memory');
      expect(result.content[0].text).toContain('Working entry');
    });

    it('should read manual section only', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      writeFileSync(notepadPath, `## Priority Context\nTest\n\n## MANUAL\nManual entry`);

      const result = await notepadReadTool.handler({
        section: 'manual',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('MANUAL');
      expect(result.content[0].text).toContain('Manual entry');
    });

    it('should handle empty section', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      writeFileSync(notepadPath, `## Priority Context\n<!-- comment -->\n\n## Working Memory\n\n## MANUAL\n`);

      const result = await notepadReadTool.handler({
        section: 'priority',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Empty');
    });
  });

  describe('notepad_write_priority', () => {
    it('should write priority context successfully', async () => {
      const result = await notepadWritePriorityTool.handler({
        content: 'New priority content',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');
      expect(result.content[0].text).toContain('20 chars');

      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      expect(existsSync(notepadPath)).toBe(true);
      const content = readFileSync(notepadPath, 'utf-8');
      expect(content).toContain('New priority content');
    });

    it('should replace existing priority content', async () => {
      await notepadWritePriorityTool.handler({
        content: 'First content',
        workingDirectory: TEST_DIR,
      });

      const result = await notepadWritePriorityTool.handler({
        content: 'Second content',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully wrote');

      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      const content = readFileSync(notepadPath, 'utf-8');
      expect(content).toContain('Second content');
      expect(content).not.toContain('First content');
    });

    it('should show warning for long content', async () => {
      const longContent = 'x'.repeat(600);
      const result = await notepadWritePriorityTool.handler({
        content: longContent,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Warning');
    });
  });

  describe('notepad_write_working', () => {
    it('should add working memory entry with timestamp', async () => {
      const result = await notepadWriteWorkingTool.handler({
        content: 'Working memory entry',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully added');

      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      const content = readFileSync(notepadPath, 'utf-8');
      expect(content).toContain('Working memory entry');
      expect(content).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should append multiple working entries', async () => {
      await notepadWriteWorkingTool.handler({
        content: 'First entry',
        workingDirectory: TEST_DIR,
      });

      await notepadWriteWorkingTool.handler({
        content: 'Second entry',
        workingDirectory: TEST_DIR,
      });

      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      const content = readFileSync(notepadPath, 'utf-8');
      expect(content).toContain('First entry');
      expect(content).toContain('Second entry');
    });
  });

  describe('notepad_write_manual', () => {
    it('should add manual entry', async () => {
      const result = await notepadWriteManualTool.handler({
        content: 'Manual entry',
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Successfully added');

      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      const content = readFileSync(notepadPath, 'utf-8');
      expect(content).toContain('Manual entry');
    });

    it('should append multiple manual entries', async () => {
      await notepadWriteManualTool.handler({
        content: 'First manual',
        workingDirectory: TEST_DIR,
      });

      await notepadWriteManualTool.handler({
        content: 'Second manual',
        workingDirectory: TEST_DIR,
      });

      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      const content = readFileSync(notepadPath, 'utf-8');
      expect(content).toContain('First manual');
      expect(content).toContain('Second manual');
    });
  });

  describe('notepad_prune', () => {
    it('should prune entries older than specified days', async () => {
      // Add two entries using the API
      await notepadWriteWorkingTool.handler({
        content: 'Entry 1',
        workingDirectory: TEST_DIR,
      });

      await notepadWriteWorkingTool.handler({
        content: 'Entry 2',
        workingDirectory: TEST_DIR,
      });

      // Manually create an old entry in the correct format
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      let content = readFileSync(notepadPath, 'utf-8');
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' ');

      // Insert after the comment line
      content = content.replace(
        /(## Working Memory\n<!-- Session notes\. Auto-pruned after 7 days\. -->\n)/,
        `$1### ${oldDate}\nOld entry\n\n`
      );
      writeFileSync(notepadPath, content);

      const result = await notepadPruneTool.handler({
        daysOld: 7,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Pruned: 1');
      expect(result.content[0].text).toContain('Remaining: 2');
    });

    it('should use default 7 days when daysOld not specified', async () => {
      const result = await notepadPruneTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Threshold: 7 days');
    });

    it('should handle notepad without working entries', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      writeFileSync(notepadPath, `# Priority Context\nTest\n`);

      const result = await notepadPruneTool.handler({
        daysOld: 7,
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('Pruned: 0');
    });
  });

  describe('notepad_stats', () => {
    it('should return stats when notepad exists', async () => {
      const notepadPath = join(TEST_DIR, '.omc', 'notepad.md');
      const date1 = '2026-03-05 10:00';
      const date2 = '2026-03-04 09:00';
      writeFileSync(notepadPath, `## Priority Context\nTest priority\n\n## Working Memory\n### ${date1}\nEntry 1\n\n### ${date2}\nEntry 2\n\n## MANUAL\n`);

      const result = await notepadStatsTool.handler({
        workingDirectory: TEST_DIR,
      });

      const text = result.content[0].text;
      expect(text).toContain('Total Size:');
      expect(text).toContain('Priority Context Size:');
      expect(text).toContain('Working Memory Entries:');
      expect(text).toContain('2');
      expect(text).toContain('Oldest Entry:');
    });

    it('should indicate when notepad does not exist', async () => {
      const result = await notepadStatsTool.handler({
        workingDirectory: TEST_DIR,
      });

      expect(result.content[0].text).toContain('does not exist');
    });
  });

  describe('error handling', () => {
    it('should handle read errors gracefully', async () => {
      // Use a path that will cause file system errors
      const invalidDir = join(TEST_DIR, 'nonexistent');

      const result = await notepadReadTool.handler({
        section: 'all',
        workingDirectory: invalidDir,
      });

      // Should not error, just return empty message
      expect(result.content[0].text).toContain('does not exist');
    });

    it('should handle write errors gracefully', async () => {
      // Create a read-only directory scenario by using invalid path
      const invalidDir = join(TEST_DIR, 'readonly');
      mkdirSync(invalidDir, { recursive: true });

      // Make .omc a file instead of directory to cause write error
      const omcPath = join(invalidDir, '.omc');
      writeFileSync(omcPath, 'blocking file');

      const result = await notepadWritePriorityTool.handler({
        content: 'Test',
        workingDirectory: invalidDir,
      });

      expect(result.content[0].text).toContain('Failed to write');
    });
  });
});
