import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { Dashboard } from '../dashboard.js';
import { MetricsCollector } from '../metrics-collector.js';

describe('Dashboard', () => {
  let testDir: string;
  let dashboard: Dashboard;
  let collector: MetricsCollector;

  beforeEach(() => {
    testDir = join(tmpdir(), `dashboard-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    dashboard = new Dashboard(testDir);
    collector = new MetricsCollector(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('display', () => {
    it('displays metrics for last 24 hours', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await collector.record('build', 1500);
      await collector.record('memory', 512000);

      await dashboard.display(24);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Performance Dashboard'));
      consoleSpy.mockRestore();
    });

    it('shows no data message for empty metrics', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await dashboard.display(24);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No data'));
      consoleSpy.mockRestore();
    });

    it('shows regression warning when exceeding baseline', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await collector.setBaseline('build', 1000);
      await collector.record('build', 2500);

      await dashboard.display(24);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
      consoleSpy.mockRestore();
    });
  });

  describe('setBaselines', () => {
    it('updates baselines from current metrics', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await collector.record('build', 1000);
      await collector.record('build', 2000);

      await dashboard.setBaselines();

      const baseline = await collector.getBaseline('build');
      expect(baseline).toBe(1500);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Baselines updated');
      consoleSpy.mockRestore();
    });
  });

  describe('export', () => {
    it('exports to JSON format', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await collector.record('build', 1000);
      const outputPath = join(testDir, 'export.json');

      await dashboard.export('json', outputPath);

      expect(existsSync(outputPath)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Exported'));
      consoleSpy.mockRestore();
    });

    it('exports to CSV format', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await collector.record('build', 1000);
      const outputPath = join(testDir, 'export.csv');

      await dashboard.export('csv', outputPath, 'build');

      expect(existsSync(outputPath)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Exported'));
      consoleSpy.mockRestore();
    });
  });
});
