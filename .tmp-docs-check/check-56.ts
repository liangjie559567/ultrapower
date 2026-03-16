export function getAgentDefinitions(): Record<string, {
  description: string;
  prompt: string;
  tools?: string[];
  disallowedTools?: string[];
  model?: ModelType;
  defaultModel?: ModelType;
}> {
  // 返回所有 49 个 agent 的配置
  // prompt 通过 loadAgentPrompt(name) 从 agents/*.md 动态加载
}
