/**
 * requirement-clarifier agent 核心逻辑
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { ValidationError, InputError } from './types.js';

interface ProjectMemory {
  techStack?: string[];
  conventions?: Record<string, string>;
}

export function loadProjectMemory(): ProjectMemory {
  const memoryPath = join(process.cwd(), '.omc/project-memory.json');
  if (!existsSync(memoryPath)) return {};
  try {
    const stats = statSync(memoryPath);
    if (stats.size > 1024 * 1024) {
      throw new ValidationError('Project memory file exceeds 1MB');
    }
    return JSON.parse(readFileSync(memoryPath, 'utf-8'));
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    return {};
  }
}

export function detectPlatform(input: string, memory?: ProjectMemory): string {
  if (!input?.trim()) {
    throw new InputError('Input cannot be empty');
  }
  if (input.length > 1000) {
    throw new ValidationError('Input exceeds 1000 characters');
  }
  const lower = input.toLowerCase();

  // 优先从项目记忆推断
  if (memory?.techStack) {
    if (memory.techStack.some(t => t.includes('React Native') || t.includes('Flutter'))) return 'mobile';
    if (memory.techStack.some(t => t.includes('Electron'))) return 'desktop';
  }

  if (lower.includes('api') || lower.includes('接口')) return 'api';
  if (lower.includes('网站') || lower.includes('web')) return 'web';
  if (lower.includes('手机') || lower.includes('mobile')) return 'mobile';
  if (lower.includes('移动应用') || lower.includes('app')) return 'mobile';
  if (lower.includes('插件') || lower.includes('extension')) return 'plugin';
  if (lower.includes('桌面') || lower.includes('desktop')) return 'desktop';

  // 默认推断为 web
  if (lower.includes('应用') || lower.includes('系统') || lower.includes('平台')) return 'web';

  return 'unknown';
}

export function extractRequirements(input: string): {
  functional: string[];
  nonFunctional: string[]
} {
  if (!input?.trim()) {
    throw new InputError('Input cannot be empty');
  }
  if (input.length > 5000) {
    throw new ValidationError('Input exceeds 5000 characters');
  }

  const functional: string[] = [];
  const nonFunctional: string[] = [];

  // 识别应用类型
  if (input.includes('待办') || input.includes('todo')) {
    functional.push('待办事项管理');
  }
  if (input.includes('API') || input.includes('api') || input.includes('接口')) {
    functional.push('API 接口开发');
  }

  // 功能需求关键词
  const functionalKeywords = ['添加', '编辑', '删除', '查看', '搜索', '导出', '导入', '认证', '授权', 'JWT'];
  functionalKeywords.forEach(keyword => {
    if (input.includes(keyword)) {
      const target = input.includes('待办') ? '待办事项' : '功能';
      functional.push(`${keyword}${target}`);
    }
  });

  // 非功能需求关键词
  if (input.includes('响应时间') || input.includes('秒')) {
    nonFunctional.push('响应时间 <2s');
  }
  if (input.includes('并发')) {
    const match = input.match(/(\d+)\s*个?并发/);
    if (match) {
      nonFunctional.push(`支持 ${match[1]} 并发`);
    }
  }

  if (functional.length > 100 || nonFunctional.length > 100) {
    throw new ValidationError('Too many requirements extracted');
  }

  return { functional, nonFunctional };
}
