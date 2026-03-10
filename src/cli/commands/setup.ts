import { Command } from 'commander';

export function createSetupCommand(): Command {
  return new Command('setup')
    .description('Sync all OMC components (hooks, agents, skills)')
    .action(async () => {
      const { setupCommand } = await import('../utils/setup.js');
      await setupCommand();
    });
}
