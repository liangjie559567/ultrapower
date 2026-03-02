import { getDb } from './db.js';

export interface AgentRunSummary {
  agent_type: string; count: number; avg_ms: number; total_ms: number;
}
export interface ToolCallSummary {
  tool_name: string; count: number; avg_ms: number; p95_ms: number; failure_rate: number;
}
export interface CostSummary {
  model: string; total_cost_usd: number; total_input_tokens: number; total_output_tokens: number;
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.95);
  return sorted[Math.min(idx, sorted.length - 1)]!;
}

export class QueryEngine {
  getAgentRuns(opts: { session_id?: string; agent_type?: string; last?: number } = {}): AgentRunSummary[] {
    const db = getDb();
    let sql = 'SELECT agent_type, COUNT(*) as count, AVG(duration_ms) as avg_ms, SUM(duration_ms) as total_ms FROM agent_runs WHERE 1=1';
    const params: unknown[] = [];
    if (opts.session_id) { sql += ' AND session_id = ?'; params.push(opts.session_id); }
    if (opts.agent_type) { sql += ' AND agent_type = ?'; params.push(opts.agent_type); }
    sql += ' GROUP BY agent_type';
    if (opts.last) { sql += ' LIMIT ?'; params.push(opts.last); }
    return (db.prepare(sql).all(...params) as AgentRunSummary[]).map(r => ({
      ...r, avg_ms: Math.round(r.avg_ms ?? 0), total_ms: r.total_ms ?? 0,
    }));
  }

  getToolCalls(opts: { session_id?: string; tool_name?: string; last?: number } = {}): ToolCallSummary[] {
    const db = getDb();
    let sql = 'SELECT tool_name, success, duration_ms FROM tool_calls WHERE 1=1';
    const params: unknown[] = [];
    if (opts.session_id) { sql += ' AND session_id = ?'; params.push(opts.session_id); }
    if (opts.tool_name) { sql += ' AND tool_name = ?'; params.push(opts.tool_name); }
    sql += ' ORDER BY start_time DESC LIMIT 1000';
    const rows = db.prepare(sql).all(...params) as { tool_name: string; success: number; duration_ms: number | null }[];

    const byTool = new Map<string, { durations: number[]; failures: number; total: number }>();
    for (const r of rows) {
      const e = byTool.get(r.tool_name) ?? { durations: [], failures: 0, total: 0 };
      e.total++;
      if (r.duration_ms != null) e.durations.push(r.duration_ms);
      if (!r.success) e.failures++;
      byTool.set(r.tool_name, e);
    }

    let results: ToolCallSummary[] = [];
    for (const [tool_name, { durations, failures, total }] of byTool) {
      const count = durations.length;
      const avg_ms = count ? Math.round(durations.reduce((a, b) => a + b, 0) / count) : 0;
      results.push({ tool_name, count, avg_ms, p95_ms: p95(durations), failure_rate: total ? failures / total : 0 });
    }
    if (opts.last) results = results.slice(0, opts.last);
    return results;
  }

  getCostSummary(opts: { session_id?: string } = {}): CostSummary[] {
    const db = getDb();
    let sql = 'SELECT model, SUM(cost_usd) as total_cost_usd, SUM(input_tokens) as total_input_tokens, SUM(output_tokens) as total_output_tokens FROM cost_records WHERE 1=1';
    const params: unknown[] = [];
    if (opts.session_id) { sql += ' AND session_id = ?'; params.push(opts.session_id); }
    sql += ' GROUP BY model';
    return db.prepare(sql).all(...params) as CostSummary[];
  }
}

export const queryEngine = new QueryEngine();
