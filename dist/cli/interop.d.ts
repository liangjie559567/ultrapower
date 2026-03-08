/**
 * Interop CLI Command - Split-pane tmux session with OMC and OMX
 *
 * Creates a tmux split-pane layout with Claude Code (OMC) on the left
 * and Codex CLI (OMX) on the right, with shared interop state.
 */
/**
 * Launch interop session with split tmux panes
 */
export declare function launchInteropSession(cwd?: string): void;
/**
 * CLI entry point for interop command
 */
export declare function interopCommand(options?: {
    cwd?: string;
}): void;
//# sourceMappingURL=interop.d.ts.map