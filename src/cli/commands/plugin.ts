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

function pluginInstallPath(name: string): string {
  return join(homedir(), '.claude', 'plugins', 'cache', name);
}

export function pluginCommand(): Command {
  const cmd = new Command('plugin').description('Plugin management utilities');

  // omc plugin analyze <name>
  cmd
    .command('analyze <name>')
    .description('Run static security analysis on an installed plugin')
    .action((name: string) => {
      const dir = pluginInstallPath(name);
      const report = analyzePlugin(dir);
      if (report.safe) {
        console.log(chalk.green(`✓ ${name}: no security violations found`));
      } else {
        console.log(chalk.red(`✗ ${name}: ${report.violations.length} violation(s) found`));
        for (const v of report.violations) {
          console.log(chalk.yellow(`  ${v.file}:${v.line} [${v.label}] ${v.snippet}`));
        }
        process.exitCode = 1;
      }
    });

  // omc plugin deps <name>
  cmd
    .command('deps <name>')
    .description('Scan recursive dependency tree for conflicts')
    .action((name: string) => {
      const dir = pluginInstallPath(name);
      const tree = buildDepTree(dir, name);
      const report = detectConflicts(tree);
      if (report.clean) {
        console.log(chalk.green(`✓ ${name}: no dependency conflicts`));
      } else {
        console.log(chalk.red(`✗ ${name}: ${report.conflicts.length} conflict(s)`));
        for (const c of report.conflicts) {
          console.log(chalk.yellow(`  ${c.name}: ${c.versions.join(', ')}`));
        }
        process.exitCode = 1;
      }
    });

  // omc plugin snapshot <name> <version>
  cmd
    .command('snapshot <name> <version>')
    .description('Create a snapshot of a plugin before upgrading')
    .action((name: string, version: string) => {
      const installPath = pluginInstallPath(name);
      const meta = createSnapshot(name, version, installPath);
      console.log(chalk.green(`✓ Snapshot created: ${meta.snapshotPath}`));
    });

  // omc plugin rollback <name> <version>
  cmd
    .command('rollback <name> <version>')
    .description('Restore a plugin to a previously snapshotted version')
    .action((name: string, version: string) => {
      const installPath = pluginInstallPath(name);
      const ok = restoreSnapshot(name, version, installPath);
      if (ok) {
        console.log(chalk.green(`✓ ${name} restored to v${version}`));
      } else {
        console.log(chalk.red(`✗ No snapshot found for ${name}@${version}`));
        const available = listSnapshots(name);
        if (available.length > 0) {
          console.log('Available snapshots:');
          for (const s of available) console.log(`  ${s.version} (${s.snapshotAt})`);
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
        console.log(chalk.green(`✓ Marketplace enabled (${count} third-party plugins installed)`));
      } else {
        console.log(chalk.yellow(`Marketplace not yet available (${count}/5 third-party plugins required)`));
      }
    });

  return cmd;
}
