/**
 * 会话恢复机制 - F3.1
 * 启动时读取知识库、检测中断任务、语义检索相关知识
 */

import { detectInterruptedTask } from './session-detector.js';
import { retrieveRelevantKnowledge } from './knowledge-retriever.js';

export interface SessionRecoveryResult {
  hasInterruptedTask: boolean;
  taskDescription?: string;
  relevantKnowledge: Array<{ content: string; score: number }>;
  loadTimeMs: number;
}

/**
 * 会话恢复入口
 * @param directory 工作目录
 * @returns 恢复结果
 */
export async function recoverSession(directory: string): Promise<SessionRecoveryResult> {
  const startTime = Date.now();

  const interrupted = detectInterruptedTask(directory);
  const knowledge = await retrieveRelevantKnowledge(
    directory,
    interrupted.taskDescription || ''
  );

  return {
    hasInterruptedTask: interrupted.hasTask,
    taskDescription: interrupted.taskDescription,
    relevantKnowledge: knowledge,
    loadTimeMs: Date.now() - startTime,
  };
}
