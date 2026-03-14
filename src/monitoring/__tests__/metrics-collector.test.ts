import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { MetricsCollector } from '../metrics-collector.js';

describe('MetricsCollector', () => {
  let testDir: string;
  let collector: MetricsCollector;

  beforeEach(() => {
    testDir = join(tmpdir(), `metrics-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    collector = new MetricsCollector(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('record', () => {
    it('records metric to file', async () => {
      await collector.record('build', 1500);
      const file = join(testDir, 'build.jsonl');
      expect(existsSync(file)).toBe(true);

      const content = readFileSync(file, 'utf-8');
      const metric = JSON.parse(content.trim());
      expect(metric.type).toBe('build');
      expect(metric.value).toBe(1500);
      expect(metric.timestamp).toBeTypeOf('number');
    });

    it('records metric with metadata', async () => {
      await collector.record('memory', 512000, { source: 'test' });
      const metrics = await collector.getMetrics('memory');
      expect(metrics[0].metadata).toEqual({ source: 'test' });
    });

    it('appends multiple metrics', async () => {
      await collector.record('build', 1000);
      await collector.record('build', 2000);

      const metrics = await collector.getMetrics('build');
      expect(metrics).toHaveLength(2);
      expect(metrics[0].value).toBe(1000);
      expect(metrics[1].value).toBe(2000);
    });
  });

  describe('getMetrics', () => {
    it('returns empty array for non-existent type', async () => {
      const metrics = await collector.getMetrics('build');
      expect(metrics).toEqual([]);
    });

    it('filters by timestamp', async () => {
      vi.useFakeTimers();
      const now = Date.now();
      await collector.record('build', 1000);
      vi.advanceTimersByTime(10);
      await collector.record('build', 2000);

      const metrics = await collector.getMetrics('build', now + 5);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(2000);
      vi.useRealTimers();
    });

    it('handles malformed JSON lines', async () => {
      const file = join(testDir, 'build.jsonl');
      mkdirSync(testDir, { recursive: true });
      require('fs').writeFileSync(file, '{"valid":true}\ninvalid json\n{"valid":true}');

      const metrics = await collector.getMetrics('build');
      expect(metrics).toHaveLength(2);
    });
  });

  describe('baseline', () => {
    it('returns null for non-existent baseline', async () => {
      const baseline = await collector.getBaseline('build');
      expect(baseline).toBeNull();
    });

    it('sets and retrieves baseline', async () => {
      await collector.setBaseline('build', 1500);
      const baseline = await collector.getBaseline('build');
      expect(baseline).toBe(1500);
    });

    it('updates existing baseline', async () => {
      await collector.setBaseline('build', 1000);
      await collector.setBaseline('build', 2000);
      const baseline = await collector.getBaseline('build');
      expect(baseline).toBe(2000);
    });

    it('maintains multiple baselines', async () => {
      await collector.setBaseline('build', 1000);
      await collector.setBaseline('memory', 512000);

      expect(await collector.getBaseline('build')).toBe(1000);
      expect(await collector.getBaseline('memory')).toBe(512000);
    });
  });

  describe('export', () => {
    it('exports to JSON', async () => {
      await collector.record('build', 1000);
      await collector.record('memory', 512000);

      const outputPath = join(testDir, 'export.json');
      await collector.exportToJSON(outputPath);

      expect(existsSync(outputPath)).toBe(true);
      const data = JSON.parse(readFileSync(outputPath, 'utf-8'));
      expect(data.build).toHaveLength(1);
      expect(data.memory).toHaveLength(1);
    });

    it('exports to CSV', async () => {
      await collector.record('build', 1000);
      await collector.record('build', 2000);

      const outputPath = join(testDir, 'export.csv');
      await collector.exportToCSV('build', outputPath);

      const content = readFileSync(outputPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines[0]).toBe('timestamp,type,value');
      expect(lines).toHaveLength(3);
    });

    it('exports empty CSV when no metrics', async () => {
      const outputPath = join(testDir, 'empty.csv');
      await collector.exportToCSV('build', outputPath);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toBe('timestamp,type,value\n');
    });
  });
});
