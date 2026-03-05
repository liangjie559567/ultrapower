import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatusDashboard } from '../status-dashboard.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('StatusDashboard', () => {
  let tempDir: string;
  let dashboard: StatusDashboard;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dashboard-test-'));
    dashboard = new StatusDashboard(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('getStatus', () => {
    it('should return default status when no files exist', async () => {
      const status = await dashboard.getStatus();
      expect(status.taskStatus).toBe('IDLE');
      expect(status.knowledgeCount).toBe(0);
      expect(status.patternCount).toBe(0);
      expect(status.queuePending).toBe(0);
    });

    it('should parse active_context.md fields', async () => {
      const axiomDir = path.join(tempDir, '.omc', 'axiom');
      await fs.mkdir(axiomDir, { recursive: true });
      await fs.writeFile(
        path.join(axiomDir, 'active_context.md'),
        'Task Status: EXECUTING\nLast Updated: 2026-03-05 10:00:00\nLast Commit: abc123\n',
        'utf-8'
      );

      const status = await dashboard.getStatus();
      expect(status.taskStatus).toBe('EXECUTING');
      expect(status.lastUpdated).toBe('2026-03-05 10:00:00');
      expect(status.lastCommit).toBe('abc123');
    });

    it('should count knowledge files', async () => {
      const knowledgeDir = path.join(tempDir, '.omc', 'knowledge');
      await fs.mkdir(knowledgeDir, { recursive: true });
      await fs.writeFile(path.join(knowledgeDir, 'k-001-test.md'), '', 'utf-8');
      await fs.writeFile(path.join(knowledgeDir, 'k-002-test.md'), '', 'utf-8');
      await fs.writeFile(path.join(knowledgeDir, 'other.md'), '', 'utf-8');

      const status = await dashboard.getStatus();
      expect(status.knowledgeCount).toBe(2);
    });

    it('should count queue items', async () => {
      const evolutionDir = path.join(tempDir, '.omc', 'axiom', 'evolution');
      await fs.mkdir(evolutionDir, { recursive: true });
      await fs.writeFile(
        path.join(evolutionDir, 'learning_queue.md'),
        '| pending | item1 |\n| done | item2 |\n| pending | item3 |\n',
        'utf-8'
      );

      const status = await dashboard.getStatus();
      expect(status.queuePending).toBe(2);
      expect(status.queueDone).toBe(1);
    });

    it('should list recent reflections', async () => {
      const reflDir = path.join(tempDir, '.omc', 'axiom', 'reflections');
      await fs.mkdir(reflDir, { recursive: true });
      await fs.writeFile(path.join(reflDir, 'r-001.md'), '', 'utf-8');
      await fs.writeFile(path.join(reflDir, 'r-002.md'), '', 'utf-8');

      const status = await dashboard.getStatus();
      expect(status.recentReflections).toContain('r-002.md');
      expect(status.recentReflections).toContain('r-001.md');
    });

    it('should check guard installation', async () => {
      const hooksDir = path.join(tempDir, '.git', 'hooks');
      await fs.mkdir(hooksDir, { recursive: true });
      await fs.writeFile(path.join(hooksDir, 'pre-commit'), '#!/bin/sh\n', 'utf-8');

      const status = await dashboard.getStatus();
      expect(status.guardStatus.preCommit).toBe(true);
      expect(status.guardStatus.postCommit).toBe(false);
    });
  });

  describe('generateMarkdown', () => {
    it('should generate valid markdown', async () => {
      const md = await dashboard.generateMarkdown();
      expect(md).toContain('# Axiom System Status');
      expect(md).toContain('## Task Progress');
      expect(md).toContain('## Evolution Stats');
      expect(md).toContain('## Guard Status');
    });

    it('should include timestamp', async () => {
      const md = await dashboard.generateMarkdown();
      expect(md).toMatch(/Generated: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should format tables correctly', async () => {
      const md = await dashboard.generateMarkdown();
      expect(md).toContain('| Field | Value |');
      expect(md).toContain('|---|---|');
    });
  });

  describe('printDashboard', () => {
    it('should not throw', async () => {
      await expect(dashboard.printDashboard()).resolves.not.toThrow();
    });
  });
});
