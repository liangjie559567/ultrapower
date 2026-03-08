import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressBar } from '../progress-bar.js';

describe('ProgressBar', () => {
  let progressBar: ProgressBar;
  let stdoutSpy: any;

  beforeEach(() => {
    progressBar = new ProgressBar();
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it('renders progress bar', () => {
    progressBar.start(10, 'Test');
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('Test'));
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('0%'));
  });

  it('updates progress', () => {
    progressBar.start(10, 'Test');
    progressBar.increment(5);
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('50%'));
  });

  it('completes progress', () => {
    progressBar.start(10, 'Test');
    progressBar.complete();
    expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining('100%'));
  });
});
