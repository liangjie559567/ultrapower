const levels = { debug: 0, info: 1, warn: 2, error: 3 };
function getCurrentLevel() {
    return process.env.OMC_LOG_LEVEL?.toLowerCase() || 'info';
}
function shouldLog(level) {
    return levels[level] >= levels[getCurrentLevel()];
}
function format(level, context, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
    return `${prefix} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
}
export function createLogger(context) {
    return {
        debug: (...args) => shouldLog('debug') && console.debug(format('debug', context, ...args)),
        info: (...args) => shouldLog('info') && console.log(format('info', context, ...args)),
        warn: (...args) => shouldLog('warn') && console.warn(format('warn', context, ...args)),
        error: (...args) => shouldLog('error') && console.error(format('error', context, ...args)),
        security: (...args) => shouldLog('warn') && console.warn(format('warn', context, '[SECURITY]', ...args)),
    };
}
export const logger = createLogger('ultrapower');
//# sourceMappingURL=unified-logger.js.map