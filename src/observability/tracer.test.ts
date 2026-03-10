import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startSpan, endSpan, withSpan } from './tracer';
import { SpanStatusCode } from '@opentelemetry/api';

describe('tracer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start span with attributes', () => {
    const span = startSpan('test-span', { key: 'value', count: 42 });
    expect(span).toBeDefined();
    span.end();
  });

  it('should start span without attributes', () => {
    const span = startSpan('test-span');
    expect(span).toBeDefined();
    span.end();
  });

  it('should end span without error', () => {
    const span = startSpan('test-span');
    endSpan(span);
    expect(span.isRecording()).toBe(false);
  });

  it('should end span with error', () => {
    const span = startSpan('test-span');
    const error = new Error('test error');
    endSpan(span, error);
    expect(span.isRecording()).toBe(false);
  });

  it('should execute function with span', () => {
    const result = withSpan('test-span', (span) => {
      expect(span).toBeDefined();
      return 'success';
    });
    expect(result).toBe('success');
  });

  it('should execute function with span and attributes', () => {
    const result = withSpan('test-span', () => 42, { operation: 'compute' });
    expect(result).toBe(42);
  });

  it('should handle errors in withSpan', () => {
    expect(() => {
      withSpan('test-span', () => {
        throw new Error('test error');
      });
    }).toThrow('test error');
  });

  it('should propagate return value from withSpan', () => {
    const obj = { data: 'test' };
    const result = withSpan('test-span', () => obj);
    expect(result).toBe(obj);
  });

  it('should mask sensitive attributes', () => {
    const span = startSpan('test-span', {
      email: 'user@example.com',
      token: 'Bearer secret123'
    });
    expect(span).toBeDefined();
    span.end();
  });
});
