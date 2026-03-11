/**
 * Autopilot State Management & Phase Transitions
 *
 * Handles:
 * - Persistent state for the autopilot workflow across phases
 * - Phase transitions, especially Ralph → UltraQA and UltraQA → Validation
 * - State machine operations
 */
import { existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { DEFAULT_CONFIG } from './types.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('autopilot:state');
import { readRalphState, clearRalphState, clearLinkedUltraworkState } from '../ralph/index.js';
import { startUltraQA, clearUltraQAState, readUltraQAState } from '../ultraqa/index.js';
import { canStartMode } from '../mode-registry/index.js';
import { createStateAdapter } from '../../lib/state-adapter.js';
const SPEC_DIR = 'autopilot';
// ============================================================================
// STATE MANAGEMENT
// ============================================================================
/**
 * Ensure the autopilot directory exists
 */
export function ensureAutopilotDir(directory) {
    const autopilotDir = join(directory, '.omc', SPEC_DIR);
    if (!existsSync(autopilotDir)) {
        mkdirSync(autopilotDir, { recursive: true });
    }
    return autopilotDir;
}
/**
 * Read autopilot state from disk
 */
export function readAutopilotState(directory, sessionId) {
    const adapter = createStateAdapter('autopilot', directory);
    return adapter.read(sessionId);
}
/**
 * Write autopilot state to disk
 */
export async function writeAutopilotState(directory, state, sessionId) {
    const adapter = createStateAdapter('autopilot', directory);
    return await adapter.write(state, sessionId);
}
/**
 * Clear autopilot state
 */
export function clearAutopilotState(directory, sessionId) {
    const adapter = createStateAdapter('autopilot', directory);
    return adapter.clear(sessionId);
}
/**
 * Get the age of the autopilot state file in milliseconds.
 * Returns null if no state file exists.
 */
export function getAutopilotStateAge(directory, sessionId) {
    const adapter = createStateAdapter('autopilot', directory);
    const stateFile = adapter.getPath(sessionId);
    if (!existsSync(stateFile))
        return null;
    try {
        const stats = statSync(stateFile);
        return Date.now() - stats.mtimeMs;
    }
    catch {
        return null;
    }
}
/**
 * Check if autopilot is active
 */
export function isAutopilotActive(directory, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    return state !== null && state.active === true;
}
/**
 * Initialize a new autopilot session
 */
export async function initAutopilot(directory, idea, sessionId, config) {
    // Mutual exclusion check via mode-registry
    const canStart = canStartMode('autopilot', directory);
    if (!canStart.allowed) {
        logger.error(canStart.message);
        return null;
    }
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const now = new Date().toISOString();
    const state = {
        active: true,
        phase: 'expansion',
        iteration: 1,
        max_iterations: mergedConfig.maxIterations ?? 10,
        originalIdea: idea,
        expansion: {
            analyst_complete: false,
            architect_complete: false,
            spec_path: null,
            requirements_summary: '',
            tech_stack: []
        },
        planning: {
            plan_path: null,
            architect_iterations: 0,
            approved: false
        },
        execution: {
            ralph_iterations: 0,
            ultrawork_active: false,
            tasks_completed: 0,
            tasks_total: 0,
            files_created: [],
            files_modified: []
        },
        qa: {
            ultraqa_cycles: 0,
            build_status: 'pending',
            lint_status: 'pending',
            test_status: 'pending'
        },
        validation: {
            architects_spawned: 0,
            verdicts: [],
            all_approved: false,
            validation_rounds: 0
        },
        started_at: now,
        completed_at: null,
        phase_durations: {},
        total_agents_spawned: 0,
        wisdom_entries: 0,
        session_id: sessionId,
        project_path: directory
    };
    ensureAutopilotDir(directory);
    await writeAutopilotState(directory, state, sessionId);
    return state;
}
/**
 * Transition to a new phase
 */
export async function transitionPhase(directory, newPhase, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state || !state.active) {
        return null;
    }
    const now = new Date().toISOString();
    const oldPhase = state.phase;
    // Record duration for old phase (if we have a start time recorded)
    const phaseStartKey = `${oldPhase}_start_ms`;
    if (state.phase_durations[phaseStartKey] !== undefined) {
        const duration = Date.now() - state.phase_durations[phaseStartKey];
        state.phase_durations[oldPhase] = duration;
    }
    // Transition to new phase and record start time
    state.phase = newPhase;
    state.phase_durations[`${newPhase}_start_ms`] = Date.now();
    if (newPhase === 'complete' || newPhase === 'failed') {
        state.completed_at = now;
        state.active = false;
    }
    await writeAutopilotState(directory, state, sessionId);
    return state;
}
/**
 * Increment the agent spawn counter
 */
