import { Command } from 'commander';

export function createDashboardCommand(): Command {
  return new Command('dashboard')
    .description('Show analytics dashboard (aggregate stats, costs, agents)')
    .addHelpText('after', `
Note: This was the default 'omc' behavior. Now 'omc' launches Claude Code by default.
Set OMC_DEFAULT_ACTION=dashboard to restore the old behavior.`)
    .action(async () => {
      const { displayAnalyticsDashboard } = await import('../utils/dashboard.js');
      await displayAnalyticsDashboard();
    });
}
