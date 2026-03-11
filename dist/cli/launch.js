/**
 * Native tmux shell launch for omc
 * Launches Claude Code with tmux session management and HUD integration
 */
import { execFileSync } from 'child_process';
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('cli:launch');
import { resolveLaunchPolicy, buildTmuxSessionName, buildTmuxShellCommand, listHudWatchPaneIdsInCurrentWindow, createHudWatchPane, killTmuxPane, isClaudeAvailable, } from './tmux-utils.js';
// Flag mapping
const MADMAX_FLAG = '--madmax';
const YOLO_FLAG = '--yolo';
const CLAUDE_BYPASS_FLAG = '--dangerously-skip-permissions';
/**
 * Normalize Claude launch arguments
 * Maps --madmax/--yolo to --dangerously-skip-permissions
 * All other flags pass through unchanged
 */
export function normalizeClaudeLaunchArgs(args) {
    const normalized = [];
    let wantsBypass = false;
    let hasBypass = false;
    for (const arg of args) {
        if (arg === MADMAX_FLAG || arg === YOLO_FLAG) {
            wantsBypass = true;
            continue;
        }
        if (arg === CLAUDE_BYPASS_FLAG) {
            wantsBypass = true;
            if (!hasBypass) {
                normalized.push(arg);
                hasBypass = true;
            }
            continue;
        }
        normalized.push(arg);
    }
    if (wantsBypass && !hasBypass) {
        normalized.push(CLAUDE_BYPASS_FLAG);
    }
    return normalized;
}
/**
 * preLaunch: Prepare environment before Claude starts
 * Currently a placeholder - can be extended for:
 * - Session state initialization
 * - Environment setup
 * - Pre-launch checks
 */
export async function preLaunch(_cwd, _sessionId) {
    // Placeholder for future pre-launch logic
    // e.g., session state, environment prep, etc.
}
/**
 * runClaude: Launch Claude CLI (blocks until exit)
 * Handles 3 scenarios:
 * 1. inside-tmux: Launch claude in current pane, HUD in bottom split
 * 2. outside-tmux: Create new tmux session with claude + HUD pane
 * 3. direct: tmux not available, run claude directly
 */
export function runClaude(cwd, args, sessionId) {
    const omcBin = process.argv[1];
    const policy = resolveLaunchPolicy(process.env);
    // Check if omc binary exists (it does if we're running) — hud is always bundled
    const hasHudCommand = typeof omcBin === 'string' && omcBin.length > 0;
    const hudCmd = hasHudCommand ? buildTmuxShellCommand('node', [omcBin, 'hud', '--watch']) : '';
    switch (policy) {
        case 'inside-tmux':
            runClaudeInsideTmux(cwd, args, hudCmd);
            break;
        case 'outside-tmux':
            runClaudeOutsideTmux(cwd, args, sessionId, hudCmd);
            break;
        case 'direct':
            runClaudeDirect(cwd, args);
            break;
    }
}
/**
 * Run Claude inside existing tmux session
 * Splits pane for HUD, launches Claude in current pane
 */
function runClaudeInsideTmux(cwd, args, hudCmd) {
    const currentPaneId = process.env.TMUX_PANE;
    // Clean up stale HUD panes
    const staleHudPaneIds = listHudWatchPaneIdsInCurrentWindow(currentPaneId);
    for (const paneId of staleHudPaneIds) {
        killTmuxPane(paneId);
    }
    // Create HUD pane if command is available
    let hudPaneId = null;
    if (hudCmd) {
        try {
            hudPaneId = createHudWatchPane(cwd, hudCmd);
        }
        catch {
            // HUD split failed, continue without it
        }
    }
    // Launch Claude in current pane
    try {
        execFileSync('claude', args, { cwd, stdio: 'inherit' });
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT') {
            logger.error('[omc] Error: claude CLI not found in PATH.');
            process.exit(1);
        }
        // Normal exit (non-zero status codes throw in execFileSync) — ignore
    }
    finally {
        // Cleanup HUD pane on exit
        if (hudPaneId) {
            killTmuxPane(hudPaneId);
        }
        // Clean up any remaining HUD panes
        const remainingHudPaneIds = listHudWatchPaneIdsInCurrentWindow(currentPaneId);
        for (const paneId of remainingHudPaneIds) {
            killTmuxPane(paneId);
        }
    }
}
/**
 * Run Claude outside tmux - create new session
 * Creates tmux session with Claude + HUD pane
 */
function runClaudeOutsideTmux(cwd, args, sessionId, hudCmd) {
    const claudeCmd = buildTmuxShellCommand('claude', args);
    const tmuxSessionId = `omc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sessionName = buildTmuxSessionName(cwd, tmuxSessionId);
    const tmuxArgs = [
        'new-session', '-d', '-s', sessionName, '-c', cwd,
        claudeCmd,
    ];
    // Add HUD pane if available
    if (hudCmd) {
        tmuxArgs.push(';', 'split-window', '-v', '-l', '4', '-d', '-c', cwd, hudCmd, ';', 'select-pane', '-t', '0');
    }
    // Attach to session
    tmuxArgs.push(';', 'attach-session', '-t', sessionName);
    try {
        execFileSync('tmux', tmuxArgs, { stdio: 'inherit' });
    }
    catch {
        // tmux failed, fall back to direct launch
        runClaudeDirect(cwd, args);
    }
}
/**
 * Run Claude directly (no tmux)
 * Fallback when tmux is not available
 */
function runClaudeDirect(cwd, args) {
    try {
        execFileSync('claude', args, { cwd, stdio: 'inherit' });
    }
    catch (error) {
        const err = error;
        if (err.code === 'ENOENT') {
            logger.error('[omc] Error: claude CLI not found in PATH.');
            process.exit(1);
        }
        // Normal exit (non-zero status codes throw in execFileSync) — ignore
    }
}
/**
 * postLaunch: Cleanup after Claude exits
 * Currently a placeholder - can be extended for:
 * - Session cleanup
 * - State finalization
 * - Post-launch reporting
 */
export async function postLaunch(_cwd, _sessionId) {
    // Placeholder for future post-launch logic
    // e.g., cleanup, finalization, etc.
}
/**
 * Main launch command entry point
 * Orchestrates the 3-phase launch: preLaunch -> run -> postLaunch
 */
export async function launchCommand(args) {
    const cwd = process.cwd();
    // Pre-flight: check for nested session
    if (process.env.CLAUDECODE) {
        logger.error('[omc] Error: Already inside a Claude Code session. Nested launches are not supported.');
        process.exit(1);
    }
    // Pre-flight: check claude CLI availability
    if (!isClaudeAvailable()) {
        logger.error('[omc] Error: claude CLI not found. Install Claude Code first:');
        logger.error('  npm install -g @anthropic-ai/claude-code');
        process.exit(1);
    }
    const normalizedArgs = normalizeClaudeLaunchArgs(args);
    const sessionId = `omc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Phase 1: preLaunch
    try {
        await preLaunch(cwd, sessionId);
    }
    catch (err) {
        // preLaunch errors must NOT prevent Claude from starting
        logger.error(`[omc] preLaunch warning: ${err instanceof Error ? err.message : err}`);
    }
    // Phase 2: run
    try {
        runClaude(cwd, normalizedArgs, sessionId);
    }
    finally {
        // Phase 3: postLaunch
        await postLaunch(cwd, sessionId);
    }
}
//# sourceMappingURL=launch.js.map