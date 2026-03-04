import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TieredWriter } from '../tiered-writer.js';

describe('TieredWriter', () => {
  let writer: TieredWriter;
  let mockWriteFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writer = new TieredWriter();
    mockWriteFn = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    writer.destroy();
    vi.useRealTimers();
  });

  describe('critical modes', () => {
    it('writes session mode immediately', async () => {
      await writer.write('session', { data: 'test' }, mockWriteFn);
      expect(mockWriteFn).toHaveBeenCalledWith('session', { data: 'test' });
      expect(mockWriteFn).toHaveBeenCalledTimes(1);
    });

    it('writes team mode immediately', async () => {
      await writer.write('team', { data: 'test' }, mockWriteFn);
      expect(mockWriteFn).toHaveBeenCalledWith('team', { data: 'test' });
    });

    it('writes ralph mode immediately', async () => {
      await writer.write('ralph', { data: 'test' }, mockWriteFn);
      expect(mockWriteFn).toHaveBeenCalledWith('ralph', { data: 'test' });
    });
  });

  describe('non-critical modes batching', () => {
    it('accumulates non-critical writes', async () => {
      await writer.write('autopilot', { data: '1' }, mockWriteFn);
      expect(mockWriteFn).not.toHaveBeenCalled();
    });

    it('flushes when batch size threshold reached', async () => {
      for (let i = 0; i < 10; i++) {
        await writer.write(`mode${i}`, { data: i }, mockWriteFn);
      }
      expect(mockWriteFn).toHaveBeenCalledTimes(10);
    });

    it('flushes after interval timeout', async () => {
      await writer.write('autopilot', { data: '1' }, mockWriteFn);
      expect(mockWriteFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();

      expect(mockWriteFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('flush', () => {
    it('clears pending writes', async () => {
      await writer.write('autopilot', { data: '1' }, mockWriteFn);
      await writer.flush(mockWriteFn);

      expect(mockWriteFn).toHaveBeenCalledTimes(1);
      expect(writer.getStats().pendingWrites).toBe(0);
    });

    it('handles empty flush', async () => {
      await writer.flush(mockWriteFn);
      expect(mockWriteFn).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('tracks total writes', async () => {
      await writer.write('session', { data: '1' }, mockWriteFn);
      await writer.write('autopilot', { data: '2' }, mockWriteFn);

      const stats = writer.getStats();
      expect(stats.totalWrites).toBe(2);
    });

    it('calculates IO reduction', async () => {
      for (let i = 0; i < 10; i++) {
        await writer.write(`mode${i}`, { data: i }, mockWriteFn);
      }

      const stats = writer.getStats();
      expect(stats.batchWrites).toBe(1);
      expect(stats.ioReduction).toBe('90.0');
    });
  });

  describe('destroy', () => {
    it('clears timer', async () => {
      await writer.write('autopilot', { data: '1' }, mockWriteFn);
      writer.destroy();

      vi.advanceTimersByTime(5000);
      await vi.runAllTimersAsync();

      expect(mockWriteFn).not.toHaveBeenCalled();
    });
  });
});
