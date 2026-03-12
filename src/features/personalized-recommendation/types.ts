export interface UserBehavior {
  timestamp: string;
  action: 'skill_used' | 'agent_called' | 'workflow_selected';
  target: string;
  success: boolean;
}

export interface UserProfile {
  preferredWorkflows: string[];
  frequentAgents: string[];
  skillUsageCount: Record<string, number>;
  lastActive: string;
}

export interface Recommendation {
  type: 'workflow' | 'agent' | 'skill';
  target: string;
  reason: string;
  confidence: number;
}
