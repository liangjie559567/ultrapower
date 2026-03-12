import { Command } from 'commander';
export function createTestPromptCommand() {
    return new Command('test-prompt')
        .argument('<prompt>', 'Prompt to test')
        .description('Test how a prompt would be enhanced')
        .action(async (prompt) => {
        const { testPromptCommand } = await import('../utils/test-prompt.js');
        await testPromptCommand(prompt);
    });
}
//# sourceMappingURL=test-prompt.js.map