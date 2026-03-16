import { Command } from 'commander';
import { existsSync, readdirSync, unlinkSync, statSync, readFileSync } from 'fs';
import { join } from 'path';
import { validateWorkingDirectory } from '../../lib/worktree-paths.js';
import { clearModeState, getActiveModes, MODE_CONFIGS, type ExecutionMode } from '../../hooks/mode-registry/index.js';
import { createLogger } from '../../lib/unified-logger.js';
import * as readline from 'readline';

const logger = createLogger('cli:repair');

interface RepairOptions {
  fixStatePollution?: boolean;
  fixOrphanAgents?: boolean;
  validateState?: boolean;
  dryRun?: boolean;
  workingDirectory?: string;
}

async function fixStatePollution(root: string, dryRun: boolean): Promise<void> {
  logger.info(`${dryRun ? '[DRY RUN] ' : ''}Cleaning state pollution...`);

  const stateDir = join(root, '.omc', 'state');
  if (!existsSync(stateDir)) {
    logger.info('No state directory found');
    return;
  }

  const files = readdirSync(stateDir).filter(f => f.endsWith('-state.json'));
  let cleaned = 0;

  for (const file of files) {
    const path = join(stateDir, file);
    const mode = file.replace('-state.json', '') as ExecutionMode;

    if (MODE_CONFIGS[mode]) {
      const activeModes = Array.from(getActiveModes(root));
      if (!activeModes.includes(mode)) {
        logger.info(`${dryRun ? '[DRY RUN] ' : ''}Removing inactive state: ${file}`);
        if (!dryRun) {
          clearModeState(mode, root);
          cleaned++;
        }
      }
    }
  }

  logger.info(`${dryRun ? '[DRY RUN] ' : ''}Cleaned ${cleaned} state file(s)`);
}

async function fixOrphanAgents(root: string, dryRun: boolean): Promise<void> {
  logger.info(`${dryRun ? '[DRY RUN] ' : ''}Checking for orphan agents...`);

  const agentDir = join(root, '.omc', 'agents');
  if (!existsSync(agentDir)) {
    logger.info('No agent directory found');
    return;
  }

  const dirs = readdirSync(agentDir);
  let cleaned = 0;

  for (const dir of dirs) {
    const agentPath = join(agentDir, dir);
    const stat = statSync(agentPath);

    if (stat.isDirectory()) {
      const age = Date.now() - stat.mtimeMs;
      const hours = age / (1000 * 60 * 60);

      if (hours > 24) {
        logger.info(`${dryRun ? '[DRY RUN] ' : ''}Removing stale agent: ${dir} (${hours.toFixed(1)}h old)`);
        if (!dryRun) {
          const files = readdirSync(agentPath);
          for (const f of files) {
            unlinkSync(join(agentPath, f));
          }
          cleaned++;
        }
      }
    }
  }

  logger.info(`${dryRun ? '[DRY RUN] ' : ''}Cleaned ${cleaned} orphan agent(s)`);
}

async function validateStateFiles(root: string): Promise<void> {
  logger.info('Validating state files...');

  const stateDir = join(root, '.omc', 'state');
  if (!existsSync(stateDir)) {
    logger.info('No state directory found');
    return;
  }

  const files = readdirSync(stateDir).filter(f => f.endsWith('-state.json'));
  let valid = 0;
  let invalid = 0;

  for (const file of files) {
    const path = join(stateDir, file);
    try {
      const content = readFileSync(path, 'utf-8');
      JSON.parse(content);
      valid++;
    } catch {
      logger.error(`Invalid JSON in ${file}`);
      invalid++;
    }
  }

  logger.info(`Validation complete: ${valid} valid, ${invalid} invalid`);
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function interactiveRepair(root: string): Promise<void> {
  logger.info('Interactive Repair Wizard');
  logger.info('1. Fix state pollution');
  logger.info('2. Fix orphan agents');
  logger.info('3. Validate state files');

  const choice = await prompt('Select action (1-3, or "all"): ');
  const dryRunInput = await prompt('Dry run? (y/n): ');
  const dryRun = dryRunInput.toLowerCase() === 'y';

  if (choice === '1' || choice === 'all') await fixStatePollution(root, dryRun);
  if (choice === '2' || choice === 'all') await fixOrphanAgents(root, dryRun);
  if (choice === '3' || choice === 'all') await validateStateFiles(root);
}

export function createRepairCommand(): Command {
  const cmd = new Command('repair')
    .description('Repair common state and agent issues')
    .option('--fix-state-pollution', 'Clean cross-session state pollution')
    .option('--fix-orphan-agents', 'Clean orphan agent processes')
    .option('--validate-state', 'Validate state file integrity')
    .option('--dry-run', 'Preview changes without executing')
    .option('-d, --working-directory <path>', 'Working directory')
    .action(async (options: RepairOptions) => {
      const root = validateWorkingDirectory(options.workingDirectory);

      if (!options.fixStatePollution && !options.fixOrphanAgents && !options.validateState) {
        await interactiveRepair(root);
        return;
      }

      const dryRun = options.dryRun || false;

      if (options.fixStatePollution) await fixStatePollution(root, dryRun);
      if (options.fixOrphanAgents) await fixOrphanAgents(root, dryRun);
      if (options.validateState) await validateStateFiles(root);
    });

  return cmd;
}
