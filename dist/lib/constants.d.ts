/**
 * 全局常量定义
 * 消除魔法数字，提高代码可维护性
 */
export declare const TIMEOUT: {
    readonly MCP_READY: 10000;
    readonly MCP_CALL: 30000;
    readonly MCP_PING: 1000;
    readonly VERIFICATION: 60000;
};
export declare const RETRY: {
    readonly MAX_ATTEMPTS: 3;
    readonly INITIAL_DELAY: 1000;
    readonly MAX_DELAY: 30000;
    readonly BACKOFF_MULTIPLIER: 2;
};
export declare const CACHE: {
    readonly FILE_TTL: 5000;
    readonly MAX_AGENT_MAP_SIZE: 50;
};
export declare const SIZE_LIMIT: {
    readonly AUDIT_LOG_MAX: number;
    readonly MAX_CONCURRENT_TASKS: 1000;
    readonly MAX_TASKS_PER_CONFIG: 100;
    readonly TELEGRAM_MESSAGE_MAX: 500;
    readonly SANITIZE_DEFAULT: 30;
};
export declare const RATE_LIMIT: {
    readonly DISCORD_PER_MINUTE: 10;
    readonly TELEGRAM_PER_MINUTE: 10;
    readonly DISCORD_FETCH_LIMIT: 10;
};
export declare const TIME_THRESHOLD: {
    readonly DURATION_WARNING: number;
    readonly DURATION_CRITICAL: number;
    readonly SESSION_STALE: number;
    readonly WORKING_MEMORY_TTL: 7;
    readonly UPDATE_CHECK_INTERVAL: 24;
};
export declare const SEARCH: {
    readonly FUZZY_THRESHOLD: 60;
    readonly MAX_RESULTS: 5;
    readonly MAX_RESULTS_EXTENDED: 10;
};
export declare const TASK: {
    readonly MAX_SUBTASKS: 5;
    readonly LEARNING_QUEUE_BATCH: 3;
    readonly MAX_DEPTH: 3;
    readonly MAX_LINES_DISPLAY: 5;
    readonly MAX_FILES_DISPLAY: 10;
};
export declare const CONFIDENCE: {
    readonly MIN: 0.1;
};
export declare const VALIDATION: {
    readonly MAX_ROUNDS: 3;
    readonly MAX_UPDATE_RETRIES: 3;
};
//# sourceMappingURL=constants.d.ts.map