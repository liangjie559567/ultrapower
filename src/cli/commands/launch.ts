import { Command } from 'commander';

export function createLaunchCommand(): Command {
  return new Command('launch')
    .argument('[args...]', 'Arguments to pass to Claude Code')
    .description('Launch Claude Code with native tmux shell integration')
    .allowUnknownOption()
    .addHelpText('after', `
Examples:
  $ omc launch                   Launch Claude Code
  $ omc launch --madmax          Launch with permissions bypass
  $ omc launch --yolo            Launch with permissions bypass (alias)

Environment:
  Set OMC_DEFAULT_ACTION=dashboard to show analytics dashboard when running 'omc' with no args`)
    .action(async (args: string[]) => {
      const { launchCommand } = await import('../launch.js');
      await launchCommand(args);
    });
}
