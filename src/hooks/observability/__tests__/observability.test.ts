import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, resetDb } from '../db.js';
import { WriteQueue } from '../write-queue.js';
import { AgentTracker } from '../agent-tracker.js';
import { ToolTracker } from '../tool-tracker.js';
import { CostEstimator } from '../cost-estimator.js';
import { QueryEngine } from '../query-engine.js';

const MEM = ':memory:';

beforeEach(() => {
  resetDb();
  getDb(MEM);
});

// --- db ---
describe('db', () => {
  it('creates tables', () => {
    const db = getDb(MEM);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('agent_runs');
    expect(names).toContain('tool_calls');
    expect(names).toContain('cost_records');
  });

  it('resetDb clears singleton', () => {
    const db1 = getDb(MEM);
    resetDb();
    const db2 = getDb(MEM);
    expect(db1).not.toBe(db2);
  });
});

// --- write-queue ---
describe('WriteQueue', () => {
  it('flush inserts row', () => {
    const q = new WriteQueue();
    q.enqueue({ table: 'agent_runs', row: { id: 'r1', session_id: 's1', agent_type: 'executor', model: 'sonnet', start_time: 1, status: 'running' } });
    q.flush();
    const row = getDb(MEM).prepare('SELECT id FROM agent_runs WHERE id=?').get('r1');
    expect(row).toBeTruthy();
  });

  it('pending count tracks queue', () => {
    const q = new WriteQueue();
    expect(q.pending).toBe(0);
    q.enqueue({ table: 'agent_runs', row: { id: 'r2', session_id: 's1', agent_type: 'executor', model: 'sonnet', start_time: 1, status: 'running' } });
    expect(q.pending).toBe(1);
    q.flush();
    expect(q.pending).toBe(0);
  });
});

