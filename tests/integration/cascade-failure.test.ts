import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_DIR = path.join(process.cwd(), '.omc-test-cascade');

interface Task {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  blockedBy?: string[];
  metadata?: {
    weakDependencies?: string[];
    skipped_reason?: string;
    degraded?: boolean;
    degraded_reason?: string;
  };
}

interface Agent {
  id: string;
  type: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'running' | 'failed' | 'completed';
}

function propagateFailure(
  failedAgentId: string,
  tasks: Task[],
  strategy: 'stop_all' | 'stop_hard_deps' | 'degrade'
): string[] {
  const affected: string[] = [];

  for (const task of tasks) {
    if (task.blockedBy?.includes(failedAgentId)) {
      const isHardDep = !task.metadata?.weakDependencies?.includes(failedAgentId);

      if (strategy === 'stop_all' || (strategy === 'stop_hard_deps' && isHardDep)) {
        task.status = 'skipped';
        task.metadata = task.metadata || {};
        task.metadata.skipped_reason = `Upstream agent ${failedAgentId} failed`;
        affected.push(task.taskId);

        affected.push(...propagateFailure(task.taskId, tasks, strategy));
      } else if (strategy === 'degrade') {
        task.metadata = task.metadata || {};
        task.metadata.degraded = true;
        task.metadata.degraded_reason = `Weak dependency ${failedAgentId} failed`;
      }
    }
  }

  return affected;
}

describe('Cascade Failure Test Suite', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should stop all dependent executors when planner fails (critical)', async () => {
    const tasks: Task[] = [
      { taskId: 'planner-1', status: 'failed', blockedBy: [] },
      { taskId: 'executor-1', status: 'pending', blockedBy: ['planner-1'] },
      { taskId: 'executor-2', status: 'pending', blockedBy: ['planner-1'] },
      { taskId: 'executor-3', status: 'pending', blockedBy: ['executor-1'] }
    ];

    const affected = propagateFailure('planner-1', tasks, 'stop_all');

    expect(affected).toContain('executor-1');
    expect(affected).toContain('executor-2');
    expect(affected).toContain('executor-3');
    expect(tasks.find(t => t.taskId === 'executor-1')?.status).toBe('skipped');
    expect(tasks.find(t => t.taskId === 'executor-2')?.status).toBe('skipped');
    expect(tasks.find(t => t.taskId === 'executor-3')?.status).toBe('skipped');
    expect(tasks.find(t => t.taskId === 'executor-1')?.metadata?.skipped_reason).toContain('planner-1');
  });

  it('should continue non-critical agents when writer fails (low priority)', async () => {
    const tasks: Task[] = [
      { taskId: 'writer-1', status: 'failed', blockedBy: [] },
      { taskId: 'executor-1', status: 'pending', blockedBy: [] },
      { taskId: 'verifier-1', status: 'pending', blockedBy: [] }
    ];

    const affected = propagateFailure('writer-1', tasks, 'degrade');

    expect(affected).toHaveLength(0);
    expect(tasks.find(t => t.taskId === 'executor-1')?.status).toBe('pending');
    expect(tasks.find(t => t.taskId === 'verifier-1')?.status).toBe('pending');
  });

  it('should use degraded mode when weak dependency fails', async () => {
    const tasks: Task[] = [
      { taskId: 'optimizer-1', status: 'failed', blockedBy: [] },
      {
        taskId: 'executor-1',
        status: 'pending',
        blockedBy: ['optimizer-1'],
        metadata: { weakDependencies: ['optimizer-1'] }
      }
    ];

    const affected = propagateFailure('optimizer-1', tasks, 'degrade');

    expect(affected).toHaveLength(0);
    expect(tasks.find(t => t.taskId === 'executor-1')?.status).toBe('pending');
    expect(tasks.find(t => t.taskId === 'executor-1')?.metadata?.degraded).toBe(true);
    expect(tasks.find(t => t.taskId === 'executor-1')?.metadata?.degraded_reason).toContain('optimizer-1');
  });
});
