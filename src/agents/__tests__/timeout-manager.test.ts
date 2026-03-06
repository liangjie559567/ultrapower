import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeoutManager } from '../timeout-manager.js';

describe('TimeoutManager', () => {
  let manager: TimeoutManager;

  beforeEach(() => {
    manager = new TimeoutManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('启动超时监控', () => {
    const controller = manager.start('task-1', 'executor');
    expect(controller).toBeInstanceOf(AbortController);
    expect(controller.signal.aborted).toBe(false);
  });

  it('超时后中断信号', () => {
    const controller = manager.start('task-1', 'explore'); // 60s timeout

    vi.advanceTimersByTime(60000);

    expect(controller.signal.aborted).toBe(true);
  });

  it('手动停止超时监控', () => {
    const controller = manager.start('task-1', 'executor');

    manager.stop('task-1');
    vi.advanceTimersByTime(600000);

    expect(controller.signal.aborted).toBe(false);
  });

  it('获取已运行时间', () => {
    manager.start('task-1', 'executor');

    vi.advanceTimersByTime(5000);

    expect(manager.getElapsed('task-1')).toBe(5000);
  });

  it('未启动的任务返回 0', () => {
    expect(manager.getElapsed('unknown')).toBe(0);
  });

  it('重复调用start()清理旧timer', () => {
    const controller1 = manager.start('task-1', 'executor');
    const controller2 = manager.start('task-1', 'executor');

    vi.advanceTimersByTime(600000);

    expect(controller1.signal.aborted).toBe(false);
    expect(controller2.signal.aborted).toBe(true);
  });

  it('并发启动多个taskId', () => {
    const c1 = manager.start('task-1', 'executor');
    const c2 = manager.start('task-2', 'executor');
    const c3 = manager.start('task-3', 'executor');

    vi.advanceTimersByTime(600000);

    expect(c1.signal.aborted).toBe(true);
    expect(c2.signal.aborted).toBe(true);
    expect(c3.signal.aborted).toBe(true);
  });
});
