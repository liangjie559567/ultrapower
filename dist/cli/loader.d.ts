/**
 * CLI Command Lazy Loader
 * Reduces startup time by deferring heavy imports
 */
export declare function lazyLoadCommands(): Promise<{
    statsCommand: typeof import("./commands/stats.js").statsCommand;
    costCommand: typeof import("./commands/cost.js").costCommand;
    sessionsCommand: typeof import("./commands/sessions.js").sessionsCommand;
    agentsCommand: typeof import("./commands/agents.js").agentsCommand;
    exportCommand: typeof import("./commands/export.js").exportCommand;
    cleanupCommand: typeof import("./commands/cleanup.js").cleanupCommand;
    backfillCommand: typeof import("./commands/backfill.js").backfillCommand;
    perfCommand: import("commander").Command;
    waitCommand: typeof import("./commands/wait.js").waitCommand;
    waitStatusCommand: typeof import("./commands/wait.js").waitStatusCommand;
    waitDaemonCommand: typeof import("./commands/wait.js").waitDaemonCommand;
    waitDetectCommand: typeof import("./commands/wait.js").waitDetectCommand;
    teleportCommand: typeof import("./commands/teleport.js").teleportCommand;
    teleportListCommand: typeof import("./commands/teleport.js").teleportListCommand;
    teleportRemoveCommand: typeof import("./commands/teleport.js").teleportRemoveCommand;
    doctorConflictsCommand: typeof import("./commands/doctor-conflicts.js").doctorConflictsCommand;
    pluginCommand: typeof import("./commands/plugin.js").pluginCommand;
}>;
//# sourceMappingURL=loader.d.ts.map