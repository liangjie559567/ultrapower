/**
 * Tutorial command
 */
import { Command } from 'commander';
import { runInteractiveTutorial, createDemoProject, isFirstRun } from '../tutorial/index.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('commands:tutorial');
export async function tutorialCommand(args) {
    const subcommand = args[0];
    if (subcommand === 'demo') {
        const targetDir = args[1] || process.cwd();
        await createDemoProject(targetDir);
    }
    else {
        await runInteractiveTutorial();
    }
}
export async function checkFirstRun() {
    if (isFirstRun()) {
        logger.info('\n👋 检测到首次运行！');
        logger.info('运行 "omc tutorial" 查看快速入门指南\n');
    }
}
export function createTutorialCommand() {
    return new Command('tutorial')
        .description('Interactive tutorial and demo project creation')
        .argument('[subcommand]', 'Subcommand: demo')
        .argument('[args...]', 'Additional arguments')
        .action(async (subcommand, args) => {
        await tutorialCommand([subcommand, ...args]);
    });
}
//# sourceMappingURL=tutorial.js.map