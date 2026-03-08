/**
 * Ralph-Progress Promotion
 *
 * Promotes learnings from ralph-progress to full skills.
 */
import { promises as fs } from 'fs';
import * as path from 'path';
import { readProgress } from '../ralph/index.js';
import { writeSkill } from './writer.js';
/**
 * 返回最近 N 天内晋升为 active 的模式条目（T-07）。
 */
export async function getRecentPromotions(days = 7, baseDir) {
    const file = path.join(baseDir ?? process.cwd(), '.omc', 'axiom', 'evolution', 'pattern_library.md');
    let text;
    try {
        text = await fs.readFile(file, 'utf-8');
    }
    catch {
        return [];
    }
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const results = [];
    for (const line of text.split('\n')) {
        if (!line.startsWith('|'))
            continue;
        const parts = line.split('|').map(p => p.trim());
        // | ID | Name | Category | Occurrences | Confidence | Status |
        if (parts.length < 7 || parts[1] === 'ID' || parts[1]?.startsWith('-'))
            continue;
        const [, id, name, , , , status] = parts;
        if (!id || !name || status?.toLowerCase() !== 'active')
            continue;
        // pattern_library doesn't have created column; use last_updated from frontmatter as proxy
        // We include all active entries and let caller filter by date if needed
        results.push({ id, name, status: status ?? 'active', created: '' });
    }
    // Filter by created date if available
    return results.filter(e => !e.created || new Date(e.created) >= cutoff);
}
/**
 * Extract trigger keywords from learning text.
 */
function extractTriggers(text) {
    const technicalKeywords = [
        'react', 'typescript', 'javascript', 'python', 'api', 'database',
        'testing', 'debugging', 'performance', 'async', 'state', 'component',
        'error', 'validation', 'authentication', 'cache', 'query', 'mutation',
    ];
    const textLower = text.toLowerCase();
    return technicalKeywords.filter(kw => textLower.includes(kw));
}
/**
 * Get promotion candidates from ralph-progress learnings.
 */
export function getPromotionCandidates(directory, limit = 10) {
    const progress = readProgress(directory);
    if (!progress) {
        return [];
    }
    const candidates = [];
    // Get recent entries with learnings
    const recentEntries = progress.entries.slice(-limit);
    for (const entry of recentEntries) {
        for (const learning of entry.learnings) {
            // Skip very short learnings
            if (learning.length < 20)
                continue;
            candidates.push({
                learning,
                storyId: entry.storyId,
                timestamp: entry.timestamp,
                suggestedTriggers: extractTriggers(learning),
            });
        }
    }
    // Sort by number of triggers (more specific = better candidate)
    return candidates.sort((a, b) => b.suggestedTriggers.length - a.suggestedTriggers.length);
}
/**
 * Promote a learning to a full skill.
 */
export function promoteLearning(candidate, skillName, additionalTriggers, targetScope, projectRoot) {
    const request = {
        problem: `Learning from ${candidate.storyId}: ${candidate.learning.slice(0, 100)}...`,
        solution: candidate.learning,
        triggers: [...new Set([...candidate.suggestedTriggers, ...additionalTriggers])],
        targetScope,
    };
    return writeSkill(request, projectRoot, skillName);
}
/**
 * List learnings that could be promoted.
 */
export function listPromotableLearnings(directory) {
    const candidates = getPromotionCandidates(directory);
    if (candidates.length === 0) {
        return 'No promotion candidates found in ralph-progress learnings.';
    }
    const lines = [
        '# Promotion Candidates',
        '',
        'The following learnings from ralph-progress could be promoted to skills:',
        '',
    ];
    candidates.forEach((candidate, index) => {
        lines.push(`## ${index + 1}. From ${candidate.storyId} (${candidate.timestamp})`);
        lines.push('');
        lines.push(candidate.learning);
        lines.push('');
        if (candidate.suggestedTriggers.length > 0) {
            lines.push(`**Suggested triggers:** ${candidate.suggestedTriggers.join(', ')}`);
        }
        lines.push('');
        lines.push('---');
        lines.push('');
    });
    return lines.join('\n');
}
//# sourceMappingURL=promotion.js.map