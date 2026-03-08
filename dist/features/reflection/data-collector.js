import { readFileSync } from 'fs';
import { join } from 'path';
export function collectSessionData(directory) {
    try {
        const contextPath = join(directory, '.omc/axiom/active_context.md');
        const content = readFileSync(contextPath, 'utf-8');
        return parseActiveContext(content);
    }
    catch {
        return null;
    }
}
function parseActiveContext(content) {
    const data = {
        sessionId: extractField(content, 'session_id'),
        taskStatus: extractField(content, 'task_status'),
        currentPhase: extractField(content, 'current_phase'),
        completedTasks: 0,
        failedTasks: 0,
        blockedTasks: 0
    };
    // Count tasks
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.includes('[x]'))
            data.completedTasks++;
        if (line.includes('FAILED'))
            data.failedTasks++;
        if (line.includes('BLOCKED'))
            data.blockedTasks++;
    }
    return data;
}
function extractField(content, field) {
    const match = content.match(new RegExp(`${field}:\\s*"?([^"\\n]+)"?`));
    return match ? match[1].trim() : '';
}
//# sourceMappingURL=data-collector.js.map