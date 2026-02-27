import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ImprovementSuggestion } from './types.js';

export interface PullResult {
  pulled: number;
  improvements: ImprovementSuggestion[];
}

export function getImprovementsDir(directory: string): string {
  return join(directory, '.omc/nexus/improvements');
}

export function loadPendingImprovements(directory: string): ImprovementSuggestion[] {
  const improvementsDir = getImprovementsDir(directory);
  if (!existsSync(improvementsDir)) return [];
  const results: ImprovementSuggestion[] = [];
  for (const file of readdirSync(improvementsDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = readFileSync(join(improvementsDir, file), 'utf-8');
      const imp = JSON.parse(raw) as ImprovementSuggestion;
      if (imp.status === 'pending') results.push(imp);
    } catch {
      // Skip malformed files
    }
  }
  return results;
}

export function pullImprovements(directory: string): PullResult {
  const improvements = loadPendingImprovements(directory);
  return { pulled: improvements.length, improvements };
}
