import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { safeJsonParse } from '../../lib/safe-json.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('nexus:improvement-puller');
export function getImprovementsDir(directory) {
    return join(directory, '.omc/nexus/improvements');
}
function isValidImprovementSuggestion(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'id' in obj &&
        'status' in obj);
}
export function loadPendingImprovements(directory) {
    const improvementsDir = getImprovementsDir(directory);
    if (!existsSync(improvementsDir))
        return [];
    const results = [];
    for (const file of readdirSync(improvementsDir)) {
        if (!file.endsWith('.json'))
            continue;
        try {
            const raw = readFileSync(join(improvementsDir, file), 'utf-8');
            const result = safeJsonParse(raw, file);
            if (!result.success || !isValidImprovementSuggestion(result.data))
                continue;
            const imp = result.data;
            if (imp.status === 'pending')
                results.push(imp);
        }
        catch (err) {
            if (!(err instanceof SyntaxError)) {
                // Non-JSON parse error (e.g. file read failure) — log warning
                logger.warn(`[improvement-puller] failed to read file ${file}:`, err);
            }
            // SyntaxError = malformed JSON, silently skip
        }
    }
    return results;
}
export function pullImprovements(directory) {
    const improvements = loadPendingImprovements(directory);
    return { pulled: improvements.length, improvements };
}
//# sourceMappingURL=improvement-puller.js.map