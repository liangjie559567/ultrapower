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

function isValidImprovementSuggestion(obj: unknown): obj is ImprovementSuggestion {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'status' in obj
  );
}

export function loadPendingImprovements(directory: string): ImprovementSuggestion[] {
  const improvementsDir = getImprovementsDir(directory);
  if (!existsSync(improvementsDir)) return [];
  const results: ImprovementSuggestion[] = [];
  for (const file of readdirSync(improvementsDir)) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = readFileSync(join(improvementsDir, file), 'utf-8');
      const imp = JSON.parse(raw) as unknown;
      if (!isValidImprovementSuggestion(imp)) continue;
      if (imp.status === 'pending') results.push(imp);
    } catch (err) {
      if (!(err instanceof SyntaxError)) {
        // Non-JSON parse error (e.g. file read failure) — log warning
        console.warn(`[improvement-puller] failed to read file ${file}:`, err);
      }
      // SyntaxError = malformed JSON, silently skip
    }
  }
  return results;
}

export function pullImprovements(directory: string): PullResult {
  const improvements = loadPendingImprovements(directory);
  return { pulled: improvements.length, improvements };
}
