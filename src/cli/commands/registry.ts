import { Command } from 'commander';

export interface CommandLoader {
  name: string;
  loader: () => Promise<{ default: Command }>;
}

export const commandRegistry: CommandLoader[] = [
  { name: 'launch', loader: () => import('./launch.js').then(m => ({ default: m.createLaunchCommand() })) },
  { name: 'dashboard', loader: () => import('./dashboard.js').then(m => ({ default: m.createDashboardCommand() })) },
  { name: 'interop', loader: () => import('./interop.js').then(m => ({ default: m.createInteropCommand() })) },
  { name: 'stats', loader: () => import('./stats.js').then(m => ({ default: m.createStatsCommand() })) },
  { name: 'cost', loader: () => import('./cost.js').then(m => ({ default: m.createCostCommand() })) },
  { name: 'sessions', loader: () => import('./sessions.js').then(m => ({ default: m.createSessionsCommand() })) },
  { name: 'agents', loader: () => import('./agents.js').then(m => ({ default: m.createAgentsCommand() })) },
  { name: 'export', loader: () => import('./export.js').then(m => ({ default: m.createExportCommand() })) },
  { name: 'cleanup', loader: () => import('./cleanup.js').then(m => ({ default: m.createCleanupCommand() })) },
  { name: 'backfill', loader: () => import('./backfill.js').then(m => ({ default: m.createBackfillCommand() })) },
  { name: 'tui', loader: () => import('./tui.js').then(m => ({ default: m.createTuiCommand() })) },
  { name: 'init', loader: () => import('./init.js').then(m => ({ default: m.createInitCommand() })) },
  { name: 'config', loader: () => import('./config.js').then(m => ({ default: m.createConfigCommand() })) },
  { name: 'config-stop-callback', loader: () => import('./config-stop-callback.js').then(m => ({ default: m.createConfigStopCallbackCommand() })) },
  { name: 'config-notify-profile', loader: () => import('./config-notify-profile.js').then(m => ({ default: m.createConfigNotifyProfileCommand() })) },
  { name: 'info', loader: () => import('./info.js').then(m => ({ default: m.createInfoCommand() })) },
  { name: 'test-prompt', loader: () => import('./test-prompt.js').then(m => ({ default: m.createTestPromptCommand() })) },
  { name: 'update', loader: () => import('./update.js').then(m => ({ default: m.createUpdateCommand() })) },
  { name: 'version', loader: () => import('./version.js').then(m => ({ default: m.createVersionCommand() })) },
  { name: 'setup', loader: () => import('./setup.js').then(m => ({ default: m.createSetupCommand() })) },
  { name: 'doctor', loader: () => import('./doctor.js').then(m => ({ default: m.createDoctorCommand() })) },
  { name: 'wait', loader: () => import('./wait-wrapper.js').then(m => ({ default: m.createWaitCommand() })) },
  { name: 'teleport', loader: () => import('./teleport-wrapper.js').then(m => ({ default: m.createTeleportCommand() })) },
  { name: 'perf', loader: async () => ({ default: await import('./perf-wrapper.js').then(m => m.createPerfCommand()) }) },
  { name: 'plugin', loader: () => import('./plugin.js').then(m => ({ default: m.pluginCommand() })) },
  { name: 'tutorial', loader: () => import('./tutorial.js').then(m => ({ default: m.createTutorialCommand() })) }
];
