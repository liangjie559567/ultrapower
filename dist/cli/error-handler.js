/**
 * CLI error handler with friendly messages
 */
import chalk from 'chalk';
import { createFriendlyError } from '../errors/classifier.js';
export function handleCLIError(error, context) {
    const friendly = createFriendlyError(error, context);
    console.error(chalk.red.bold('\n✗ Error: ') + chalk.red(friendly.message));
    if (friendly.suggestedCommand) {
        console.error(chalk.yellow('\n💡 Did you mean: ') +
            chalk.cyan(friendly.suggestedCommand));
    }
    if (friendly.recoverySteps.length > 0) {
        console.error(chalk.yellow('\n📋 Recovery steps:'));
        friendly.recoverySteps.forEach((step, i) => {
            console.error(chalk.yellow(`  ${i + 1}. ${step}`));
        });
    }
    if (friendly.technicalDetails && process.env.DEBUG) {
        console.error(chalk.gray('\n🔍 Technical details:'));
        console.error(chalk.gray(`  ${friendly.technicalDetails}`));
    }
    console.error('');
}
export function formatErrorForLog(error) {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? '' : error.stack || '';
    return `${new Date().toISOString()} - ${message}\n${stack}`;
}
//# sourceMappingURL=error-handler.js.map