/**
 * 会话中断检测器
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export interface InterruptedTaskResult {
  hasTask: boolean;
  taskDescription?: string;
}

/**
 * 检测中断的任务
 */
export function detectInterruptedTask(directory: string): InterruptedTaskResult {
  const contextPath = join(directory, '.omc', 'axiom', 'active_context.md');

  if (!existsSync(contextPath)) {
    return { hasTask: false };
  }

  try {
    const content = readFileSync(contextPath, 'utf-8');
    const statusMatch = content.match(/## Status\s+(\w+)/);
    const taskMatch = content.match(/## Current Task\s+(.+?)(?=\n##|\n\n|$)/s);

    if (statusMatch?.[1] === 'EXECUTING' && taskMatch?.[1]?.trim()) {
      return {
        hasTask: true,
        taskDescription: taskMatch[1].trim(),
      };
    }
  } catch {
    // 读取失败，视为无中断任务
  }

  return { hasTask: false };
}
