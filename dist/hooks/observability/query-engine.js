import { getDb } from './db.js';
function p95(values) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.95);
    return sorted[Math.min(idx, sorted.length - 1)];
}
export class QueryEngine {
    getAgentRuns(opts = {}) {
        const db = getDb();
        let sql = 'SELECT agent_type, COUNT(*) as count, AVG(duration_ms) as avg_ms, SUM(duration_ms) as total_ms FROM agent_runs WHERE 1=1';
        const params = [];
        if (opts.session_id) {
            sql += ' AND session_id = ?';
            params.push(opts.session_id);
        }
        if (opts.agent_type) {
            sql += ' AND agent_type = ?';
            params.push(opts.agent_type);
        }
        sql += ' GROUP BY agent_type';
        if (opts.last) {
            sql += ' LIMIT ?';
            params.push(opts.last);
        }
        return db.prepare(sql).all(...params).map(r => ({
            ...r, avg_ms: Math.round(r.avg_ms ?? 0), total_ms: r.total_ms ?? 0,
        }));
    }
    getToolCalls(opts = {}) {
        const db = getDb();
        let sql = 'SELECT tool_name, success, duration_ms FROM tool_calls WHERE 1=1';
        const params = [];
        if (opts.session_id) {
            sql += ' AND session_id = ?';
            params.push(opts.session_id);
        }
        if (opts.tool_name) {
            sql += ' AND tool_name = ?';
            params.push(opts.tool_name);
        }
        sql += ' ORDER BY start_time DESC LIMIT 1000';
        const rows = db.prepare(sql).all(...params);
        const byTool = new Map();
        for (const r of rows) {
            const e = byTool.get(r.tool_name) ?? { durations: [], failures: 0, total: 0 };
            e.total++;
            if (r.duration_ms != null)
                e.durations.push(r.duration_ms);
            if (!r.success)
                e.failures++;
            byTool.set(r.tool_name, e);
        }
        let results = [];
        for (const [tool_name, { durations, failures, total }] of byTool) {
            const count = durations.length;
            const avg_ms = count ? Math.round(durations.reduce((a, b) => a + b, 0) / count) : 0;
            results.push({ tool_name, count, avg_ms, p95_ms: p95(durations), failure_rate: total ? failures / total : 0 });
        }
        if (opts.last)
            results = results.slice(0, opts.last);
        return results;
    }
    getCostSummary(opts = {}) {
        const db = getDb();
        let sql = 'SELECT model, SUM(cost_usd) as total_cost_usd, SUM(input_tokens) as total_input_tokens, SUM(output_tokens) as total_output_tokens FROM cost_records WHERE 1=1';
        const params = [];
        if (opts.session_id) {
            sql += ' AND session_id = ?';
            params.push(opts.session_id);
        }
        sql += ' GROUP BY model';
        return db.prepare(sql).all(...params);
    }
}
export const queryEngine = new QueryEngine();
//# sourceMappingURL=query-engine.js.map