import { describe, it, expect } from 'vitest';
import { safeJsonParse } from '../safe-json.js';

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    const result = safeJsonParse('{"key": "value"}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
    expect(result.error).toBeUndefined();
  });

  it('handles corrupted JSON', () => {
    const result = safeJsonParse('{invalid json}');
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.error).toContain('Failed to parse JSON');
  });

  it('handles empty file', () => {
    const result = safeJsonParse('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse JSON');
  });

  it('handles non-JSON content', () => {
    const result = safeJsonParse('plain text content');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to parse JSON');
  });

  it('includes file path in error message', () => {
    const result = safeJsonParse('{bad}', '/path/to/file.json');
    expect(result.success).toBe(false);
    expect(result.error).toContain('/path/to/file.json');
  });

  it('parses arrays', () => {
    const result = safeJsonParse('[1, 2, 3]');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('parses nested objects', () => {
    const result = safeJsonParse('{"a": {"b": {"c": 123}}}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ a: { b: { c: 123 } } });
  });
});
