import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { writeHeartbeat, readHeartbeat, isWorkerAlive } from '../heartbeat.js';
import { writeProbeResult, readProbeResult, getRegistrationStrategy } from '../team-registration.js';
import type { HeartbeatData } from '../types.js';

let TEST_WD: string;

beforeEach(() => {
  TEST_WD = join(homedir(), '.claude', 'test-state-' + Date.now());
  mkdirSync(join(TEST_WD, '.omc', 'state'), { recursive: true });
});

afterEach(() => {
  rmSync(TEST_WD, { recursive: true, force: true });
});

describe('Team State Persistence', () => {
  describe('Heartbeat State', () => {
    it('writes and reads heartbeat', () => {
      const hb: HeartbeatData = {
        workerName: 'w1',
        teamName: 'test',
        provider: 'codex',
        pid: process.pid,
        lastPollAt: new Date().toISOString(),
        status: 'polling',
        consecutiveErrors: 0,
      };

      writeHeartbeat(TEST_WD, hb);
      const read = readHeartbeat(TEST_WD, 'test', 'w1');

      expect(read).not.toBeNull();
      expect(read!.workerName).toBe('w1');
      expect(read!.status).toBe('polling');
    });

    it('detects alive worker', () => {
      const hb: HeartbeatData = {
        workerName: 'w1',
        teamName: 'test',
        provider: 'codex',
        pid: process.pid,
        lastPollAt: new Date().toISOString(),
        status: 'polling',
        consecutiveErrors: 0,
      };

      writeHeartbeat(TEST_WD, hb);
      expect(isWorkerAlive(TEST_WD, 'test', 'w1', 60000)).toBe(true);
    });
  });

  describe('Probe Result State', () => {
    it('writes and reads probe result', () => {
      writeProbeResult(TEST_WD, {
        probeResult: 'pass',
        probedAt: new Date().toISOString(),
        version: '1.0.0',
      });

      const result = readProbeResult(TEST_WD);
      expect(result).not.toBeNull();
      expect(result!.probeResult).toBe('pass');
    });

    it('returns shadow strategy when no probe', () => {
      expect(getRegistrationStrategy(TEST_WD)).toBe('shadow');
    });

    it('returns config strategy on pass', () => {
      writeProbeResult(TEST_WD, {
        probeResult: 'pass',
        probedAt: new Date().toISOString(),
        version: '1.0.0',
      });

      expect(getRegistrationStrategy(TEST_WD)).toBe('config');
    });
  });
});
