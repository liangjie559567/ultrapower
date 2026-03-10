/**
 * Tutorial command
 */

import { Command } from 'commander';
import { runInteractiveTutorial, createDemoProject, isFirstRun } from '../tutorial/index.js';

export async function tutorialCommand(args: string[]): Promise<void> {
  const subcommand = args[0];

  if (subcommand === 'demo') {
    const targetDir = args[1] || process.cwd();
    await createDemoProject(targetDir);
  } else {
    await runInteractiveTutorial();
  }
}

export async function checkFirstRun(): Promise<void> {
  if (isFirstRun()) {
    console.log('\n👋 检测到首次运行！');
    console.log('运行 "omc tutorial" 查看快速入门指南\n');
  }
}

export function createTutorialCommand(): Command {
  return new Command('tutorial')
    .description('Interactive tutorial and demo project creation')
    .argument('[subcommand]', 'Subcommand: demo')
    .argument('[args...]', 'Additional arguments')
    .action(async (subcommand, args) => {
      await tutorialCommand([subcommand, ...args]);
    });
}
