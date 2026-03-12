/**
 * CLI Command Lazy Loader
 * Reduces startup time by deferring heavy imports
 */

// Lazy load command modules on-demand
export async function lazyLoadCommands() {
  return {
    statsCommand: (await import('./commands/stats.js')).statsCommand,
    costCommand: (await import('./commands/cost.js')).costCommand,
    sessionsCommand: (await import('./commands/sessions.js')).sessionsCommand,
    agentsCommand: (await import('./commands/agents.js')).agentsCommand,
    exportCommand: (await import('./commands/export.js')).exportCommand,
    cleanupCommand: (await import('./commands/cleanup.js')).cleanupCommand,
    backfillCommand: (await import('./commands/backfill.js')).backfillCommand,
    perfCommand: (await import('./commands/perf.js')).perfCommand,
    waitCommand: (await import('./commands/wait.js')).waitCommand,
    waitStatusCommand: (await import('./commands/wait.js')).waitStatusCommand,
    waitDaemonCommand: (await import('./commands/wait.js')).waitDaemonCommand,
    waitDetectCommand: (await import('./commands/wait.js')).waitDetectCommand,
    teleportCommand: (await import('./commands/teleport.js')).teleportCommand,
    teleportListCommand: (await import('./commands/teleport.js')).teleportListCommand,
    teleportRemoveCommand: (await import('./commands/teleport.js')).teleportRemoveCommand,
    doctorConflictsCommand: (await import('./commands/doctor-conflicts.js')).doctorConflictsCommand,
    pluginCommand: (await import('./commands/plugin.js')).pluginCommand,
  };
}
