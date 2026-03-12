import type { TutorialScenario } from '../types.js';

export const securityScenario: TutorialScenario = {
  id: 'security',
  title: '安全审查工作流',
  description: '学习使用 security-reviewer 进行安全审查',
  steps: [
    {
      id: 'security-1',
      title: '安全扫描',
      instruction: '使用 security-reviewer 扫描代码',
      example: 'Task(subagent_type="ultrapower:security-reviewer", prompt="审查 API 安全性")',
      validation: 'security-reviewer 返回安全报告'
    },
    {
      id: 'security-2',
      title: '修复漏洞',
      instruction: '使用 executor 修复发现的漏洞',
      example: 'Task(subagent_type="ultrapower:executor", prompt="修复安全漏洞")',
      validation: 'executor 完成修复'
    },
    {
      id: 'security-3',
      title: '重新验证',
      instruction: '再次运行安全审查',
      example: 'Task(subagent_type="ultrapower:security-reviewer", prompt="验证修复")',
      validation: 'security-reviewer 确认无漏洞'
    }
  ]
};
