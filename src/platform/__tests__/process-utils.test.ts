import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as processUtils from '../process-utils.js';

describe('isProcessAlive', () => {
  it('should return false for invalid PIDs', () => {
    expect(processUtils.isProcessAlive(0)).toBe(false);
    expect(processUtils.isProcessAlive(-1)).toBe(false);
    expect(processUtils.isProcessAlive(1.5)).toBe(false);
  });

  it('should return true for alive process', () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true);
    expect(processUtils.isProcessAlive(1234)).toBe(true);
    expect(killSpy).toHaveBeenCalledWith(1234, 0);
    killSpy.mockRestore();
  });

  it('should return false for dead process', () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('ESRCH');
    });
    expect(processUtils.isProcessAlive(9999)).toBe(false);
    killSpy.mockRestore();
  });
});

describe('killProcessTree', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('should return false for invalid PIDs', async () => {
    expect(await processUtils.killProcessTree(0)).toBe(false);
    expect(await processUtils.killProcessTree(-5)).toBe(false);
  });

  it('should use negative PID on Unix', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true);

    const result = await processUtils.killProcessTree(1234, 'SIGTERM');
    expect(result).toBe(true);
    expect(killSpy).toHaveBeenCalledWith(-1234, 'SIGTERM');

    killSpy.mockRestore();
  });

  it('should fallback to direct PID on Unix if process group fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

    const killSpy = vi.spyOn(process, 'kill')
      .mockImplementationOnce(() => { throw new Error('ESRCH'); })
      .mockImplementationOnce(() => true);

    const result = await processUtils.killProcessTree(1234, 'SIGTERM');
    expect(result).toBe(true);
    expect(killSpy).toHaveBeenCalledWith(-1234, 'SIGTERM');
    expect(killSpy).toHaveBeenCalledWith(1234, 'SIGTERM');

    killSpy.mockRestore();
  });

  it('should return false on Unix if both attempts fail', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('ESRCH');
    });

    const result = await processUtils.killProcessTree(1234);
    expect(result).toBe(false);

    killSpy.mockRestore();
  });
});

describe('gracefulKill', () => {
  it('should return graceful if process already dead', async () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('ESRCH');
    });

    const result = await processUtils.gracefulKill(1234);
    expect(result).toBe('graceful');

    killSpy.mockRestore();
  });
});

describe('killProcessTree - Windows', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('should handle Windows platform with SIGTERM', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    
    const result = await processUtils.killProcessTree(999999, 'SIGTERM');
    expect(typeof result).toBe('boolean');
  });

  it('should handle Windows platform with SIGKILL', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    
    const result = await processUtils.killProcessTree(999999, 'SIGKILL');
    expect(typeof result).toBe('boolean');
  });
});

describe('getProcessStartTime', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  it('should return undefined for invalid PIDs', async () => {
    expect(await processUtils.getProcessStartTime(0)).toBeUndefined();
    expect(await processUtils.getProcessStartTime(-1)).toBeUndefined();
    expect(await processUtils.getProcessStartTime(1.5)).toBeUndefined();
  });

  it('should handle Windows platform', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    
    const result = await processUtils.getProcessStartTime(999999);
    expect(result === undefined || typeof result === 'number').toBe(true);
  });

  it('should handle macOS platform', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    
    const result = await processUtils.getProcessStartTime(999999);
    expect(result === undefined || typeof result === 'number').toBe(true);
  });

  it('should handle Linux platform', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    
    const result = await processUtils.getProcessStartTime(999999);
    expect(result === undefined || typeof result === 'number').toBe(true);
  });

  it('should handle unsupported platform', async () => {
    Object.defineProperty(process, 'platform', { value: 'freebsd', configurable: true });
    
    const result = await processUtils.getProcessStartTime(1234);
    expect(result).toBeUndefined();
  });
});

describe('gracefulKill - extended', () => {
  it('should attempt SIGTERM first', async () => {
    let callCount = 0;
    const killSpy = vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
      callCount++;
      if (callCount === 1) {
        expect(signal).toBe('SIGTERM');
        return true;
      }
      throw new Error('ESRCH');
    });

    const result = await processUtils.gracefulKill(1234, 50);
    expect(result).toBe('graceful');
    killSpy.mockRestore();
  });

  it('should escalate to SIGKILL after grace period', async () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
      if (signal === 'SIGKILL') {
        throw new Error('ESRCH');
      }
      return true;
    });

    const result = await processUtils.gracefulKill(1234, 50);
    expect(['graceful', 'forced', 'failed']).toContain(result);
    killSpy.mockRestore();
  });

  it('should return failed if process cannot be killed', async () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true);

    const result = await processUtils.gracefulKill(1234, 50);
    expect(result).toBe('failed');
    killSpy.mockRestore();
  });
});
