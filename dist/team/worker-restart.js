// src/team/worker-restart.ts
/**
 * Worker auto-restart with exponential backoff.
 *
 * Tracks restart attempts per worker in sidecar JSON files.
 * Uses exponential backoff to prevent rapid restart loops.
 */
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { atomicWriteJson, ensureDirWithMode, validateResolvedPath } from './fs-utils.js';
import { createWorkerAdapter } from '../workers/factory.js';
const DEFAULT_POLICY = {
    maxRestarts: 3,
    backoffBaseMs: 5000,
    backoffMaxMs: 60000,
    backoffMultiplier: 2,
};
function getRestartStatePath(workingDirectory, teamName, workerName) {
    return join(workingDirectory, '.omc', 'state', 'team-bridge', teamName, `${workerName}.restart.json`);
}
/**
 * Read the current restart state for a worker.
 * Returns null if no restart state exists.
 */
export async function readRestartState(workingDirectory, teamName, workerName) {
    const adapter = await createWorkerAdapter('auto', workingDirectory);
    if (!adapter) {
        return readRestartStateLegacy(workingDirectory, teamName, workerName);
    }
    const workerId = `team:${teamName}:${workerName}`;
    const worker = await adapter.get(workerId);
    if (!worker || !worker.metadata?.restartCount)
        return null;
    return {
        workerName,
        restartCount: worker.metadata.restartCount,
        lastRestartAt: worker.metadata.lastRestartAt,
        nextBackoffMs: worker.metadata.nextBackoffMs,
    };
}
function readRestartStateLegacy(workingDirectory, teamName, workerName) {
    const statePath = getRestartStatePath(workingDirectory, teamName, workerName);
    if (!existsSync(statePath))
        return null;
    try {
        return JSON.parse(readFileSync(statePath, 'utf-8'));
    }
    catch {
        return null;
    }
}
/**
 * Check if a dead worker should be restarted.
 * Uses exponential backoff: base * multiplier^count, capped at max.
 * Returns backoff delay in ms if restart allowed, null if exhausted.
 */
export async function shouldRestart(workingDirectory, teamName, workerName, policy = DEFAULT_POLICY) {
    const state = await readRestartState(workingDirectory, teamName, workerName);
    if (!state) {
        return policy.backoffBaseMs;
    }
    if (state.restartCount >= policy.maxRestarts) {
        return null;
    }
    const backoff = Math.min(policy.backoffBaseMs * Math.pow(policy.backoffMultiplier, state.restartCount), policy.backoffMaxMs);
    return backoff;
}
/**
 * Record a restart attempt (updates sidecar state).
 */
export async function recordRestart(workingDirectory, teamName, workerName, policy = DEFAULT_POLICY) {
    const adapter = await createWorkerAdapter('auto', workingDirectory);
    if (!adapter) {
        return recordRestartLegacy(workingDirectory, teamName, workerName, policy);
    }
    const workerId = `team:${teamName}:${workerName}`;
    const worker = await adapter.get(workerId);
    if (!worker) {
        // Worker not in adapter, use legacy
        return recordRestartLegacy(workingDirectory, teamName, workerName, policy);
    }
    const existing = await readRestartState(workingDirectory, teamName, workerName);
    const restartCount = (existing?.restartCount ?? 0) + 1;
    const nextBackoffMs = Math.min(policy.backoffBaseMs * Math.pow(policy.backoffMultiplier, restartCount), policy.backoffMaxMs);
    worker.metadata = {
        ...worker.metadata,
        restartCount,
        lastRestartAt: new Date().toISOString(),
        nextBackoffMs,
    };
    await adapter.upsert(worker);
}
function recordRestartLegacy(workingDirectory, teamName, workerName, policy) {
    const statePath = getRestartStatePath(workingDirectory, teamName, workerName);
    validateResolvedPath(statePath, workingDirectory);
    const dir = join(workingDirectory, '.omc', 'state', 'team-bridge', teamName);
    ensureDirWithMode(dir);
    const existing = readRestartStateLegacy(workingDirectory, teamName, workerName);
    const newState = {
        workerName,
        restartCount: (existing?.restartCount ?? 0) + 1,
        lastRestartAt: new Date().toISOString(),
        nextBackoffMs: Math.min(policy.backoffBaseMs * Math.pow(policy.backoffMultiplier, (existing?.restartCount ?? 0) + 1), policy.backoffMaxMs),
    };
    atomicWriteJson(statePath, newState);
}
/**
 * Clear restart state for a worker (e.g., after successful recovery).
 */
export async function clearRestartState(workingDirectory, teamName, workerName) {
    const adapter = await createWorkerAdapter('auto', workingDirectory);
    if (!adapter) {
        return clearRestartStateLegacy(workingDirectory, teamName, workerName);
    }
    const workerId = `team:${teamName}:${workerName}`;
    const worker = await adapter.get(workerId);
    if (!worker) {
        // Worker not in adapter, use legacy
        return clearRestartStateLegacy(workingDirectory, teamName, workerName);
    }
    if (worker.metadata) {
        delete worker.metadata.restartCount;
        delete worker.metadata.lastRestartAt;
        delete worker.metadata.nextBackoffMs;
        await adapter.upsert(worker);
    }
}
function clearRestartStateLegacy(workingDirectory, teamName, workerName) {
    const statePath = getRestartStatePath(workingDirectory, teamName, workerName);
    try {
        if (existsSync(statePath)) {
            unlinkSync(statePath);
        }
    }
    catch { /* ignore */ }
}
/**
 * Synthesize a BridgeConfig from an McpWorkerMember record + sensible defaults.
 * Used at restart time. Does NOT persist BridgeConfig to disk.
 */
export function synthesizeBridgeConfig(worker, teamName) {
    return {
        workerName: worker.name,
        teamName,
        workingDirectory: worker.cwd,
        provider: worker.agentType.replace('mcp-', ''),
        model: worker.model,
        pollIntervalMs: 3000,
        taskTimeoutMs: 600000,
        maxConsecutiveErrors: 3,
        outboxMaxLines: 500,
        maxRetries: 5,
    };
}
//# sourceMappingURL=worker-restart.js.map