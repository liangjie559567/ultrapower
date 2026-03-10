import { Command } from 'commander';
export function createVersionCommand() {
    return new Command('version')
        .description('Show detailed version information')
        .action(async () => {
        const { versionCommand } = await import('../utils/version-info.js');
        await versionCommand();
    });
}
//# sourceMappingURL=version.js.map