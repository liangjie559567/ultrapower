import { Command } from 'commander';

export function createTeleportCommand(): Command {
  return new Command('teleport')
    .description('Quick project navigation and context switching')
    .argument('[target]', 'Target project or bookmark')
    .option('--list', 'List bookmarks')
    .action(async (target, options) => {
      const { teleportCommand } = await import('./teleport.js');
      await teleportCommand(target, options);
    });
}
