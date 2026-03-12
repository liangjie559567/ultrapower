/**
 * Task Decomposer + Spec Kit Integration
 * 将 Spec Kit 的任务分解能力集成到 task-decomposer
 */

/**
 * 使用 Spec Kit 增强任务分解
 */
export function enhanceWithSpecKit(
  taskDescription: string
): { useSpecKit: boolean; reason: string } {
  // 检测是否适合使用 Spec Kit
  const needsSpecKit =
    taskDescription.length > 500 ||
    /specification|requirements|formal/.test(taskDescription);

  return {
    useSpecKit: needsSpecKit,
    reason: needsSpecKit
      ? 'Task complexity suggests using Spec Kit for structured decomposition'
      : 'Standard decomposition sufficient'
  };
}

/**
 * 从 Spec Kit tasks.md 解析任务
 */
export function parseSpecKitTasks(tasksContent: string): string[] {
  const lines = tasksContent.split('\n');
  const tasks: string[] = [];

  for (const line of lines) {
    if (/^[-*]\s+/.test(line)) {
      tasks.push(line.replace(/^[-*]\s+/, '').trim());
    }
  }

  return tasks;
}
