/**
 * pre-tool.ts — PreToolUse 守卫
 *
 * 注册 PreToolUse 事件，执行权限检查和范围验证。
 */

export interface PreToolContext {
  toolName: string;
  toolInput: Record<string, unknown>;
  sessionId?: string;
}

export interface PreToolResult {
  allowed: boolean;
  reason?: string;
}

/** 受限工具列表（需要额外确认） */
const RESTRICTED_TOOLS = new Set([
  'Bash',
  'Write',
  'Edit',
]);

/** 高风险命令模式 */
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /git\s+push\s+--force/,
  /git\s+reset\s+--hard/,
  /DROP\s+TABLE/i,
  /DELETE\s+FROM/i,
];

export function checkPreTool(ctx: PreToolContext): PreToolResult {
  const { toolName, toolInput } = ctx;

  // Bash 命令安全检查
  if (toolName === 'Bash') {
    const cmd = String(toolInput['command'] ?? '');
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(cmd)) {
        return {
          allowed: false,
          reason: `Dangerous command pattern detected: ${pattern.source}`,
        };
      }
    }
  }

  // Write 路径范围检查
  if (toolName === 'Write') {
    const filePath = String(toolInput['file_path'] ?? '');
    if (filePath.includes('~/.claude') || filePath.includes('node_modules')) {
      return {
        allowed: false,
        reason: `Write to restricted path: ${filePath}`,
      };
    }
  }

  return { allowed: true };
}

export function isRestrictedTool(toolName: string): boolean {
  return RESTRICTED_TOOLS.has(toolName);
}
