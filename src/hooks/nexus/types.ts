export interface NexusConfig {
  /** 是否启用 nexus 系统 */
  enabled: boolean;
  /** nexus-daemon 仓库的 git remote URL */
  gitRemote: string;
  /** Telegram Bot Token（可选） */
  telegramToken?: string;
  /** Telegram Chat ID（可选） */
  telegramChatId?: string;
  /** 自动应用改进建议的置信度阈值（0-100） */
  autoApplyThreshold: number;
  /** 后台意识循环间隔（秒） */
  consciousnessInterval: number;
  /** 意识循环的 API 预算上限（百分比，0-100） */
  consciousnessBudgetPercent: number;
}

export interface SessionEvent {
  sessionId: string;
  timestamp: string;
  directory: string;
  durationMs?: number;
  toolCalls: ToolCallRecord[];
  agentsSpawned: number;
  agentsCompleted: number;
  modesUsed: string[];
  skillsInjected: string[];
  patternsSeen: PatternRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  agentRole?: string;
  skillName?: string;
  timestamp: number;
}

export interface PatternRecord {
  problem: string;
  solution: string;
  confidence: number;
  occurrences: number;
}

export interface ImprovementSuggestion {
  id: string;
  createdAt: string;
  source: 'evolution_engine' | 'consciousness_loop' | 'self_evaluator';
  type: 'skill_update' | 'agent_update' | 'hook_update' | 'trigger_update';
  targetFile: string;
  confidence: number;
  diff: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: 'pending' | 'applied' | 'rejected' | 'failed';
  testResult: string | null;
}
