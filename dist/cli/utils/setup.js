import { install } from '../../installer/index.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('cli:setup');
export async function setupCommand() {
    logger.info('Syncing OMC components...');
    const result = install({
        force: true,
        verbose: true,
        skipClaudeCheck: true
    });
    if (result.success) {
        logger.info('✓ Setup complete');
    }
    else {
        logger.error('Setup failed:', result.message);
        if (result.errors.length > 0) {
            result.errors.forEach(err => logger.error('  -', err));
        }
        process.exit(1);
    }
}
//# sourceMappingURL=setup.js.map