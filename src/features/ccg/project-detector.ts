import { promises as fs } from 'fs';
import * as path from 'path';

export type ProjectType = 'new' | 'old';

export interface DetectionResult {
  type: ProjectType;
  confidence: number;
  reason: string;
}

const cache = new Map<string, DetectionResult>();

export async function detectProjectType(
  workingDir: string,
  manualType?: ProjectType
): Promise<DetectionResult> {
  if (manualType) {
    return {
      type: manualType,
      confidence: 1.0,
      reason: 'Manually specified by user',
    };
  }

  const cached = cache.get(workingDir);
  if (cached) return cached;

  const featureFlowPath = path.join(workingDir, 'feature-flow.md');

  try {
    await fs.access(featureFlowPath);
    const result = {
      type: 'old' as ProjectType,
      confidence: 1.0,
      reason: 'feature-flow.md exists',
    };
    cache.set(workingDir, result);
    return result;
  } catch {
    const result = {
      type: 'new' as ProjectType,
      confidence: 1.0,
      reason: 'feature-flow.md not found',
    };
    cache.set(workingDir, result);
    return result;
  }
}

export function clearCache(): void {
  cache.clear();
}
