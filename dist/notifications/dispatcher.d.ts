/**
 * Notification Dispatcher
 *
 * Sends notifications to configured platforms (Discord, Telegram, Slack, webhook).
 * All sends are non-blocking with timeouts. Failures are swallowed to avoid
 * blocking hooks.
 */
import type { DiscordNotificationConfig, DiscordBotNotificationConfig, TelegramNotificationConfig, SlackNotificationConfig, WebhookNotificationConfig, NotificationPayload, NotificationResult, DispatchResult, NotificationConfig, NotificationEvent } from "./types.js";
/**
 * Send notification via Discord webhook.
 */
export declare function sendDiscord(config: DiscordNotificationConfig, payload: NotificationPayload): Promise<NotificationResult>;
/**
 * Send notification via Discord Bot API (token + channel ID).
 * Bot token and channel ID should be resolved in config layer.
 */
export declare function sendDiscordBot(config: DiscordBotNotificationConfig, payload: NotificationPayload): Promise<NotificationResult>;
/**
 * Send notification via Telegram bot API.
 * Uses native https module with IPv4 to avoid fetch/undici IPv6 connectivity issues.
 */
export declare function sendTelegram(config: TelegramNotificationConfig, payload: NotificationPayload): Promise<NotificationResult>;
/**
 * Send notification via Slack incoming webhook.
 */
export declare function sendSlack(config: SlackNotificationConfig, payload: NotificationPayload): Promise<NotificationResult>;
/**
 * Send notification via generic webhook (POST JSON).
 */
export declare function sendWebhook(config: WebhookNotificationConfig, payload: NotificationPayload): Promise<NotificationResult>;
/**
 * Dispatch notifications to all enabled platforms for an event.
 *
 * Runs all sends in parallel with an overall timeout.
 * Individual failures don't block other platforms.
 */
export declare function dispatchNotifications(config: NotificationConfig, event: NotificationEvent, payload: NotificationPayload): Promise<DispatchResult>;
//# sourceMappingURL=dispatcher.d.ts.map