#!/usr/bin/env node
/**
 * Oh-My-Claude-Sisyphus CLI
 *
 * Lazy-loaded command-line interface for the Sisyphus multi-agent system.
 */
// Fast path for --version (skip heavy imports)
if (process.argv.includes('--version') || process.argv.includes('-V')) {
    const { getRuntimePackageVersion } = await import('../lib/version.js');
    console.log(getRuntimePackageVersion());
    process.exit(0);
}
import { Command } from 'commander';
import { getRuntimePackageVersion } from '../lib/version.js';
import { commandRegistry } from './commands/registry.js';
const version = getRuntimePackageVersion();
const program = new Command();
// Default action when running 'omc' with no args
async function defaultAction() {
    const defaultActionMode = process.env.OMC_DEFAULT_ACTION || 'launch';
    if (defaultActionMode === 'dashboard') {
        const { displayAnalyticsDashboard } = await import('./utils/dashboard.js');
        await displayAnalyticsDashboard();
    }
    else {
        const { launchCommand } = await import('./launch.js');
        await launchCommand([]);
    }
}
program
    .name('omc')
    .description('Multi-agent orchestration system for Claude Agent SDK with analytics')
    .version(version)
    .action(defaultAction);
// Lazy-load commands on demand
program.hook('preAction', async (thisCommand) => {
    const commandName = thisCommand.name();
    // Skip for root command
    if (commandName === 'omc')
        return;
    // Find and load the command if not already loaded
    const commandLoader = commandRegistry.find(c => c.name === commandName);
    if (commandLoader && !thisCommand.commands.some(c => c.name() === commandName)) {
        const { default: cmd } = await commandLoader.loader();
        program.addCommand(cmd);
    }
});
// Register command stubs for help text
for (const { name } of commandRegistry) {
    if (!program.commands.some(c => c.name() === name)) {
        const stub = new Command(name)
            .description(`Loading ${name}...`)
            .allowUnknownOption()
            .allowExcessArguments();
        stub.action(async (...args) => {
            const loader = commandRegistry.find(c => c.name === name);
            if (loader) {
                const { default: cmd } = await loader.loader();
                // Parse as standalone command with remaining args
                const cmdIndex = process.argv.findIndex(arg => arg === name);
                if (cmdIndex !== -1) {
                    const cmdArgv = [process.argv[0], process.argv[1], ...process.argv.slice(cmdIndex + 1)];
                    await cmd.parseAsync(cmdArgv, { from: 'node' });
                }
            }
        });
        program.addCommand(stub);
    }
}
program.parse();
//# sourceMappingURL=index.js.map