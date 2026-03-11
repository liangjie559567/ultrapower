/**
 * Interop CLI Command - Split-pane tmux session with OMC and OMX
 *
 * Creates a tmux split-pane layout with Claude Code (OMC) on the left
 * and Codex CLI (OMX) on the right, with shared interop state.
 */
import { execFileSync } from 'child_process';
import { randomUUID } from 'crypto';
import { isTmuxAvailable, isClaudeAvailable } from './tmux-utils.js';
import { initInteropSession } from '../interop/shared-state.js';
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('cli:interop');
/**
 * Check if codex CLI is available
 */
function isCodexAvailable() {
    try {
        execFileSync('codex', ['--version'], { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Launch interop session with split tmux panes
 */
export function launchInteropSession(cwd = process.cwd()) {
    // Check prerequisites
    if (!isTmuxAvailable()) {
        logger.error('Error: tmux is not available. Install tmux to use interop mode.');
        process.exit(1);
    }
    const hasCodex = isCodexAvailable();
    const hasClaude = isClaudeAvailable();
    if (!hasClaude) {
        logger.error('Error: claude CLI is not available. Install Claude Code CLI first.');
        process.exit(1);
    }
    if (!hasCodex) {
        logger.warn('Warning: codex CLI is not available. Only Claude Code will be launched.');
        logger.warn('Install oh-my-codex (npm install -g @openai/codex) for full interop support.\n');
    }
    // Check if already in tmux
    const inTmux = Boolean(process.env.TMUX);
    if (!inTmux) {
        logger.error('Error: Interop mode requires running inside a tmux session.');
        logger.error('Start tmux first: tmux new-session -s myproject');
        process.exit(1);
    }
    // Generate session ID
    const sessionId = `interop-${randomUUID().split('-')[0]}`;
    // Initialize interop session
    const _config = initInteropSession(sessionId, cwd, hasCodex ? cwd : undefined);
    logger.info(`Initializing interop session: ${sessionId}`);
    logger.info(`Working directory: ${cwd}`);
    logger.info(`Config saved to: ${cwd}/.omc/state/interop/config.json\n`);
    // Get current pane ID
    let currentPaneId;
    try {
        const output = execFileSync('tmux', ['display-message', '-p', '#{pane_id}'], {
            encoding: 'utf-8',
        });
        currentPaneId = output.trim();
    }
    catch (_error) {
        logger.error('Error: Failed to get current tmux pane ID');
        process.exit(1);
    }
    if (!currentPaneId.startsWith('%')) {
        logger.error('Error: Invalid tmux pane ID format');
        process.exit(1);
    }
    // Split pane horizontally (left: claude, right: codex)
    try {
        if (hasCodex) {
            // Create right pane with codex
            logger.info('Splitting pane: Left (Claude Code) | Right (Codex)');
            execFileSync('tmux', [
                'split-window',
                '-h',
                '-c', cwd,
                '-t', currentPaneId,
                'codex',
            ], { stdio: 'inherit' });
            // Select left pane (original/current)
            execFileSync('tmux', ['select-pane', '-t', currentPaneId], { stdio: 'ignore' });
            logger.info('\nInterop session ready!');
            logger.info('- Left pane: Claude Code (this terminal)');
            logger.info('- Right pane: Codex CLI');
            logger.info('\nYou can now use interop MCP tools to communicate between the two:');
            logger.info('- interop_send_task: Send tasks between tools');
            logger.info('- interop_read_results: Check task results');
            logger.info('- interop_send_message: Send messages');
            logger.info('- interop_read_messages: Read messages');
        }
        else {
            // Codex not available, just inform user
            logger.info('\nClaude Code is ready in this pane.');
            logger.info('Install oh-my-codex to enable split-pane interop mode.');
            logger.info('\nInstall: npm install -g @openai/codex');
        }
    }
    catch (error) {
        logger.error('Error creating split pane:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
/**
 * CLI entry point for interop command
 */
export function interopCommand(options = {}) {
    const cwd = options.cwd || process.cwd();
    launchInteropSession(cwd);
}
//# sourceMappingURL=interop.js.map