import { Command } from 'commander';

export function createWaitCommand(): Command {
  return new Command('wait')
    .description('Wait for background tasks to complete')
    .option('--timeout <ms>', 'Timeout in milliseconds')
    .option('--poll <ms>', 'Poll interval in milliseconds')
    .action(async (options) => {
      const { waitCommand } = await import('./wait.js');
      await waitCommand(options);
    });
}
