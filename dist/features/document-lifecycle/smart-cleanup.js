import { promises as fs } from 'fs';
import { join } from 'path';
const STATS_FILE = '.omc/document-usage-stats.json';
export async function trackAccess(dir, filename) {
    const statsPath = join(dir, STATS_FILE);
    let stats = {};
    try {
        const content = await fs.readFile(statsPath, 'utf-8');
        stats = JSON.parse(content);
    }
    catch {
        // New stats file
    }
    const key = filename;
    if (!stats[key]) {
        stats[key] = { path: filename, accessCount: 0, lastAccessed: '', size: 0 };
    }
    stats[key].accessCount++;
    stats[key].lastAccessed = new Date().toISOString();
    try {
        const filePath = join(dir, filename);
        const stat = await fs.stat(filePath);
        stats[key].size = stat.size;
    }
    catch {
        // File may not exist
    }
    await fs.mkdir(join(dir, '.omc'), { recursive: true });
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
}
export async function getCleanupCandidates(dir, minAccessCount = 2, maxAgeDays = 30) {
    const statsPath = join(dir, STATS_FILE);
    const candidates = [];
    try {
        const content = await fs.readFile(statsPath, 'utf-8');
        const stats = JSON.parse(content);
        const now = Date.now();
        for (const [filename, stat] of Object.entries(stats)) {
            if (stat.accessCount < minAccessCount) {
                const age = (now - new Date(stat.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
                if (age > maxAgeDays) {
                    candidates.push(filename);
                }
            }
        }
    }
    catch (err) {
        throw new Error(`Failed to get cleanup candidates: ${err instanceof Error ? err.message : String(err)}`);
    }
    return candidates;
}
//# sourceMappingURL=smart-cleanup.js.map