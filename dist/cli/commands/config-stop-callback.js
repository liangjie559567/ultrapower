import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getClaudeConfigDir } from '../../utils/paths.js';
import { createLogger } from '../../lib/unified-logger.js';
const logger = createLogger('commands:config-stop-callback');
export function createConfigStopCallbackCommand() {
    const cmd = new Command('config-stop-callback')
        .description('Configure stop hook callbacks')
        .argument('<platform>', 'Platform: discord, telegram, discord-bot, file')
        .option('--profile <name>', 'Profile name for notification profiles')
        .option('--enable', 'Enable the callback')
        .option('--disable', 'Disable the callback')
        .option('--webhook <url>', 'Discord webhook URL')
        .option('--token <token>', 'Bot token (telegram/discord-bot)')
        .option('--chat <id>', 'Telegram chat ID')
        .option('--channel-id <id>', 'Discord bot channel ID')
        .option('--tag-list <tags>', 'Comma-separated tag list')
        .option('--add-tag <tag>', 'Add a tag')
        .option('--remove-tag <tag>', 'Remove a tag')
        .option('--clear-tags', 'Clear all tags')
        .option('--show', 'Show current configuration')
        .action(async (platform, options) => {
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
        if (options.show) {
            if (options.profile) {
                logger.info(JSON.stringify(config.notificationProfiles?.[options.profile]?.[platform] || {}, null, 2));
            }
            else {
                logger.info(JSON.stringify(config.stopHookCallbacks?.[platform] || {}, null, 2));
            }
            return;
        }
        if (options.profile) {
            config.notificationProfiles = config.notificationProfiles || {};
            config.notificationProfiles[options.profile] = config.notificationProfiles[options.profile] || { enabled: true };
            const profile = config.notificationProfiles[options.profile];
            profile[platform] = profile[platform] || {};
            const platformConfig = profile[platform];
            if (options.enable !== undefined)
                platformConfig.enabled = options.enable;
            if (options.disable !== undefined)
                platformConfig.enabled = !options.disable;
            if (options.webhook)
                platformConfig.webhookUrl = options.webhook;
            if (options.token)
                platformConfig.botToken = options.token;
            if (options.chat)
                platformConfig.chatId = options.chat;
            if (options.channelId)
                platformConfig.channelId = options.channelId;
            writeFileSync(configPath, JSON.stringify(config, null, 2));
            logger.info(`Profile "${options.profile}" configured for ${platform}`);
        }
        else {
            config.stopHookCallbacks = config.stopHookCallbacks || {};
            config.stopHookCallbacks[platform] = config.stopHookCallbacks[platform] || {};
            const platformConfig = config.stopHookCallbacks[platform];
            if (options.enable !== undefined)
                platformConfig.enabled = options.enable;
            if (options.disable !== undefined)
                platformConfig.enabled = !options.disable;
            if (options.webhook)
                platformConfig.webhookUrl = options.webhook;
            if (options.token)
                platformConfig.botToken = options.token;
            if (options.chat)
                platformConfig.chatId = options.chat;
            if (platform !== 'file') {
                if (options.tagList) {
                    platformConfig.tagList = options.tagList.split(',').map((t) => t.trim());
                }
                if (options.addTag) {
                    platformConfig.tagList = platformConfig.tagList || [];
                    platformConfig.tagList.push(options.addTag);
                }
                if (options.removeTag) {
                    platformConfig.tagList = (platformConfig.tagList || []).filter((t) => t !== options.removeTag);
                }
                if (options.clearTags) {
                    platformConfig.tagList = [];
                }
            }
            writeFileSync(configPath, JSON.stringify(config, null, 2));
            logger.info(`${platform} callback configured`);
        }
    });
    return cmd;
}
//# sourceMappingURL=config-stop-callback.js.map