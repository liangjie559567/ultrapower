/**
 * `omc plugin` CLI subcommands: analyze, rollback, deps, marketplace
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { analyzePlugin } from '../../lib/plugin-security.js';
import { buildDepTree, detectConflicts } from '../../lib/plugin-deps.js';
import { createSnapshot, restoreSnapshot, listSnapshots } from '../../lib/plugin-rollback.js';
import { isMarketplaceEnabled, countThirdPartyPlugins } from '../../lib/plugin-marketplace.js';
import { join } from 'path';
import { homedir } from 'os';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('commands:plugin');
function pluginInstallPath(name) {
    return join(homedir(), '.claude', 'plugins', 'cache', name);
}
export function pluginCommand() {
    const cmd = new Command('plugin').description('Plugin management utilities');
    // omc plugin analyze <name>
    cmd
        .command('analyze <name>')
        .description('Run static security analysis on an installed plugin')
        .action((name) => {
        const dir = pluginInstallPath(name);
        const report = analyzePlugin(dir);
        if (report.safe) {
            logger.info(chalk.green(`✓ ${name}: no security violations found`));
        }
        else {
            logger.info(chalk.red(`✗ ${name}: ${report.violations.length} violation(s) found`));
            for (const v of report.violations) {
                logger.info(chalk.yellow(`  ${v.file}:${v.line} [${v.label}] ${v.snippet}`));
            }
            process.exitCode = 1;
        }
    });
    // omc plugin deps <name>
    cmd
        .command('deps <name>')
        .description('Scan recursive dependency tree for conflicts')
        .action((name) => {
        const dir = pluginInstallPath(name);
        const tree = buildDepTree(dir, name);
        const report = detectConflicts(tree);
        if (report.clean) {
            logger.info(chalk.green(`✓ ${name}: no dependency conflicts`));
        }
        else {
            logger.info(chalk.red(`✗ ${name}: ${report.conflicts.length} conflict(s)`));
            for (const c of report.conflicts) {
                logger.info(chalk.yellow(`  ${c.name}: ${c.versions.join(', ')}`));
            }
            process.exitCode = 1;
        }
    });
    // omc plugin snapshot <name> <version>
    cmd
        .command('snapshot <name> <version>')
        .description('Create a snapshot of a plugin before upgrading')
        .action((name, version) => {
        const installPath = pluginInstallPath(name);
        const meta = createSnapshot(name, version, installPath);
        logger.info(chalk.green(`✓ Snapshot created: ${meta.snapshotPath}`));
    });
    // omc plugin rollback <name> <version>
    cmd
        .command('rollback <name> <version>')
        .description('Restore a plugin to a previously snapshotted version')
        .action((name, version) => {
        const installPath = pluginInstallPath(name);
        const ok = restoreSnapshot(name, version, installPath);
        if (ok) {
            logger.info(chalk.green(`✓ ${name} restored to v${version}`));
        }
        else {
            logger.info(chalk.red(`✗ No snapshot found for ${name}@${version}`));
            const available = listSnapshots(name);
            if (available.length > 0) {
                logger.info('Available snapshots:');
                for (const s of available)
                    logger.info(`  ${s.version} (${s.snapshotAt})`);
            }
            process.exitCode = 1;
        }
    });
    // omc plugin marketplace
    cmd
        .command('marketplace')
        .description('Show marketplace status')
        .action(() => {
        const count = countThirdPartyPlugins();
        const enabled = isMarketplaceEnabled();
        if (enabled) {
            logger.info(chalk.green(`✓ Marketplace enabled (${count} third-party plugins installed)`));
        }
        else {
            logger.info(chalk.yellow(`Marketplace not yet available (${count}/5 third-party plugins required)`));
        }
    });
    return cmd;
}
//# sourceMappingURL=plugin.js.map