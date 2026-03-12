import { Command } from 'commander';

export function createVersionCommand(): Command {
  return new Command('version')
    .description('Show detailed version information')
    .action(async () => {
      const { versionCommand } = await import('../utils/version-info.js');
      await versionCommand();
    });
}
