import { Command } from 'commander';

export function createConfigCommand(): Command {
  return new Command('config')
    .description('Show current configuration')
    .action(async () => {
      const { configCommand } = await import('../utils/config.js');
      await configCommand();
    });
}
