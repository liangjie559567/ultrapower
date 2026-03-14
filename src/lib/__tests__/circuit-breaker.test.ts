import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { CircuitBreakerService, generateTaskHash } from '../circuit-breaker.js';

const TEST_STATE_FILE = '.omc/state/circuit-breaker.json';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
    (CircuitBreakerService as any).instance = undefined;
    service = CircuitBreakerService.getInstance();
  });

  afterEach(() => {
    service.resetAll();
    if (fs.existsSync(TEST_STATE_FILE)) {
      fs.unlinkSync(TEST_STATE_FILE);
    }
  });

  it('should return same instance (singleton)', () => {
    const instance1 = CircuitBreakerService.getInstance();
    const instance2 = CircuitBreakerService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should upgrade haiku to sonnet after 3 failures', () => {
    const taskHash = generateTaskHash('test task');

    service.recordFailure(taskHash, 'test task', 'error 1', 'haiku');
    service.recordFailure(taskHash, 'test task', 'error 2', 'haiku');
    service.recordFailure(taskHash, 'test task', 'error 3', 'haiku');

    const nextModel = service.checkCircuit(taskHash);
    expect(nextModel).toBe('sonnet');

    const task = service.getTaskState(taskHash);
    expect(task?.current_model).toBe('sonnet');
    expect(task?.failure_count).toBe(0);
  });

  it('should upgrade sonnet to opus after 3 failures', () => {
    const taskHash = generateTaskHash('test task');

    service.recordFailure(taskHash, 'test task', 'error 1', 'sonnet');
    service.recordFailure(taskHash, 'test task', 'error 2', 'sonnet');
    service.recordFailure(taskHash, 'test task', 'error 3', 'sonnet');

    const nextModel = service.checkCircuit(taskHash);
    expect(nextModel).toBe('opus');
  });

  it('should return null when opus fails (no upgrade)', () => {
    const taskHash = generateTaskHash('test task');

    service.recordFailure(taskHash, 'test task', 'error 1', 'opus');
    service.recordFailure(taskHash, 'test task', 'error 2', 'opus');
    service.recordFailure(taskHash, 'test task', 'error 3', 'opus');

    const nextModel = service.checkCircuit(taskHash);
    expect(nextModel).toBeNull();
  });

  it('should return null after 6 attempts (human intervention)', () => {
    const taskHash = generateTaskHash('test task');

    for (let i = 0; i < 6; i++) {
      service.recordFailure(taskHash, 'test task', `error ${i}`, 'haiku');
    }

    const nextModel = service.checkCircuit(taskHash);
    expect(nextModel).toBeNull();

    const task = service.getTaskState(taskHash);
    expect(task?.total_attempts).toBe(6);
  });

  it('should track failure count and error history', () => {
    const taskHash = generateTaskHash('test task');

    service.recordFailure(taskHash, 'test task', 'error 1', 'haiku');
    service.recordFailure(taskHash, 'test task', 'error 2', 'haiku');

    const task = service.getTaskState(taskHash);
    expect(task?.failure_count).toBe(2);
    expect(task?.total_attempts).toBe(2);
    expect(task?.error_history).toHaveLength(2);
    expect(task?.error_history[0].error).toBe('error 1');
    expect(task?.error_history[1].error).toBe('error 2');
  });

  it('should remove task on success', () => {
    const taskHash = generateTaskHash('test task');

    service.recordFailure(taskHash, 'test task', 'error 1', 'haiku');
    expect(service.getTaskState(taskHash)).not.toBeNull();

    service.recordSuccess(taskHash);
    expect(service.getTaskState(taskHash)).toBeNull();
  });

  it('should persist and restore state from file', () => {
    const taskHash = generateTaskHash('test task');

    service.recordFailure(taskHash, 'test task', 'error 1', 'haiku');
    expect(fs.existsSync(TEST_STATE_FILE)).toBe(true);

    (CircuitBreakerService as any).instance = undefined;
    const newService = CircuitBreakerService.getInstance();

    const task = newService.getTaskState(taskHash);
    expect(task?.user_request).toBe('test task');
    expect(task?.failure_count).toBe(1);
  });

  it('should reset specific task', () => {
    const taskHash1 = generateTaskHash('task 1');
    const taskHash2 = generateTaskHash('task 2');

    service.recordFailure(taskHash1, 'task 1', 'error', 'haiku');
    service.recordFailure(taskHash2, 'task 2', 'error', 'haiku');

    service.resetTask(taskHash1);

    expect(service.getTaskState(taskHash1)).toBeNull();
    expect(service.getTaskState(taskHash2)).not.toBeNull();
  });

  it('should generate consistent normalized hash', () => {
    const hash1 = generateTaskHash('  Test Task  ');
    const hash2 = generateTaskHash('test task');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(16);
  });

  it('should handle corrupted state file gracefully', () => {
    const dir = '.omc/state';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TEST_STATE_FILE, 'invalid json');

    (CircuitBreakerService as any).instance = undefined;
    const newService = CircuitBreakerService.getInstance();

    expect(newService.getAllTasks()).toHaveLength(0);
  });

  it('should create directory if not exists', () => {
    const dir = '.omc/state';
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }

    const taskHash = generateTaskHash('test');
    service.recordFailure(taskHash, 'test', 'error', 'haiku');

    expect(fs.existsSync(dir)).toBe(true);
    expect(fs.existsSync(TEST_STATE_FILE)).toBe(true);
  });
});
