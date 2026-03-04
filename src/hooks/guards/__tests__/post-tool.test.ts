import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostToolGuard } from '../post-tool.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('post-tool guards', () => {
  let tempDir: string;
  let guard: PostToolGuard;
  let activeContextPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'post-tool-test-'));
    const axiomDir = path.join(tempDir, '.omc', 'axiom');
    await fs.mkdir(axiomDir, { recursive: true });

    activeContextPath = path.join(axiomDir, 'active_context.md');
    await fs.writeFile(activeContextPath, '## Recent Activity\n', 'utf-8');

    guard = new PostToolGuard(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('onToolUse', () => {
    it('should log Write tool usage', async () => {
      await guard.onToolUse({
        toolName: 'Write',
        toolInput: { file_path: 'src/test.ts' },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Tool: Write → src/test.ts');
    });

    it('should log Edit tool usage', async () => {
      await guard.onToolUse({
        toolName: 'Edit',
        toolInput: { file_path: 'src/index.ts' },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Tool: Edit → src/index.ts');
    });

    it('should log Bash commands', async () => {
      await guard.onToolUse({
        toolName: 'Bash',
        toolInput: { command: 'npm test' },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Tool: Bash → npm test');
    });

    it('should truncate long Bash commands to 80 chars', async () => {
      const longCmd = 'a'.repeat(100);
      await guard.onToolUse({
        toolName: 'Bash',
        toolInput: { command: longCmd },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain(longCmd.slice(0, 80));
      expect(content).not.toContain(longCmd);
    });

    it('should not log other tool types', async () => {
      await guard.onToolUse({
        toolName: 'Read',
        toolInput: { file_path: 'src/test.ts' },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toBe('## Recent Activity\n');
    });

    it('should handle missing file_path gracefully', async () => {
      await guard.onToolUse({
        toolName: 'Write',
        toolInput: {},
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Tool: Write →');
    });

    it('should handle missing command gracefully', async () => {
      await guard.onToolUse({
        toolName: 'Bash',
        toolInput: {},
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Tool: Bash →');
    });

    it('should not throw when active_context.md does not exist', async () => {
      await fs.unlink(activeContextPath);

      await expect(guard.onToolUse({
        toolName: 'Write',
        toolInput: { file_path: 'test.ts' },
      })).resolves.not.toThrow();
    });

    it('should append multiple activities in order', async () => {
      await guard.onToolUse({
        toolName: 'Write',
        toolInput: { file_path: 'file1.ts' },
      });
      await guard.onToolUse({
        toolName: 'Edit',
        toolInput: { file_path: 'file2.ts' },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toContain('Tool: Write → file1.ts');
      expect(content).toContain('Tool: Edit → file2.ts');
      // New entries are inserted after "## Recent Activity", so later entries appear first
      expect(content.indexOf('file2.ts')).toBeLessThan(content.indexOf('file1.ts'));
    });

    it('should include timestamp in activity log', async () => {
      await guard.onToolUse({
        toolName: 'Write',
        toolInput: { file_path: 'test.ts' },
      });

      const content = await fs.readFile(activeContextPath, 'utf-8');
      expect(content).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/);
    });
  });
});
