import { describe, it, expect } from 'vitest';
import { checkBackgroundNotifications, processBackgroundNotification, createBackgroundNotificationHook } from '../index.js';

describe('background-notification hook', () => {
  it('should check notifications with no tasks', () => {
    const mockManager = {
      getPendingNotifications: () => []
    } as any;
    const result = checkBackgroundNotifications('test-session', mockManager);
    expect(result.hasNotifications).toBe(false);
  });

  it('should process notification without session', () => {
    const result = processBackgroundNotification({} as any);
    expect(result.continue).toBe(true);
  });

  it('should create hook with manager', () => {
    const mockManager = {} as any;
    const hook = createBackgroundNotificationHook(mockManager);
    expect(hook.name).toBe('background-notification');
  });
});
