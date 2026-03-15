import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showProgress, showError, showConflict } from '../../src/lib/userFeedback';

describe('userFeedback', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should show progress feedback', () => {
    showProgress('Processing files', 5, 10);
    expect(consoleLogSpy).toHaveBeenCalledWith('[Progress] Processing files (5/10)');
  });

  it('should show recoverable error', () => {
    showError('Network timeout', true);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Recoverable Error] Network timeout');
  });

  it('should show fatal error', () => {
    showError('Disk full', false);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[Fatal Error] Disk full');
  });

  it('should show conflict feedback', () => {
    showConflict(['ralph', 'ultrawork'], 'ralph');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[Conflict] Detected: ralph, ultrawork | Selected: ralph');
  });
});
