/**
 * Task Decomposer + Spec Kit Integration
 * 将 Spec Kit 的任务分解能力集成到 task-decomposer
 */
/**
 * 使用 Spec Kit 增强任务分解
 */
export declare function enhanceWithSpecKit(taskDescription: string): {
    useSpecKit: boolean;
    reason: string;
};
/**
 * 从 Spec Kit tasks.md 解析任务
 */
export declare function parseSpecKitTasks(tasksContent: string): string[];
//# sourceMappingURL=speckit-integration.d.ts.map