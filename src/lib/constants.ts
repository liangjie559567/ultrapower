/**
 * 全局常量定义
 * 消除魔法数字，提高代码可维护性
 */

// ============ 超时配置 ============
export const TIMEOUT = {
  MCP_READY: 10000,           // MCP 服务器就绪等待时间
  MCP_CALL: 30000,            // MCP 调用超时
  MCP_PING: 1000,             // MCP ping 超时
  VERIFICATION: 60000,        // 验证超时
} as const;

// ============ 重试配置 ============
export const RETRY = {
  MAX_ATTEMPTS: 3,            // 最大重试次数
  INITIAL_DELAY: 1000,        // 初始延迟 (ms)
  MAX_DELAY: 30000,           // 最大延迟 (ms)
  BACKOFF_MULTIPLIER: 2,      // 退避倍数
} as const;

// ============ 缓存配置 ============
export const CACHE = {
  FILE_TTL: 5000,             // 文件缓存 TTL (ms)
  MAX_AGENT_MAP_SIZE: 50,     // Agent 映射最大大小
} as const;

// ============ 大小限制 ============
export const SIZE_LIMIT = {
  AUDIT_LOG_MAX: 10 * 1024 * 1024,  // 审计日志最大 10MB
  MAX_CONCURRENT_TASKS: 1000,        // 最大并发任务数
  MAX_TASKS_PER_CONFIG: 100,         // 配置中最大任务数
  TELEGRAM_MESSAGE_MAX: 500,         // Telegram 消息最大长度
  SANITIZE_DEFAULT: 30,              // 默认清理长度
} as const;

// ============ 速率限制 ============
export const RATE_LIMIT = {
  DISCORD_PER_MINUTE: 10,     // Discord 每分钟消息数
  TELEGRAM_PER_MINUTE: 10,    // Telegram 每分钟消息数
  DISCORD_FETCH_LIMIT: 10,    // Discord 获取消息数
} as const;

// ============ 时间阈值 ============
export const TIME_THRESHOLD = {
  DURATION_WARNING: 2 * 60 * 1000,   // 2分钟警告
  DURATION_CRITICAL: 5 * 60 * 1000,  // 5分钟严重
  SESSION_STALE: 24 * 60 * 60 * 1000, // 24小时过期
  WORKING_MEMORY_TTL: 7,              // 工作记忆保留天数
  UPDATE_CHECK_INTERVAL: 24,          // 更新检查间隔(小时)
} as const;

// ============ 搜索配置 ============
export const SEARCH = {
  FUZZY_THRESHOLD: 60,        // 模糊搜索阈值
  MAX_RESULTS: 5,             // 最大结果数
  MAX_RESULTS_EXTENDED: 10,   // 扩展最大结果数
} as const;

// ============ 任务配置 ============
export const TASK = {
  MAX_SUBTASKS: 5,            // 最大子任务数
  LEARNING_QUEUE_BATCH: 3,    // 学习队列批次大小
  MAX_DEPTH: 3,               // 最大深度
  MAX_LINES_DISPLAY: 5,       // 最大显示行数
  MAX_FILES_DISPLAY: 10,      // 最大显示文件数
} as const;

// ============ 置信度阈值 ============
export const CONFIDENCE = {
  MIN: 0.1,                   // 最小置信度
} as const;

// ============ 验证配置 ============
export const VALIDATION = {
  MAX_ROUNDS: 3,              // 最大验证轮次
  MAX_UPDATE_RETRIES: 3,      // 最大更新重试次数
} as const;
