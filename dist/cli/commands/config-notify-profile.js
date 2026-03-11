import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getClaudeConfigDir } from '../../utils/paths.js';
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
                console.log('No notification profiles configured');
            }
            else {
                console.log('Notification profiles:');
                for (const name of Object.keys(profiles)) {
                    console.log(`  - ${name}`);
                }
            }
            return;
        }
        if (!profile) {
            console.error('Profile name required');
            process.exit(1);
        }
        if (options.show) {
            console.log(JSON.stringify(config.notificationProfiles?.[profile] || {}, null, 2));
            return;
        }
        if (options.delete) {
            if (config.notificationProfiles?.[profile]) {
                delete config.notificationProfiles[profile];
                writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(`Profile "${profile}" deleted`);
            }
            else {
                console.log(`Profile "${profile}" not found`);
            }
            return;
        }
    });
    return cmd;
}
//# sourceMappingURL=config-notify-profile.js.map