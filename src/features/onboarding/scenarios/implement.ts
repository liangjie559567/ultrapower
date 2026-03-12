import type { TutorialScenario } from '../types.js';

export const implementScenario: TutorialScenario = {
  id: 'implement',
  title: '实现功能',
  description: '学习使用 autopilot 从想法到代码',
  steps: [
    {
      id: 'step1',
      title: '描述需求',
      instruction: '尝试说："创建一个计算斐波那契数列的函数"',
      example: '/ultrapower:autopilot "创建一个计算斐波那契数列的函数"',
      validation: 'autopilot 开始执行'
    },
    {
      id: 'step2',
      title: '观察执行',
      instruction: 'autopilot 会自动规划、实现、测试。观察输出中的各个阶段。',
      validation: '看到规划、实现、测试阶段'
    },
    {
      id: 'step3',
      title: '验证结果',
      instruction: '检查生成的代码文件，确认功能已实现。',
      validation: '代码文件已生成且功能正确'
    }
  ]
};
