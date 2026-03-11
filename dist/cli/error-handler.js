/**
 * CLI error handler with friendly messages
 */
import chalk from 'chalk';
import { createFriendlyError } from '../errors/classifier.js';
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('cli:error-handler');
export function handleCLIError(error, context) {
    const friendly = createFriendlyError(error, context);
    logger.error(chalk.red.bold('\n✗ Error: ') + chalk.red(friendly.message));
    if (friendly.suggestedCommand) {
        logger.error(chalk.yellow('\n💡 Did you mean: ') +
            chalk.cyan(friendly.suggestedCommand));
    }
    if (friendly.recoverySteps.length > 0) {
        logger.error(chalk.yellow('\n📋 Recovery steps:'));
        friendly.recoverySteps.forEach((step, i) => {
            logger.error(chalk.yellow(`  ${i + 1}. ${step}`));
        });
    }
    if (friendly.technicalDetails && process.env.DEBUG) {
        logger.error(chalk.gray('\n🔍 Technical details:'));
        logger.error(chalk.gray(`  ${friendly.technicalDetails}`));
    }
    logger.error('');
}
export function formatErrorForLog(error) {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? '' : error.stack || '';
    return `${new Date().toISOString()} - ${message}\n${stack}`;
}
//# sourceMappingURL=error-handler.js.map