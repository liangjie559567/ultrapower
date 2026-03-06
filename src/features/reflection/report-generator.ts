import { writeFileSync } from 'fs';
import { join } from 'path';
import type { SessionData } from './data-collector.js';

export function generateReflectionReport(data: SessionData, directory: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = join(directory, `.omc/axiom/reflection_${timestamp}.md`);

  const report = `# Axiom 反思报告：${data.sessionId}

**会话时间**: ${timestamp}
**任务完成率**: ${calculateCompletionRate(data)}%
**总耗时**: ${data.totalTime || 'N/A'}

---

## 1. What Went Well（做得好的）

${data.completedTasks > 0 ? `- 成功完成 ${data.completedTasks} 个任务` : '- 无完成任务'}

## 2. What Could Improve（可以改进的）

${data.failedTasks > 0 ? `- ${data.failedTasks} 个任务失败，需要分析根因` : '- 无失败任务'}

## 3. Learnings（学到了什么）

- 待补充

## 4. Action Items（待办事项）

- [ ] 待补充

---

**生成时间**: ${new Date().toISOString()}
**生成方式**: 自动生成
`;

  writeFileSync(reportPath, report, 'utf-8');
  return reportPath;
}

function calculateCompletionRate(data: SessionData): number {
  const total = data.completedTasks + data.failedTasks + data.blockedTasks;
  return total > 0 ? Math.round((data.completedTasks / total) * 100) : 0;
}
