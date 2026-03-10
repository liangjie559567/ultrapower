/**
 * 进度显示组件测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Spinner } from '../spinner.js';
import { ProgressBar } from '../progress-bar.js';
import { AgentStatusIndicator } from '../agent-status.js';

describe('Spinner', () => {
  let spinner: Spinner;

  beforeEach(() => {
    spinner = new Spinner();
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start and stop', () => {
    spinner.start('Loading...');
    spinner.stop('success', 'Done');
    expect(process.stdout.write).toHaveBeenCalled();
  });

  it('should update text', () => {
    spinner.start('Loading...');
    spinner.update('Processing...');
    spinner.stop('success');
    expect(process.stdout.write).toHaveBeenCalled();
  });
});

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update progress', () => {
    const bar = new ProgressBar({ total: 10 });
    bar.update(5);
    expect(process.stdout.write).toHaveBeenCalled();
  });

  it('should increment progress', () => {
    const bar = new ProgressBar({ total: 3 });
    bar.increment();
    bar.increment();
    bar.increment();
    expect(process.stdout.write).toHaveBeenCalled();
  });
});

describe('AgentStatusIndicator', () => {
  let indicator: AgentStatusIndicator;

  beforeEach(() => {
    indicator = new AgentStatusIndicator();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add and update agents', () => {
    indicator.add('test-agent', 'idle');
    indicator.update('test-agent', 'running', '50%');

    const summary = indicator.summary();
    expect(summary.total).toBe(1);
    expect(summary.running).toBe(1);
  });

  it('should track multiple agents', () => {
    indicator.add('agent-1', 'running');
    indicator.add('agent-2', 'completed');
    indicator.add('agent-3', 'failed');

    const summary = indicator.summary();
    expect(summary.total).toBe(3);
    expect(summary.running).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it('should render status', () => {
    indicator.add('agent-1', 'running');
    indicator.render();
    expect(console.log).toHaveBeenCalled();
  });
});
