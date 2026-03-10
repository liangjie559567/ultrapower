import { describe, it, expect } from 'vitest';
import { processPermissionRequest } from '../../src/hooks/processors/permissionRequest.js';

describe('D-05: permission-request blocking', () => {
  it('allows when result.success is true', async () => {
    const output = await processPermissionRequest({ result: { success: true } });
    expect(output.continue).toBe(true);
  });

  it('blocks when result is null', async () => {
    const output = await processPermissionRequest({ result: null });
    expect(output.continue).toBe(false);
    expect(output.message).toContain('权限验证失败');
  });

  it('blocks when result is undefined', async () => {
    const output = await processPermissionRequest({});
    expect(output.continue).toBe(false);
  });

  it('blocks when result.success is false', async () => {
    const output = await processPermissionRequest({ result: { success: false } });
    expect(output.continue).toBe(false);
  });

  it('blocks when result.success is missing', async () => {
    const output = await processPermissionRequest({ result: {} });
    expect(output.continue).toBe(false);
  });

  it('includes error details in reason when present', async () => {
    const output = await processPermissionRequest({
      result: { success: false, error: 'Access denied' }
    });
    expect(output.reason).toContain('Access denied');
  });
});
