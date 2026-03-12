import { promises as fs } from 'fs';
import { join } from 'path';

interface UsageStats {
  path: string;
  accessCount: number;
  lastAccessed: string;
  size: number;
}

const STATS_FILE = '.omc/document-usage-stats.json';

export async function trackAccess(dir: string, filename: string): Promise<void> {
  const statsPath = join(dir, STATS_FILE);
  let stats: Record<string, UsageStats> = {};

  try {
    const content = await fs.readFile(statsPath, 'utf-8');
    stats = JSON.parse(content);
  } catch {
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
  } catch {
    // File may not exist
  }

  await fs.mkdir(join(dir, '.omc'), { recursive: true });
  await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
}

export async function getCleanupCandidates(
  dir: string,
  minAccessCount = 2,
  maxAgeDays = 30
): Promise<string[]> {
  const statsPath = join(dir, STATS_FILE);
  const candidates: string[] = [];

  try {
    const content = await fs.readFile(statsPath, 'utf-8');
    const stats: Record<string, UsageStats> = JSON.parse(content);
    const now = Date.now();

    for (const [filename, stat] of Object.entries(stats)) {
      if (stat.accessCount < minAccessCount) {
        const age = (now - new Date(stat.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
        if (age > maxAgeDays) {
          candidates.push(filename);
        }
      }
    }
  } catch (err) {
    throw new Error(`Failed to get cleanup candidates: ${err instanceof Error ? err.message : String(err)}`);
  }

  return candidates;
}
