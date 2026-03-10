import { Command } from 'commander';
export function createTuiCommand() {
    return new Command('tui')
        .description('Launch tokscale interactive TUI for token visualization')
        .action(async () => {
        const { launchTokscaleTUI } = await import('../utils/tokscale-launcher.js');
        await launchTokscaleTUI();
    });
}
//# sourceMappingURL=tui.js.map