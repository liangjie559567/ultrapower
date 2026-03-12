/**
 * Spec Kit Integration - 将 Spec Kit 工作流集成到 ultrapower
 */

export interface SpecKitWorkflow {
  constitution: () => Promise<string>;
  specify: (feature: string) => Promise<string>;
  plan: (spec: string) => Promise<string>;
  tasks: (plan: string) => Promise<string[]>;
  implement: (task: string) => Promise<void>;
}

/**
 * 检测是否应该使用 Spec Kit 工作流
 */
export function shouldUseSpecKit(intent: string): boolean {
  const specKitKeywords = [
    'constitution', 'specify', 'spec-driven',
    'specification', 'requirements document'
  ];
  return specKitKeywords.some(kw => intent.toLowerCase().includes(kw));
}

/**
 * 获取 Spec Kit 命令路径
 */
export function getSpecKitCommand(workflow: keyof SpecKitWorkflow): string {
  return `.claude/commands/speckit.${workflow}.md`;
}
