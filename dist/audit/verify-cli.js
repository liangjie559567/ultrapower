import { auditLogger } from './logger.js';
import { createLogger } from '../lib/unified-logger.js';
const logger = createLogger('audit:verify-cli');
async function main() {
    const result = await auditLogger.verify();
    logger.info(`Audit log verification:`);
    logger.info(`  Valid entries: ${result.valid}`);
    logger.info(`  Invalid entries: ${result.invalid}`);
    process.exit(result.invalid > 0 ? 1 : 0);
}
main();
//# sourceMappingURL=verify-cli.js.map