import { readFileSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled } from './config.js';
import { collectSessionEvent } from './data-collector.js';
import { syncToRemote } from './consciousness-sync.js';
import type { SessionEvent, ToolCallRecord } from './types.js';

function readToolCallsFromMetrics(directory: string): ToolCallRecord[] {
  try {
    const metricsPath = join(directory, '.omc', 'axiom', 'evolution', 'usage_metrics.json');
    const raw = readFileSync(metricsPath, 'utf-8');
    const metrics = JSON.parse(raw) as {
      tools?: Record<string, { totalCalls: number; lastUsed: string }>;
    };
    if (!metrics.tools) return [];
    return Object.entries(metrics.tools)
      .filter(([key]) => key !== '')
      .sort(([, a], [, b]) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 20)
      .map(([toolName, stats]) => ({
        toolName,
        timestamp: new Date(stats.lastUsed).getTime(),
      }));
  } catch {
    return [];
  }
}

export interface NexusSessionEndInput {
  sessionId: string;
  directory: string;
  durationMs?: number;
  agentsSpawned?: number;
  agentsCompleted?: number;
  modesUsed?: string[];
  skillsInjected?: string[];
}

export interface NexusSessionEndResult {
  collected: boolean;
  synced: boolean;
  error?: string;
}

export async function handleNexusSessionEnd(
  input: NexusSessionEndInput
): Promise<NexusSessionEndResult> {
  const work = async (): Promise<NexusSessionEndResult> => {
    try {
      if (!isNexusEnabled(input.directory)) {
        return { collected: false, synced: false };
      }

      const event: SessionEvent = {
        sessionId: input.sessionId,
        timestamp: new Date().toISOString(),
        directory: input.directory,
        durationMs: input.durationMs,
        toolCalls: readToolCallsFromMetrics(input.directory),
        agentsSpawned: input.agentsSpawned ?? 0,
        agentsCompleted: input.agentsCompleted ?? 0,
        modesUsed: input.modesUsed ?? [],
        skillsInjected: input.skillsInjected ?? [],
        patternsSeen: [],
      };

      await collectSessionEvent(input.directory, event);

      const syncResult = await syncToRemote(input.directory, input.sessionId);

      return {
        collected: true,
        synced: syncResult.success && (syncResult.filesCommitted ?? 0) > 0,
      };
    } catch (e) {
      return {
        collected: false,
        synced: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  };

  // 3-second timeout (same pattern as session-reflector.ts)
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<NexusSessionEndResult>(resolve => {
    timeoutHandle = setTimeout(
      () => resolve({ collected: false, synced: false, error: 'timeout' }),
      3000
    );
  });

  try {
    return await Promise.race([work(), timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
}
