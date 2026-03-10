import { Command } from 'commander';
export function createTeleportCommand() {
    return new Command('teleport')
        .description('Quick project navigation and context switching')
        .argument('[target]', 'Target project or bookmark')
        .option('--list', 'List bookmarks')
        .action(async (target, options) => {
        const { teleportCommand } = await import('./teleport.js');
        await teleportCommand(target, options);
    });
}
//# sourceMappingURL=teleport-wrapper.js.map