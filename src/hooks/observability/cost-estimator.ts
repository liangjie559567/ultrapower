import { randomUUID } from 'crypto';
import { WriteQueue } from './write-queue.js';

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_write_tokens?: number;
  cache_read_tokens?: number;
}

const PRICING: Record<string, [number, number, number, number]> = {
  haiku:  [0.80,  4.00,  1.00, 0.08],
  sonnet: [3.00,  15.00, 3.75, 0.30],
  opus:   [15.00, 75.00, 18.75, 1.50],
};

function getModelKey(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('haiku')) return 'haiku';
  if (m.includes('opus')) return 'opus';
  return 'sonnet';
}

export class CostEstimator {
  private _queue = new WriteQueue();

  estimateCost(model: string, usage: TokenUsage): number {
    const [ip, op, cw, cr] = PRICING[getModelKey(model)]!;
    return (
      (usage.input_tokens * ip +
       usage.output_tokens * op +
       (usage.cache_write_tokens ?? 0) * cw +
       (usage.cache_read_tokens ?? 0) * cr) / 1_000_000
    );
  }

  record(opts: { session_id: string; agent_run_id?: string; model: string; usage: TokenUsage }): void {
    const { session_id, agent_run_id, model, usage } = opts;
    this._queue.enqueue({
      table: 'cost_records',
      row: {
        id: randomUUID(),
        session_id,
        agent_run_id: agent_run_id ?? null,
        model,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cache_write_tokens: usage.cache_write_tokens ?? 0,
        cache_read_tokens: usage.cache_read_tokens ?? 0,
        cost_usd: this.estimateCost(model, usage),
        recorded_at: Date.now(),
      },
    });
    this._queue.flush();
  }
}

export const costEstimator = new CostEstimator();
