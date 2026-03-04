/**
 * Questions - 向导问题定义
 */

import type { Question } from './types.js';

export const questions: Record<string, Question> = {
  q1: {
    id: 'q1',
    text: '你想做什么？',
    options: [
      { value: 'single', label: '实现单个功能', description: '添加一个新功能或改进现有功能' },
      { value: 'multiple', label: '实现多个功能', description: '同时开发多个独立或相关的功能' },
      { value: 'fix', label: '修复问题', description: '修复 bug、错误或测试失败' },
      { value: 'uncertain', label: '不确定，需要探索', description: '还不清楚具体要做什么，需要先分析' }
    ]
  },
  q2_single: {
    id: 'q2_single',
    text: '任务复杂度？',
    options: [
      { value: 'simple', label: '简单', description: '修改 1-3 个文件，逻辑清晰' },
      { value: 'complex', label: '复杂', description: '涉及多个模块，需要架构设计' }
    ]
  },
  q2_multiple: {
    id: 'q2_multiple',
    text: '功能是否独立？',
    options: [
      { value: 'independent', label: '是', description: '功能之间没有依赖，可以并行开发' },
      { value: 'dependent', label: '否', description: '功能之间有依赖关系，需要协调' }
    ]
  },
  q2_fix: {
    id: 'q2_fix',
    text: '问题范围？',
    options: [
      { value: 'single-file', label: '单个文件', description: '问题定位明确，影响范围小' },
      { value: 'multi-file', label: '多个文件', description: '问题涉及多个模块或不确定位置' }
    ]
  },
  q2_uncertain: {
    id: 'q2_uncertain',
    text: '需要规划吗？',
    options: [
      { value: 'need-plan', label: '是', description: '需要先分析和制定计划' },
      { value: 'no-plan', label: '否', description: '直接开始探索' }
    ]
  },
  q3_simple: {
    id: 'q3_simple',
    text: '需要持续执行直到完成？',
    options: [
      { value: 'continuous', label: '是', description: '不停止直到任务完全完成并验证通过' },
      { value: 'basic', label: '否', description: '完成基本实现即可' }
    ]
  },
  q3_multi_file: {
    id: 'q3_multi_file',
    text: '需要验证循环？',
    options: [
      { value: 'verify-loop', label: '是', description: '修复后需要反复测试验证' },
      { value: 'one-time', label: '否', description: '修复一次即可' }
    ]
  }
};
