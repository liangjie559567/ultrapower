import chalk from 'chalk';
import { homedir } from 'os';
import { join } from 'path';
import * as fs from 'fs/promises';

async function checkIfBackfillNeeded(): Promise<boolean> {
  const tokenLogPath = join(homedir(), '.omc', 'state', 'token-tracking.jsonl');
  try {
    await fs.access(tokenLogPath);
    const stats = await fs.stat(tokenLogPath);
    const ageMs = Date.now() - stats.mtimeMs;
    return stats.size < 100 || ageMs > 3600000;
  } catch {
    return true;
  }
}

async function runQuickBackfill(silent: boolean = false): Promise<void> {
  const { BackfillEngine } = await import('../../analytics/backfill-engine.js');
  const engine = new BackfillEngine();
  const result = await engine.run({ verbose: false });
  if (result.entriesAdded > 0 && !silent) {
    console.log(chalk.green(`Backfilled ${result.entriesAdded} entries in ${result.timeElapsed}ms`));
  }
}

async function displayAnalyticsBanner() {
  try {
    // @ts-expect-error - gradient-string will be installed during setup
    const gradient = await import('gradient-string');
    const banner = gradient.default.pastel.multiline([
      '╔═══════════════════════════════════════╗',
      '║   Oh-My-ClaudeCode - Analytics Dashboard   ║',
      '╚═══════════════════════════════════════╝'
    ].join('\n'));
    console.log(banner);
    console.log('');
  } catch (_error) {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   Oh-My-ClaudeCode - Analytics Dashboard   ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('');
  }
}

export async function displayAnalyticsDashboard() {
  await displayAnalyticsBanner();

  const shouldAutoBackfill = await checkIfBackfillNeeded();
  if (shouldAutoBackfill) {
    console.log(chalk.yellow('First run detected - backfilling agent data...'));
    await runQuickBackfill();
  }

  console.log(chalk.bold('📊 Aggregate Session Statistics'));
  console.log(chalk.gray('─'.repeat(50)));
  const { statsCommand } = await import('../commands/stats.js');
  await statsCommand({ json: false });

  console.log('\n');

  console.log(chalk.bold('💰 Cost Analysis (Monthly)'));
  console.log(chalk.gray('─'.repeat(50)));
  const { costCommand } = await import('../commands/cost.js');
  await costCommand('monthly', { json: false });

  console.log('\n');

  console.log(chalk.bold('🤖 Top Agents'));
  console.log(chalk.gray('─'.repeat(50)));
  const { agentsCommand } = await import('../commands/agents.js');
  await agentsCommand({ json: false, limit: 10 });

  console.log('\n');
  console.log(chalk.dim('Run with --help to see all available commands'));

  const { isTokscaleCLIAvailable } = await import('./tokscale-launcher.js');
  const tuiAvailable = await isTokscaleCLIAvailable();

  if (tuiAvailable) {
    console.log('');
    console.log(chalk.dim('Tip: Run `omc tui` for an interactive token visualization dashboard'));
  }
}
