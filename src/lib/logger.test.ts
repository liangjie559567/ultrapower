import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from './logger.js';

describe('StructuredLogger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let originalLogLevel: string | undefined;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    originalLogLevel = process.env.LOG_LEVEL;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.LOG_LEVEL = originalLogLevel;
  });

  it('logs INFO message with JSON format', () => {
    logger.info('Test message', { agentId: 'test-123' });

    expect(consoleLogSpy).toHaveBeenCalledOnce();
    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('INFO');
    expect(parsed.message).toBe('Test message');
    expect(parsed.agentId).toBe('test-123');
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('logs ERROR message with context', () => {
    const error = new Error('Test error');
    logger.error('Task failed', { error: error.message, taskId: 't-001' });

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('ERROR');
    expect(parsed.message).toBe('Task failed');
    expect(parsed.taskId).toBe('t-001');
  });

  it('logs WARN message', () => {
    logger.warn('Warning message', { trace_id: 'trace-123' });

    const logOutput = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.level).toBe('WARN');
    expect(parsed.trace_id).toBe('trace-123');
  });

  it('logs DEBUG message when level is DEBUG', () => {
    logger.debug('Debug message', { session_id: 'sess-456' });

    // Default LOG_LEVEL is INFO, so DEBUG won't log
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('logs all levels', () => {
    logger.debug('Debug');
    logger.info('Info');
    logger.warn('Warn');
    logger.error('Error');

    // DEBUG filtered out (default INFO level), so 3 calls
    expect(consoleLogSpy).toHaveBeenCalledTimes(3);
  });

  it('includes all required fields', () => {
    logger.info('Test', {
      trace_id: 'tr-1',
      session_id: 'sess-1',
      agent_id: 'agent-1',
      context: { key: 'value' }
    });

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);

    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('level');
    expect(parsed).toHaveProperty('message');
    expect(parsed.trace_id).toBe('tr-1');
    expect(parsed.session_id).toBe('sess-1');
    expect(parsed.agent_id).toBe('agent-1');
    expect(parsed.context).toEqual({ key: 'value' });
  });
});
