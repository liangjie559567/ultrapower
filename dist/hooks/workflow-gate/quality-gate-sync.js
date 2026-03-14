import { readFileSync } from 'fs';
/**
 * Synchronous quality gate check for hook context
 */
export function runQualityGateSync(files, cwd, skipRequested) {
    if (skipRequested) {
        return { passed: true, issues: [], score: 100 };
    }
    const issues = [];
    let score = 100;
    for (const file of files) {
        if (!file.endsWith('.ts') && !file.endsWith('.js'))
            continue;
        try {
            const content = readFileSync(file, 'utf8');
            if (content.includes('TODO') || content.includes('FIXME')) {
                issues.push(`${file}: Contains TODO/FIXME`);
                score -= 10;
            }
            if (content.includes('console.log')) {
                issues.push(`${file}: Contains console.log`);
                score -= 5;
            }
            if (content.includes(': any')) {
                issues.push(`${file}: Uses 'any' type`);
                score -= 5;
            }
        }
        catch {
            // Skip files that can't be read
        }
    }
    return {
        passed: score >= 60,
        issues,
        score: Math.max(0, score)
    };
}
//# sourceMappingURL=quality-gate-sync.js.map