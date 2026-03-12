import type { TutorialScenario } from '../types.js';

export const debugScenario: TutorialScenario = {
  id: 'debug',
  title: '调试问题',
  description: '学习使用 debugger 诊断和修复问题',
  steps: [
    {
      id: 'debug-1',
      title: '发现问题',
      instruction: '描述遇到的问题或错误',
      example: '/ultrapower:analyze "登录功能返回 500 错误"',
      validation: 'debugger 开始分析'
    },
    {
      id: 'debug-2',
      title: '根因分析',
      instruction: 'debugger 会分析日志、代码和堆栈',
      validation: '看到根因分析报告'
    },
    {
      id: 'debug-3',
      title: '查看建议',
      instruction: 'debugger 提供修复建议',
      validation: '收到具体修复方案'
    },
    {
      id: 'debug-4',
      title: '应用修复',
      instruction: '使用 executor 应用修复',
      example: 'Task(subagent_type="ultrapower:executor", prompt="应用修复")',
      validation: '修复已应用且问题解决'
    }
  ]
};
