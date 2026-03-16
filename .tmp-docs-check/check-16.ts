// 通过 getAgentDefinitions 获取所有 Agent
const agents = getAgentDefinitions();

// Agent 配置结构
interface AgentConfig {
  name: string;
  description: string;
  prompt: string;
  model: 'haiku' | 'sonnet' | 'opus';
  defaultModel: ModelType;
  tools?: string[];
  disallowedTools?: string[];
}
