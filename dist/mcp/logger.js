import { createLogger } from '../lib/unified-logger.js';
const baseLogger = createLogger('mcp:logger');
const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const currentLevel = process.env.MCP_LOG_LEVEL?.toLowerCase() || 'info';
function log(level, ...args) {
    if (levels[level] >= levels[currentLevel]) {
        baseLogger.error(`[${level.toUpperCase()}]`, ...args);
    }
}
export const logger = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
};
//# sourceMappingURL=logger.js.map