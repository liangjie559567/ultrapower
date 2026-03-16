export enum HookSeverity {
  CRITICAL = 'critical',  // 失败必须阻塞操作
  HIGH = 'high',          // 失败应该阻塞（可配置）
  LOW = 'low'             // 失败可以继续
}

// 实际映射关系
export const HOOK_SEVERITY: Record<HookType, HookSeverity> = {
  'permission-request': HookSeverity.CRITICAL,
  'pre-tool-use': HookSeverity.CRITICAL,
  'session-end': HookSeverity.HIGH,
  'subagent-start': HookSeverity.HIGH,
  'subagent-stop': HookSeverity.HIGH,
  'setup-init': HookSeverity.HIGH,
  'setup-maintenance': HookSeverity.HIGH,
  'setup': HookSeverity.HIGH,
  // ... 其他为 LOW
};
