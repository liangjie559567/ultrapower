import type { TutorialScenario } from '../types.js';

export const teamScenario: TutorialScenario = {
  id: 'team',
  title: 'Team 协作工作流',
  description: '学习使用 team 模式进行多 agent 协作',
  steps: [
    {
      id: 'team-1',
      title: '创建团队',
      instruction: '使用 /team 创建协作团队',
      example: '/team 3:executor "实现用户认证功能"',
      validation: 'team 创建成功，3 个 executor 开始工作'
    },
    {
      id: 'team-2',
      title: '监控进度',
      instruction: '使用 TaskList 查看任务进度',
      example: 'TaskList()',
      validation: '显示所有任务状态'
    },
    {
      id: 'team-3',
      title: '团队通信',
      instruction: '使用 SendMessage 与队友通信',
      example: 'SendMessage(type="message", recipient="worker-1", content="需要帮助")',
      validation: '消息成功发送'
    }
  ]
};
