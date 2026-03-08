/**
 * Environment variable validation for sensitive operations.
 * Prevents injection attacks and enforces whitelist policies.
 *
 * Spec: docs/standards/runtime-protection.md §2.5
 */
import { auditLogger } from '../audit/logger.js';
/** Whitelist of allowed environment variable names */
const ENV_WHITELIST = new Set([
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'TMPDIR',
    'TEMP',
    'TMP',
    'NODE_ENV',
    'NODE_OPTIONS',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_API_KEY',
    'GEMINI_API_KEY',
    'CODEX_API_KEY',
    'DISCORD_WEBHOOK_URL',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
]);
/** Patterns that indicate potential injection attempts */
const INJECTION_PATTERNS = [
    /[;&|`$()]/, // Shell metacharacters
    /\.\./, // Path traversal
    /[\r\n]/, // Line breaks
    /\x00/, // Null bytes
];
/**
 * Validate environment variable name against whitelist.
 */
export function validateEnvName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, reason: 'empty_or_invalid_name' };
    }
    if (!ENV_WHITELIST.has(name)) {
        auditLogger.log({
            actor: 'system',
            action: 'env_validation_failed',
            resource: name,
            result: 'failure',
            metadata: { reason: 'not_whitelisted' }
        }).catch(() => { });
        return { valid: false, reason: 'not_whitelisted' };
    }
    return { valid: true };
}
/**
 * Validate environment variable value for injection patterns.
 */
export function validateEnvValue(value, varName) {
    if (value === undefined || value === null) {
        return { valid: true }; // Allow empty values
    }
    const strValue = String(value);
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(strValue)) {
            auditLogger.log({
                actor: 'system',
                action: 'env_injection_detected',
                resource: varName,
                result: 'failure',
                metadata: {
                    reason: 'injection_pattern_match',
                    pattern: pattern.source
                }
            }).catch(() => { });
            return { valid: false, reason: 'injection_pattern_detected' };
        }
    }
    return { valid: true };
}
/**
 * Safely get environment variable with validation.
 * @throws {Error} If variable name is not whitelisted or value contains injection patterns
 */
export function getValidatedEnv(name) {
    const nameCheck = validateEnvName(name);
    if (!nameCheck.valid) {
        throw new Error(`Environment variable not allowed: ${name} (${nameCheck.reason})`);
    }
    const value = process.env[name];
    if (value !== undefined) {
        const valueCheck = validateEnvValue(value, name);
        if (!valueCheck.valid) {
            throw new Error(`Environment variable contains unsafe content: ${name} (${valueCheck.reason})`);
        }
    }
    return value;
}
/**
 * Add custom environment variable to whitelist (for plugin/extension use).
 */
export function addToWhitelist(name) {
    if (name && typeof name === 'string' && /^[A-Z_][A-Z0-9_]*$/.test(name)) {
        ENV_WHITELIST.add(name);
    }
}
//# sourceMappingURL=env-validator.js.map