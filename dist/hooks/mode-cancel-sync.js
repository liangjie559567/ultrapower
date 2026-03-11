/**
 * Mode Cancellation Synchronization
 *
 * Handles synchronized cancellation of linked modes (team+ralph, autopilot+team, etc.)
 */
import { createStateAdapter } from '../lib/state-adapter.js';
import { clearRalphState, readRalphState, clearLinkedUltraworkState } from './ralph/index.js';
import { clearUltrapilotState, readUltrapilotState } from './ultrapilot/state.js';
import { readAutopilotState, clearAutopilotState } from './autopilot/state.js';
import { readTeamStagedStateSync } from './team-state-reader.js';
import { assertValidMode } from '../lib/validateMode.js';
const MAX_RECURSION_DEPTH = 10;
/**
 * Clear a mode and all its linked modes recursively
 */
export function clearModeWithLinked(mode, directory, sessionId, visited = new Set(), depth = 0) {
    if (depth > MAX_RECURSION_DEPTH) {
        throw new Error(`Max recursion depth exceeded while clearing mode: ${mode}`);
    }
    if (visited.has(mode))
        return [];
    visited.add(mode);
    const validMode = assertValidMode(mode);
    const cleared = [];
    // Read state to get linked modes
    let state = null;
    if (mode === 'autopilot') {
        state = readAutopilotState(directory, sessionId);
    }
    else if (mode === 'ralph') {
        state = readRalphState(directory, sessionId);
    }
    else if (mode === 'ultrapilot') {
        state = readUltrapilotState(directory, sessionId);
    }
    else if (mode === 'team') {
        state = readTeamStagedStateSync(directory, sessionId);
    }
    // Clear linked modes first
    if (state?.linkedModes) {
        for (const linkedMode of state.linkedModes) {
            const linkedCleared = clearModeWithLinked(linkedMode, directory, sessionId, visited, depth + 1);
            cleared.push(...linkedCleared);
        }
    }
    // Clear the mode itself
    if (validMode === 'autopilot') {
        clearAutopilotState(directory, sessionId);
        cleared.push('autopilot');
    }
    else if (validMode === 'ralph') {
        const ralphState = readRalphState(directory, sessionId);
        if (ralphState?.linked_ultrawork) {
            clearLinkedUltraworkState(directory, sessionId);
            cleared.push('ultrawork');
        }
        clearRalphState(directory, sessionId);
        cleared.push('ralph');
    }
    else if (validMode === 'ultrapilot') {
        clearUltrapilotState(directory, sessionId);
        cleared.push('ultrapilot');
    }
    else if (validMode === 'team') {
        const adapter = createStateAdapter('team', directory);
        adapter.clear(sessionId);
        cleared.push('team');
    }
    return cleared;
}
/**
 * Link two modes together bidirectionally
 */
export function linkModes(mode1, mode2, directory, sessionId) {
    const adapter1 = createStateAdapter(mode1, directory);
    const adapter2 = createStateAdapter(mode2, directory);
    const state1 = adapter1.read(sessionId);
    const state2 = adapter2.read(sessionId);
    if (!state1 || !state2)
        return false;
    // Add bidirectional links
    if (!state1.linkedModes)
        state1.linkedModes = [];
    if (!state1.linkedModes.includes(mode2)) {
        state1.linkedModes.push(mode2);
    }
    if (!state2.linkedModes)
        state2.linkedModes = [];
    if (!state2.linkedModes.includes(mode1)) {
        state2.linkedModes.push(mode1);
    }
    return adapter1.writeSync(state1, sessionId) && adapter2.writeSync(state2, sessionId);
}
//# sourceMappingURL=mode-cancel-sync.js.map