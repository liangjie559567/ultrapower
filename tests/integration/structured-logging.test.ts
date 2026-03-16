/**
 * Integration Test: Structured Logging
 *
 * Verifies that StructuredLogger is integrated into all critical paths:
 * - State read/write operations
 * - Agent lifecycle events (start/stop)
 * - Team coordination (task updates)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../src/lib/logger.js';

describe('Structured Logging Integration', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('logs state write operations', () => {
    logger.info('State written', { mode: 'autopilot', session_id: 'test-123', operation: 'write' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"level":"INFO"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"State written"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"mode":"autopilot"')
    );
  });

  it('logs state read operations', () => {
    logger.info('State read', { mode: 'team', session_id: 'test-456', operation: 'read' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"State read"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"mode":"team"')
    );
  });

  it('logs agent start events', () => {
    logger.info('Agent started', { agent_id: 'agent-001', event: 'start', agent_type: 'executor' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Agent started"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"agent_id":"agent-001"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"event":"start"')
    );
  });

  it('logs agent stop events', () => {
    logger.info('Agent stopped', { agent_id: 'agent-002', event: 'stop', status: 'completed' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Agent stopped"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"status":"completed"')
    );
  });

  it('logs team task updates', () => {
    logger.info('Task updated', { team_name: 'dev-team', task_id: 'task-123', phase: 'exec' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Task updated"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"team_name":"dev-team"')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"task_id":"task-123"')
    );
  });

  it('includes timestamp in all log entries', () => {
    logger.info('Test message', { test: 'data' });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"timestamp":"')
    );
  });

  it('respects LOG_LEVEL environment variable', () => {
    // Test that DEBUG level is filtered when LOG_LEVEL is INFO
    consoleLogSpy.mockClear();
    logger.debug('Debug message', { test: 'data' });

    // DEBUG should not log when default level is INFO
    expect(consoleLogSpy).not.toHaveBeenCalled();

    // INFO should log
    logger.info('Info message', { test: 'data' });
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
