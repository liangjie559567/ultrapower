export enum HookSeverity {
  CRITICAL = 'critical',  // 失败必须阻塞
  HIGH = 'high',          // 默认阻塞（可配置）
  LOW = 'low'             // 失败继续
}
