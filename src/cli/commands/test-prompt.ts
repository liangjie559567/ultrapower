import { Command } from 'commander';

export function createTestPromptCommand(): Command {
  return new Command('test-prompt')
    .argument('<prompt>', 'Prompt to test')
    .description('Test how a prompt would be enhanced')
    .action(async (prompt: string) => {
      const { testPromptCommand } = await import('../utils/test-prompt.js');
      await testPromptCommand(prompt);
    });
}
