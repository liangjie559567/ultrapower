import { Command } from 'commander';

export function createUpdateCommand(): Command {
  return new Command('update')
    .description('Check for and install updates')
    .action(async () => {
      const { updateCommand } = await import('../utils/update.js');
      await updateCommand();
    });
}
