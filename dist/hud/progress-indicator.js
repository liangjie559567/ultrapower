/**
 * HUD Progress Indicator
 *
 * Real-time progress display for Team/Pipeline execution modes.
 * Format: [MODE] Phase (X/Y tasks) [████░░] 60% ✓⚠✗⟳
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
const ICONS = { success: '✓', warning: '⚠', error: '✗', running: '⟳' };
const BAR_FILLED = '█';
const BAR_EMPTY = '░';
/**
 * Read team state from .omc/state/team-state.json
 */
function readTeamState(cwd) {
    const path = join(cwd, '.omc', 'state', 'team-state.json');
    if (!existsSync(path))
        return null;
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    }
    catch {
        return null;
    }
}
/**
 * Get task list from Claude Code's task system
 * TODO: Integrate with Claude Code Task API
 */
function getTaskList(cwd) {
    const tasksDir = join(cwd, '.claude', 'tasks');
    if (!existsSync(tasksDir))
        return [];
    try {
        const teamState = readTeamState(cwd);
        if (!teamState?.team_name)
            return [];
        const teamTasksDir = join(tasksDir, teamState.team_name);
        if (!existsSync(teamTasksDir))
            return [];
        return [];
    }
    catch {
        return [];
    }
}
/**
 * Aggregate progress from state and tasks
 */
export function aggregateProgress(cwd) {
    const start = Date.now();
    const teamState = readTeamState(cwd);
    if (!teamState?.active)
        return null;
    const tasks = getTaskList(cwd);
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const running = tasks.filter(t => t.status === 'in_progress').length;
    const elapsed = Date.now() - start;
    if (elapsed > 50) {
        console.error(`[Progress] Aggregation took ${elapsed}ms (threshold: 50ms)`);
    }
    return {
        mode: 'TEAM',
        phase: teamState.current_phase || 'unknown',
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        statusCounts: {
            success: completed,
            warning: 0,
            error: failed,
            running,
        },
    };
}
/**
 * Render progress bar
 */
function renderBar(percentage, width = 10) {
    const filled = Math.round((percentage / 100) * width);
    return BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(width - filled);
}
/**
 * Render status icons
 */
function renderIcons(counts) {
    const parts = [];
    if (counts.success > 0)
        parts.push(ICONS.success);
    if (counts.warning > 0)
        parts.push(ICONS.warning);
    if (counts.error > 0)
        parts.push(ICONS.error);
    if (counts.running > 0)
        parts.push(ICONS.running);
    return parts.join('');
}
/**
 * Format progress indicator line
 */
export function formatProgress(data) {
    const bar = renderBar(data.percentage);
    const icons = renderIcons(data.statusCounts);
    return `[${data.mode}] ${data.phase} (${data.completed}/${data.total} tasks) [${bar}] ${data.percentage}% ${icons}`;
}
/**
 * Get progress indicator string (main entry point)
 */
export function getProgressIndicator(cwd) {
    const data = aggregateProgress(cwd);
    if (!data)
        return null;
    return formatProgress(data);
}
//# sourceMappingURL=progress-indicator.js.map