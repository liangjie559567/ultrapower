/**
 * JSON Worker State Adapter
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('workers:json-adapter');
export class JsonWorkerAdapter {
    cwd;
    stateDir;
    constructor(cwd) {
        this.cwd = cwd;
        this.stateDir = join(cwd, '.omc', 'state', 'workers');
    }
    async init() {
        try {
            if (!existsSync(this.stateDir)) {
                mkdirSync(this.stateDir, { recursive: true });
            }
            return true;
        }
        catch (error) {
            logger.error('[JsonWorkerAdapter] Init failed:', error);
            return false;
        }
    }
    async upsert(worker) {
        try {
            const filePath = this.getWorkerFilePath(worker.workerId);
            const tempPath = `${filePath}.tmp`;
            writeFileSync(tempPath, JSON.stringify(worker, null, 2), 'utf-8');
            if (existsSync(filePath)) {
                unlinkSync(filePath);
            }
            writeFileSync(filePath, readFileSync(tempPath, 'utf-8'));
            unlinkSync(tempPath);
            return true;
        }
        catch (error) {
            logger.error('[JsonWorkerAdapter] Upsert failed:', error);
            return false;
        }
    }
    async get(workerId) {
        try {
            const filePath = this.getWorkerFilePath(workerId);
            if (!existsSync(filePath))
                return null;
            const content = readFileSync(filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            logger.error('[JsonWorkerAdapter] Get failed:', error);
            return null;
        }
    }
    async list(filter) {
        try {
            if (!existsSync(this.stateDir))
                return [];
            const files = readdirSync(this.stateDir).filter(f => f.endsWith('.json'));
            const workers = [];
            for (const file of files) {
                try {
                    const content = readFileSync(join(this.stateDir, file), 'utf-8');
                    const worker = JSON.parse(content);
                    if (this.matchesFilter(worker, filter)) {
                        workers.push(worker);
                    }
                }
                catch {
                    // Skip corrupted files
                }
            }
            workers.sort((a, b) => new Date(b.spawnedAt).getTime() - new Date(a.spawnedAt).getTime());
            return workers;
        }
        catch (error) {
            logger.error('[JsonWorkerAdapter] List failed:', error);
            return [];
        }
    }
    async delete(workerId) {
        try {
            const filePath = this.getWorkerFilePath(workerId);
            if (!existsSync(filePath))
                return false;
            unlinkSync(filePath);
            return true;
        }
        catch (error) {
            logger.error('[JsonWorkerAdapter] Delete failed:', error);
            return false;
        }
    }
    async healthCheck(workerId, maxHeartbeatAge = 30000) {
        const worker = await this.get(workerId);
        if (!worker)
            return { isAlive: false };
        const now = Date.now();
        let heartbeatAge;
        if (worker.lastHeartbeatAt) {
            heartbeatAge = now - new Date(worker.lastHeartbeatAt).getTime();
        }
        const isAlive = worker.status === 'running' || worker.status === 'working'
            ? (heartbeatAge !== undefined && heartbeatAge < maxHeartbeatAge)
            : worker.status !== 'dead';
        const uptimeMs = now - new Date(worker.spawnedAt).getTime();
        return { isAlive, heartbeatAge, lastError: worker.error, uptimeMs };
    }
    async batchUpsert(workers) {
        let count = 0;
        for (const worker of workers) {
            if (await this.upsert(worker))
                count++;
        }
        return count;
    }
    async cleanup(maxAgeMs) {
        try {
            const workers = await this.list();
            let count = 0;
            for (const worker of workers) {
                const isTerminal = ['completed', 'failed', 'timeout', 'dead'].includes(worker.status);
                const timestamp = worker.completedAt || worker.spawnedAt;
                const age = Date.now() - new Date(timestamp).getTime();
                if (isTerminal && age > maxAgeMs) {
                    if (await this.delete(worker.workerId))
                        count++;
                }
            }
            return count;
        }
        catch (error) {
            logger.error('[JsonWorkerAdapter] Cleanup failed:', error);
            return 0;
        }
    }
    async close() {
        // No resources to clean up
    }
    getWorkerFilePath(workerId) {
        const safeId = workerId.replace(/[^a-zA-Z0-9_-]/g, '_');
        return join(this.stateDir, `${safeId}.json`);
    }
    matchesFilter(worker, filter) {
        if (!filter)
            return true;
        if (filter.workerType && worker.workerType !== filter.workerType)
            return false;
        if (filter.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
            if (!statuses.includes(worker.status))
                return false;
        }
        if (filter.teamName && worker.teamName !== filter.teamName)
            return false;
        if (filter.provider && worker.provider !== filter.provider)
            return false;
        if (filter.spawnedAfter) {
            const spawnedAt = new Date(worker.spawnedAt);
            if (spawnedAt < filter.spawnedAfter)
                return false;
        }
        if (filter.spawnedBefore) {
            const spawnedAt = new Date(worker.spawnedAt);
            if (spawnedAt > filter.spawnedBefore)
                return false;
        }
        return true;
    }
}
//# sourceMappingURL=json-adapter.js.map