// --- agent-tracker ---
describe('AgentTracker', () => {
  it('startRun returns uuid and inserts row', () => {
    const t = new AgentTracker();
    const id = t.startRun({ session_id: 's1', agent_type: 'executor', model: 'sonnet' });
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const row = getDb(MEM).prepare('SELECT status FROM agent_runs WHERE id=?').get(id) as { status: string };
    expect(row?.status).toBe('running');
  });

  it('endRun sets completed status and duration_ms', () => {
    const t = new AgentTracker();
    const id = t.startRun({ session_id: 's1', agent_type: 'executor', model: 'sonnet' });
    t.endRun(id, 'completed');
    const row = getDb(MEM).prepare('SELECT status, duration_ms FROM agent_runs WHERE id=?').get(id) as { status: string; duration_ms: number };
    expect(row?.status).toBe('completed');
    expect(row?.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('endRun with failed status', () => {
    const t = new AgentTracker();
    const id = t.startRun({ session_id: 's1', agent_type: 'executor', model: 'sonnet' });
    t.endRun(id, 'failed');
    const row = getDb(MEM).prepare('SELECT status FROM agent_runs WHERE id=?').get(id) as { status: string };
    expect(row?.status).toBe('failed');
  });

  it('supports parent_run_id', () => {
    const t = new AgentTracker();
    const id = t.startRun({ session_id: 's1', agent_type: 'executor', model: 'sonnet', parent_run_id: 'parent-1' });
    const row = getDb(MEM).prepare('SELECT parent_run_id FROM agent_runs WHERE id=?').get(id) as { parent_run_id: string };
    expect(row?.parent_run_id).toBe('parent-1');
  });
});

// --- tool-tracker ---
describe('ToolTracker', () => {
  it('startCall inserts row', () => {
    const t = new ToolTracker();
    const id = t.startCall({ session_id: 's1', tool_name: 'Bash' });
    const row = getDb(MEM).prepare('SELECT tool_name FROM tool_calls WHERE id=?').get(id) as { tool_name: string };
    expect(row?.tool_name).toBe('Bash');
  });

  it('endCall sets success and duration_ms', () => {
    const t = new ToolTracker();
    const id = t.startCall({ session_id: 's1', tool_name: 'Read' });
    t.endCall(id, true);
    const row = getDb(MEM).prepare('SELECT success, duration_ms FROM tool_calls WHERE id=?').get(id) as { success: number; duration_ms: number };
    expect(row?.success).toBe(1);
    expect(row?.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('endCall records failure and error_msg', () => {
    const t = new ToolTracker();
    const id = t.startCall({ session_id: 's1', tool_name: 'Write' });
    t.endCall(id, false, 'permission denied');
    const row = getDb(MEM).prepare('SELECT success, error_msg FROM tool_calls WHERE id=?').get(id) as { success: number; error_msg: string };
    expect(row?.success).toBe(0);
    expect(row?.error_msg).toBe('permission denied');
  });
});

// --- cost-estimator ---
describe('CostEstimator', () => {
  it('estimateCost haiku', () => {
    const e = new CostEstimator();
    const cost = e.estimateCost('claude-haiku-4-5', { input_tokens: 1000, output_tokens: 1000 });
    expect(cost).toBeCloseTo((0.80 + 4.00) / 1000, 6);
  });

  it('estimateCost sonnet', () => {
    const e = new CostEstimator();
    const cost = e.estimateCost('claude-sonnet-4-6', { input_tokens: 1_000_000, output_tokens: 0 });
    expect(cost).toBeCloseTo(3.00, 4);
  });

  it('estimateCost opus', () => {
    const e = new CostEstimator();
    const cost = e.estimateCost('claude-opus-4-6', { input_tokens: 0, output_tokens: 1_000_000 });
    expect(cost).toBeCloseTo(75.00, 4);
  });

  it('estimateCost includes cache tokens', () => {
    const e = new CostEstimator();
    const cost = e.estimateCost('sonnet', { input_tokens: 0, output_tokens: 0, cache_write_tokens: 1_000_000, cache_read_tokens: 0 });
    expect(cost).toBeCloseTo(3.75, 4);
  });

  it('record inserts cost_record row', () => {
    const e = new CostEstimator();
    e.record({ session_id: 's1', model: 'sonnet', usage: { input_tokens: 100, output_tokens: 50 } });
    const row = getDb(MEM).prepare('SELECT model FROM cost_records WHERE session_id=?').get('s1') as { model: string };
    expect(row?.model).toBe('sonnet');
  });
});

// --- query-engine ---
describe('QueryEngine', () => {
  it('getAgentRuns returns summary', () => {
    const t = new AgentTracker();
    const id = t.startRun({ session_id: 'q1', agent_type: 'executor', model: 'sonnet' });
    t.endRun(id);
    const q = new QueryEngine();
    const rows = q.getAgentRuns({ session_id: 'q1' });
    expect(rows.length).toBe(1);
    expect(rows[0]!.agent_type).toBe('executor');
    expect(rows[0]!.count).toBe(1);
  });

  it('getToolCalls computes p95', () => {
    const t = new ToolTracker();
    for (let i = 0; i < 10; i++) {
      const id = t.startCall({ session_id: 'q2', tool_name: 'Read' });
      t.endCall(id, true);
    }
    const q = new QueryEngine();
    const rows = q.getToolCalls({ session_id: 'q2' });
    expect(rows.length).toBe(1);
    expect(rows[0]!.p95_ms).toBeGreaterThanOrEqual(0);
  });

  it('getToolCalls failure_rate', () => {
    const t = new ToolTracker();
    const id1 = t.startCall({ session_id: 'q3', tool_name: 'Write' });
    t.endCall(id1, true);
    const id2 = t.startCall({ session_id: 'q3', tool_name: 'Write' });
    t.endCall(id2, false);
    const q = new QueryEngine();
    const rows = q.getToolCalls({ session_id: 'q3' });
    expect(rows[0]!.failure_rate).toBeCloseTo(0.5, 2);
  });

  it('getCostSummary aggregates by model', () => {
    const e = new CostEstimator();
    e.record({ session_id: 'q4', model: 'haiku', usage: { input_tokens: 1000, output_tokens: 500 } });
    e.record({ session_id: 'q4', model: 'haiku', usage: { input_tokens: 1000, output_tokens: 500 } });
    const q = new QueryEngine();
    const rows = q.getCostSummary({ session_id: 'q4' });
    expect(rows.length).toBe(1);
    expect(rows[0]!.total_input_tokens).toBe(2000);
  });
});
