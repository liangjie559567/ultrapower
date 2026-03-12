type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function getCurrentLevel(): LogLevel {
  return (process.env.OMC_LOG_LEVEL?.toLowerCase() as LogLevel) || 'info';
}

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[getCurrentLevel()];
}

function format(level: LogLevel, context: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  return `${prefix} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
}

export function createLogger(context: string) {
  return {
    debug: (...args: unknown[]) => shouldLog('debug') && console.debug(format('debug', context, ...args)),
    info: (...args: unknown[]) => shouldLog('info') && console.log(format('info', context, ...args)),
    warn: (...args: unknown[]) => shouldLog('warn') && console.warn(format('warn', context, ...args)),
    error: (...args: unknown[]) => shouldLog('error') && console.error(format('error', context, ...args)),
    security: (...args: unknown[]) => shouldLog('warn') && console.warn(format('warn', context, '[SECURITY]', ...args)),
  };
}

export const logger = createLogger('ultrapower');
