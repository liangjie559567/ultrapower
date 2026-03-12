import { Command } from 'commander';
export function createInitCommand() {
    return new Command('init')
        .description('Initialize Sisyphus configuration in the current directory')
        .action(async () => {
        const { initCommand } = await import('../utils/init.js');
        await initCommand();
    });
}
//# sourceMappingURL=init.js.map