import { Command } from 'commander';
export function createInteropCommand() {
    return new Command('interop')
        .description('Launch split-pane tmux session with Claude Code (OMC) and Codex (OMX)')
        .action(async () => {
        const { interopCommand } = await import('../utils/interop.js');
        await interopCommand();
    });
}
//# sourceMappingURL=interop.js.map