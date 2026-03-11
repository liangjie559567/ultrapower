import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getClaudeConfigDir } from '../../utils/paths.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('commands:config-notify-profile');
export function createConfigNotifyProfileCommand() {
    const cmd = new Command('config-notify-profile')
        .description('Manage notification profiles')
        .argument('[profile]', 'Profile name')
        .option('--list', 'List all profiles')
        .option('--show', 'Show profile configuration')
        .option('--delete', 'Delete profile')
        .action(async (profile, options) => {
        const configDir = getClaudeConfigDir();
        const configPath = join(configDir, '.omc-config.json');
        mkdirSync(configDir, { recursive: true });
        let config = { silentAutoUpdate: false };
        try {
            config = JSON.parse(readFileSync(configPath, 'utf-8'));
        }
        catch {
            // Config file doesn't exist or is invalid, use default
        }
        if (options.list) {
            const profiles = config.notificationProfiles || {};
            if (Object.keys(profiles).length === 0) {
                logger.info('No notification profiles configured');
            }
            else {
                logger.info('Notification profiles:');
                for (const name of Object.keys(profiles)) {
                    logger.info(`  - ${name}`);
                }
            }
            return;
        }
        if (!profile) {
            logger.error('Profile name required');
            process.exit(1);
        }
        if (options.show) {
            logger.info(JSON.stringify(config.notificationProfiles?.[profile] || {}, null, 2));
            return;
        }
        if (options.delete) {
            if (config.notificationProfiles?.[profile]) {
                delete config.notificationProfiles[profile];
                writeFileSync(configPath, JSON.stringify(config, null, 2));
                logger.info(`Profile "${profile}" deleted`);
            }
            else {
                logger.info(`Profile "${profile}" not found`);
            }
            return;
        }
    });
    return cmd;
}
//# sourceMappingURL=config-notify-profile.js.map