export async function incrementAgentCount(directory, count = 1, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.total_agents_spawned += count;
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Update expansion phase data
 */
export async function updateExpansion(directory, updates, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.expansion = { ...state.expansion, ...updates };
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Update planning phase data
 */
export async function updatePlanning(directory, updates, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.planning = { ...state.planning, ...updates };
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Update execution phase data
 */
export async function updateExecution(directory, updates, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.execution = { ...state.execution, ...updates };
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Update QA phase data
 */
export async function updateQA(directory, updates, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.qa = { ...state.qa, ...updates };
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Update validation phase data
 */
export async function updateValidation(directory, updates, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.validation = { ...state.validation, ...updates };
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Get the spec file path
 */
export function getSpecPath(directory) {
    return join(directory, '.omc', SPEC_DIR, 'spec.md');
}
/**
 * Get the plan file path
 */
export function getPlanPath(directory) {
    return join(directory, '.omc', 'plans', 'autopilot-impl.md');
}
/**
 * Transition from Ralph (Phase 2: Execution) to UltraQA (Phase 3: QA)
 *
 * This handles the mutual exclusion by:
 * 1. Saving Ralph's progress to autopilot state
 * 2. Cleanly terminating Ralph mode (and linked Ultrawork)
 * 3. Starting UltraQA mode
 * 4. Preserving context for potential rollback
 */
export async function transitionRalphToUltraQA(directory, sessionId) {
    const autopilotState = readAutopilotState(directory, sessionId);
    if (!autopilotState || autopilotState.phase !== 'execution') {
        return {
            success: false,
            error: 'Not in execution phase - cannot transition to QA'
        };
    }
    const ralphState = readRalphState(directory, sessionId);
    // Step 1: Preserve Ralph progress in autopilot state
    const executionUpdated = await updateExecution(directory, {
        ralph_iterations: ralphState?.iteration ?? autopilotState.execution.ralph_iterations,
        ralph_completed_at: new Date().toISOString(),
        ultrawork_active: false
    }, sessionId);
    if (!executionUpdated) {
        return {
            success: false,
            error: 'Failed to update execution state'
        };
    }
    // Step 2: Cleanly terminate Ralph (and linked Ultrawork)
    if (ralphState?.linked_ultrawork) {
        clearLinkedUltraworkState(directory, sessionId);
    }
    const ralphCleared = clearRalphState(directory, sessionId);
    if (!ralphCleared) {
        return {
            success: false,
            error: 'Failed to clear Ralph state'
        };
    }
    // Step 3: Transition to QA phase
    const newState = await transitionPhase(directory, 'qa', sessionId);
    if (!newState) {
        return {
            success: false,
            error: 'Failed to transition to QA phase'
        };
    }
    // Step 4: Start UltraQA
    const qaResult = startUltraQA(directory, 'tests', sessionId, { maxCycles: 5 });
    if (!qaResult.success) {
        // Rollback on failure - restore execution phase
        await transitionPhase(directory, 'execution', sessionId);
        await updateExecution(directory, { ralph_completed_at: undefined }, sessionId);
        return {
            success: false,
            error: qaResult.error || 'Failed to start UltraQA'
        };
    }
    return {
        success: true,
        state: newState
    };
}
/**
 * Transition from UltraQA (Phase 3: QA) to Validation (Phase 4)
 */
export async function transitionUltraQAToValidation(directory, sessionId) {
    const autopilotState = readAutopilotState(directory, sessionId);
    if (!autopilotState || autopilotState.phase !== 'qa') {
        return {
            success: false,
            error: 'Not in QA phase - cannot transition to validation'
        };
    }
    const qaState = readUltraQAState(directory, sessionId);
    // Preserve QA progress
    const qaUpdated = await updateQA(directory, {
        ultraqa_cycles: qaState?.cycle ?? autopilotState.qa.ultraqa_cycles,
        qa_completed_at: new Date().toISOString()
    }, sessionId);
    if (!qaUpdated) {
        return {
            success: false,
            error: 'Failed to update QA state'
        };
    }
    // Terminate UltraQA
    clearUltraQAState(directory, sessionId);
    // Transition to validation
    const newState = await transitionPhase(directory, 'validation', sessionId);
    if (!newState) {
        return {
            success: false,
            error: 'Failed to transition to validation phase'
        };
    }
    return {
        success: true,
        state: newState
    };
}
/**
 * Transition from Validation (Phase 4) to Complete
 */
export async function transitionToComplete(directory, sessionId) {
    const state = await transitionPhase(directory, 'complete', sessionId);
    if (!state) {
        return {
            success: false,
            error: 'Failed to transition to complete phase'
        };
    }
    return { success: true, state };
}
/**
 * Transition to failed state
 */
export async function transitionToFailed(directory, error, sessionId) {
    const state = await transitionPhase(directory, 'failed', sessionId);
    if (!state) {
        return {
            success: false,
            error: 'Failed to transition to failed phase'
        };
    }
    if (error) {
        await recordFailureReason(directory, error, sessionId);
    }
    return { success: true, state };
}
/**
 * Get a prompt for Claude to execute the transition
 */
export function getTransitionPrompt(fromPhase, toPhase) {
    if (fromPhase === 'execution' && toPhase === 'qa') {
        return `## PHASE TRANSITION: Execution → QA

The execution phase is complete. Transitioning to QA phase.

**CRITICAL**: Ralph mode must be cleanly terminated before UltraQA can start.

The transition handler has:
1. Preserved Ralph iteration count and progress
2. Cleared Ralph state (and linked Ultrawork)
3. Started UltraQA in 'tests' mode

You are now in QA phase. Run the QA cycle:
1. Build: Run the project's build command
2. Lint: Run the project's lint command
3. Test: Run the project's test command

Fix any failures and repeat until all pass.

Signal when QA passes: QA_COMPLETE
`;
    }
    if (fromPhase === 'qa' && toPhase === 'validation') {
        return `## PHASE TRANSITION: QA → Validation

All QA checks have passed. Transitioning to validation phase.

The transition handler has:
1. Preserved UltraQA cycle count
2. Cleared UltraQA state
3. Updated phase to 'validation'

You are now in validation phase. Spawn parallel validation architects:

\`\`\`
// Spawn all three in parallel
Task(subagent_type="ultrapower:architect", model="opus",
  prompt="FUNCTIONAL COMPLETENESS REVIEW: Verify all requirements from spec are implemented")

Task(subagent_type="ultrapower:security-reviewer", model="opus",
  prompt="SECURITY REVIEW: Check for vulnerabilities, injection risks, auth issues")

Task(subagent_type="ultrapower:code-reviewer", model="opus",
  prompt="CODE QUALITY REVIEW: Check patterns, maintainability, test coverage")
\`\`\`

Aggregate verdicts:
- All APPROVED → Signal: AUTOPILOT_COMPLETE
- Any REJECTED → Fix issues and re-validate (max 3 rounds)
`;
    }
    if (fromPhase === 'expansion' && toPhase === 'planning') {
        return `## PHASE TRANSITION: Expansion → Planning

The idea has been expanded into a detailed specification.

Read the spec and create an implementation plan using the Architect agent (direct planning mode).

Signal when Critic approves the plan: PLANNING_COMPLETE
`;
    }
    if (fromPhase === 'planning' && toPhase === 'execution') {
        return `## PHASE TRANSITION: Planning → Execution

The plan has been approved. Starting execution phase with Ralph + Ultrawork.

Execute tasks from the plan in parallel where possible.

Signal when all tasks complete: EXECUTION_COMPLETE
`;
    }
    return '';
}
/**
 * Append a completed step to the state's completed_steps list.
 * Called after each phase successfully finishes.
 */
export async function appendCompletedStep(directory, step, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    if (!state.completed_steps) {
        state.completed_steps = [];
    }
    if (!state.completed_steps.includes(step)) {
        state.completed_steps.push(step);
    }
    return await writeAutopilotState(directory, state, sessionId);
}
/**
 * Record a failure reason in the state.
 */
export async function recordFailureReason(directory, reason, sessionId) {
    const state = readAutopilotState(directory, sessionId);
    if (!state)
        return false;
    state.failure_reason = reason;
    return await writeAutopilotState(directory, state, sessionId);
}
//# sourceMappingURL=state.js.map