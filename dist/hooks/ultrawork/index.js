/**
 * Ultrawork State Management
 *
 * Manages persistent ultrawork mode state across sessions.
 * When ultrawork is activated and todos remain incomplete,
 * this module ensures the mode persists until all work is done.
 */
import { createStateAdapter } from '../../lib/state-adapter.js';
/**
 * Read Ultrawork state from disk (local only)
 */
export function readUltraworkState(directory, sessionId) {
    const adapter = createStateAdapter('ultrawork', directory || process.cwd());
    return adapter.read(sessionId);
}
/**
 * Write Ultrawork state to disk (local only)
 */
export async function writeUltraworkState(state, directory, sessionId) {
    const adapter = createStateAdapter('ultrawork', directory || process.cwd());
    return await adapter.write(state, sessionId);
}
/**
 * Activate ultrawork mode
 */
export async function activateUltrawork(prompt, sessionId, directory, linkedToRalph) {
    const state = {
        active: true,
        started_at: new Date().toISOString(),
        original_prompt: prompt,
        session_id: sessionId,
        project_path: directory || process.cwd(),
        reinforcement_count: 0,
        last_checked_at: new Date().toISOString(),
        linked_to_ralph: linkedToRalph
    };
    return await writeUltraworkState(state, directory, sessionId);
}
/**
 * Deactivate ultrawork mode
 *
 * Clears session-scoped state and legacy files if they belong to this session.
 */
export function deactivateUltrawork(directory, sessionId) {
    const adapter = createStateAdapter('ultrawork', directory || process.cwd());
    const success = adapter.clear(sessionId);
    // Ghost legacy cleanup: if sessionId provided, also remove legacy file
    // if it belongs to this session or has no session_id (orphaned)
    if (sessionId) {
        const legacyState = adapter.read(); // Read legacy state without sessionId
        if (legacyState && (!legacyState.session_id || legacyState.session_id === sessionId)) {
            adapter.clear(); // Clear legacy file
        }
    }
    return success;
}
/**
 * Increment reinforcement count (called when mode is reinforced on stop)
 */
export async function incrementReinforcement(directory, sessionId) {
    const state = readUltraworkState(directory, sessionId);
    if (!state || !state.active) {
        return null;
    }
    const mutableState = {
        ...state,
        reinforcement_count: state.reinforcement_count + 1,
        last_checked_at: new Date().toISOString()
    };
    if (await writeUltraworkState(mutableState, directory, sessionId)) {
        return mutableState;
    }
    return null;
}
/**
 * Check if ultrawork should be reinforced (active with pending todos)
 */
export function shouldReinforceUltrawork(sessionId, directory) {
    const state = readUltraworkState(directory, sessionId);
    if (!state || !state.active) {
        return false;
    }
    // Strict session isolation: state must match the requesting session
    // Both must be defined and equal - prevent cross-session contamination
    // when both are undefined (Bug #5 fix)
    if (!state.session_id || !sessionId || state.session_id !== sessionId) {
        return false;
    }
    return true;
}
/**
 * Get ultrawork persistence message for injection
 */
export function getUltraworkPersistenceMessage(state) {
    return `<ultrawork-persistence>

[ULTRAWORK MODE STILL ACTIVE - Reinforcement #${state.reinforcement_count + 1}]

Your ultrawork session is NOT complete. Incomplete todos remain.

REMEMBER THE ULTRAWORK RULES:
- **PARALLEL**: Fire independent calls simultaneously - NEVER wait sequentially
- **BACKGROUND FIRST**: Use Task(run_in_background=true) for exploration (10+ concurrent)
- **TODO**: Track EVERY step. Mark complete IMMEDIATELY after each
- **VERIFY**: Check ALL requirements met before done
- **NO Premature Stopping**: ALL TODOs must be complete

Continue working on the next pending task. DO NOT STOP until all tasks are marked complete.

Original task: ${state.original_prompt}

</ultrawork-persistence>

---

`;
}
/**
 * Create an Ultrawork State hook instance
 */
export function createUltraworkStateHook(directory) {
    return {
        activate: (prompt, sessionId) => activateUltrawork(prompt, sessionId, directory),
        deactivate: (sessionId) => deactivateUltrawork(directory, sessionId),
        getState: (sessionId) => readUltraworkState(directory, sessionId),
        shouldReinforce: (sessionId) => shouldReinforceUltrawork(sessionId, directory),
        incrementReinforcement: (sessionId) => incrementReinforcement(directory, sessionId)
    };
}
//# sourceMappingURL=index.js.map