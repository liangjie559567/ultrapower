export interface NexusConfig {
  enabled: boolean;
  gitRemote: string;
  telegramToken?: string;
  telegramChatId?: string;
  autoApplyThreshold: number;
  consciousnessInterval: number;
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
