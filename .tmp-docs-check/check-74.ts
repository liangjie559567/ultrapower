export interface AgentConfig {
  name: string;
  description: string;
  prompt: string;
  model: 'haiku' | 'sonnet' | 'opus';
  defaultModel: 'haiku' | 'sonnet' | 'opus';
  tools?: string[];
  disallowedTools?: string[];
}
