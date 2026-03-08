import { readFileSync } from 'fs';
import { join } from 'path';
import { isNexusEnabled } from './config.js';
import { collectSessionEvent } from './data-collector.js';
import { syncToRemote } from './consciousness-sync.js';
import { safeJsonParse } from '../../lib/safe-json.js';
function readToolCallsFromMetrics(directory) {
    try {
        const metricsPath = join(directory, '.omc', 'axiom', 'evolution', 'usage_metrics.json');
        const raw = readFileSync(metricsPath, 'utf-8');
        const result = safeJsonParse(raw, metricsPath);
        if (!result.success || !result.data?.tools)
            return [];
        const metrics = result.data;
        const tools = metrics.tools;
        if (!tools)
            return [];
        return Object.entries(tools)
            .filter(([key]) => key !== '')
            .sort(([, a], [, b]) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
            .slice(0, 20)
            .map(([toolName, stats]) => ({
            toolName,
            timestamp: new Date(stats.lastUsed).getTime(),
        }));
    }
    catch {
        return [];
    }
}
export async function handleNexusSessionEnd(input) {
    const work = async () => {
        try {
            if (!isNexusEnabled(input.directory)) {
                return { collected: false, synced: false };
            }
            const event = {
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
        }
        catch (e) {
            return {
                collected: false,
                synced: false,
                error: e instanceof Error ? e.message : String(e),
            };
        }
    };
    // 3-second timeout (same pattern as session-reflector.ts)
    let timeoutHandle;
    const timeout = new Promise(resolve => {
        timeoutHandle = setTimeout(() => resolve({ collected: false, synced: false, error: 'timeout' }), 3000);
    });
    try {
        return await Promise.race([work(), timeout]);
    }
    finally {
        clearTimeout(timeoutHandle);
    }
}
//# sourceMappingURL=session-end-hook.js.map