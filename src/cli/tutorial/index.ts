/**
 * 交互式教程系统
 * 首次运行引导和示例项目
 */

import chalk from 'chalk';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfigDir } from '../../utils/config-dir.js';
import { atomicWriteJsonSync, atomicWriteFileSync } from '../../lib/atomic-write.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TUTORIAL_STATE_FILE = join(getConfigDir(), '.tutorial-state.json');

export interface TutorialState {
  completed: boolean;
  skipped: boolean;
  lastStep: number;
  timestamp: number;
}

export function isFirstRun(): boolean {
  return !existsSync(TUTORIAL_STATE_FILE);
}

export function saveTutorialState(state: TutorialState): void {
  atomicWriteJsonSync(TUTORIAL_STATE_FILE, state);
}

export async function runInteractiveTutorial(): Promise<void> {
  console.log(chalk.cyan.bold('\n🚀 欢迎使用 Ultrapower (OMC)!\n'));
  console.log('这是一个简短的交互式教程，帮助你快速上手。\n');

  const steps = [
    {
      title: '基础命令',
      content: `${chalk.yellow('omc setup')} - 初始化配置
${chalk.yellow('omc agents')} - 查看可用 agents
${chalk.yellow('omc stats')} - 查看使用统计`
    },
    {
      title: '核心工作流',
      content: `${chalk.green('/autopilot')} - 全自主执行
${chalk.green('/team')} - 多 agent 协作
${chalk.green('/ralph')} - 持久循环执行`
    },
    {
      title: '示例项目',
      content: `运行 ${chalk.cyan('omc tutorial demo')} 创建示例项目
包含完整的配置和使用示例`
    }
  ];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    console.log(chalk.bold(`\n${i + 1}. ${step.title}`));
    console.log(step.content);
  }

  console.log(chalk.green.bold('\n✓ 教程完成！\n'));
  console.log(`运行 ${chalk.cyan('omc --help')} 查看所有命令\n`);

  saveTutorialState({
    completed: true,
    skipped: false,
    lastStep: steps.length,
    timestamp: Date.now()
  });
}

export async function createDemoProject(targetDir: string): Promise<void> {
  const demoPath = join(targetDir, 'omc-demo');

  if (existsSync(demoPath)) {
    throw new Error(`目录已存在: ${demoPath}`);
  }

  mkdirSync(demoPath, { recursive: true });
  mkdirSync(join(demoPath, '.omc'), { recursive: true });

  // 复制示例项目模板
  const templateDir = join(__dirname, '../../../templates/example-project');

  if (existsSync(templateDir)) {
    const files = ['README.md', 'package.json', 'tsconfig.json'];
    files.forEach(file => {
      const src = join(templateDir, file);
      if (existsSync(src)) {
        copyFileSync(src, join(demoPath, file));
      }
    });

    mkdirSync(join(demoPath, 'src'), { recursive: true });
    const indexSrc = join(templateDir, 'src/index.ts');
    if (existsSync(indexSrc)) {
      copyFileSync(indexSrc, join(demoPath, 'src/index.ts'));
    }
  }

  // 创建示例配置
  const exampleConfig = {
    project: 'omc-demo',
    description: 'Ultrapower 示例项目',
    agents: ['executor', 'verifier']
  };

  atomicWriteJsonSync(join(demoPath, '.omc', 'config.json'), exampleConfig);

  console.log(chalk.green(`\n✓ 示例项目已创建: ${demoPath}\n`));
  console.log(`进入目录: ${chalk.cyan(`cd omc-demo`)}`);
  console.log(`开始使用: ${chalk.cyan('omc setup')}\n`);
}
