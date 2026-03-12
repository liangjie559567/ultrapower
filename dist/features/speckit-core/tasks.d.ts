/**
 * Task Decomposer - 方案分解为可执行任务
 */
import type { TechnicalPlan, Task, Specification } from './types.js';
export declare function generateTasks(plan: TechnicalPlan, spec?: Specification): Promise<Task[]>;
export declare function formatTasks(tasks: Task[]): string;
//# sourceMappingURL=tasks.d.ts.map