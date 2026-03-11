import { Command } from 'commander';
import { getQueryEngine } from '../../analytics/query-engine.js';
import { cleanupStaleBackgroundTasks } from '../../hud/background-cleanup.js';
import { colors } from '../utils/formatting.js';
import { cleanupStaleBridges } from '../../tools/python-repl/bridge-manager.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('commands:cleanup');
export async function cleanupCommand(options) {
    logger.info(colors.bold('\n🧹 Running Cleanup...\n'));
    const retentionDays = options.retention || 30;
    // Clean old token logs
    const engine = getQueryEngine();
    const { removedTokens, removedMetrics } = await engine.cleanupOldData(retentionDays);
    // Clean stale background tasks
    const removedTasks = await cleanupStaleBackgroundTasks();
    // Clean stale python bridge artifacts (bridge_meta.json/bridge.sock/session.lock)
    const pythonCleanup = await cleanupStaleBridges();
    logger.info(`Removed ${removedTokens} old token logs (older than ${retentionDays} days)`);
    logger.info(`Removed ${removedMetrics} old metric events`);
    logger.info(`Removed ${removedTasks} stale background tasks`);
    logger.info(`Removed ${pythonCleanup.filesRemoved} stale python_repl bridge file(s) ` +
        `(${pythonCleanup.staleSessions} stale session(s), ${pythonCleanup.activeSessions} active session(s) skipped)`);
    logger.info(colors.green('\n✓ Cleanup complete\n'));
}
export function createCleanupCommand() {
    return new Command('cleanup')
        .description('Clean up old logs and orphaned background tasks')
        .option('--retention <days>', 'Retention period in days', '30')
        .action(cleanupCommand);
}
//# sourceMappingURL=cleanup.js.map