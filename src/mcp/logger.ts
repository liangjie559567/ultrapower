type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.MCP_LOG_LEVEL?.toLowerCase() as LogLevel) || 'info';

function log(level: LogLevel, ...args: any[]) {
  if (levels[level] >= levels[currentLevel]) {
    console.error(`[${level.toUpperCase()}]`, ...args);
  }
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
};
