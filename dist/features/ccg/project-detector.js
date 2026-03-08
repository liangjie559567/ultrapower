import { promises as fs } from 'fs';
import * as path from 'path';
const cache = new Map();
export async function detectProjectType(workingDir, manualType) {
    if (manualType) {
        return {
            type: manualType,
            confidence: 1.0,
            reason: 'Manually specified by user',
        };
    }
    const cached = cache.get(workingDir);
    if (cached)
        return cached;
    const featureFlowPath = path.join(workingDir, 'feature-flow.md');
    try {
        await fs.access(featureFlowPath);
        const result = {
            type: 'old',
            confidence: 1.0,
            reason: 'feature-flow.md exists',
        };
        cache.set(workingDir, result);
        return result;
    }
    catch {
        const result = {
            type: 'new',
            confidence: 1.0,
            reason: 'feature-flow.md not found',
        };
        cache.set(workingDir, result);
        return result;
    }
}
export function clearCache() {
    cache.clear();
}
//# sourceMappingURL=project-detector.js.map