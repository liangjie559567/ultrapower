import { Command } from 'commander';

export function createInfoCommand(): Command {
  return new Command('info')
    .description('Show system and agent information')
    .action(async () => {
      const { infoCommand } = await import('../utils/info.js');
      await infoCommand();
    });
}
