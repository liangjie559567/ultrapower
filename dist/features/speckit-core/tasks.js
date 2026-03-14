/**
 * Task Decomposer - 方案分解为可执行任务
 */
export async function generateTasks(plan, spec) {
    let taskId = 1;
    // 为每个组件生成实现任务
    const tasks = plan.components.map((component) => {
        const isExisting = component.name.includes('Existing');
        const effort = estimateEffort(component, spec);
        return {
            id: `TASK-${String(taskId++).padStart(3, '0')}`,
            title: isExisting ? `Update ${component.name}` : `Implement ${component.name}`,
            description: `${component.purpose}\nFiles: ${component.files.join(', ')}`,
            dependencies: [],
            estimatedEffort: effort
        };
    });
    // 测试任务依赖所有实现任务
    const implTaskIds = tasks.filter(t => !t.title.includes('Test')).map(t => t.id);
    const testTask = tasks.find(t => t.title.includes('Test'));
    if (testTask && implTaskIds.length > 0) {
        testTask.dependencies = implTaskIds;
    }
    // 如果有依赖需要安装
    if (plan.dependencies.length > 0) {
        tasks.unshift({
            id: `TASK-${String(taskId++).padStart(3, '0')}`,
            title: 'Install dependencies',
            description: `Add required packages: ${plan.dependencies.join(', ')}`,
            dependencies: [],
            estimatedEffort: '15m'
        });
    }
    // 按优先级排序
    return sortByPriority(tasks, spec);
}
function estimateEffort(component, spec) {
    const fileCount = component.files.length;
    const isTest = component.name.toLowerCase().includes('test');
    if (isTest)
        return fileCount > 2 ? '2h' : '1h';
    const highPriorityCount = spec?.requirements.filter(r => r.priority === 'high').length || 0;
    if (highPriorityCount > 3)
        return fileCount > 2 ? '4h' : '3h';
    return fileCount > 2 ? '3h' : '2h';
}
function sortByPriority(tasks, spec) {
    if (!spec)
        return tasks;
    const hasHighPriority = spec.requirements.some(r => r.priority === 'high');
    if (!hasHighPriority)
        return tasks;
    // 保持依赖顺序，但优先处理核心实现
    return tasks.sort((a, b) => {
        if (a.dependencies.includes(b.id))
            return 1;
        if (b.dependencies.includes(a.id))
            return -1;
        if (a.title.includes('Core') || a.title.includes('Main'))
            return -1;
        if (b.title.includes('Core') || b.title.includes('Main'))
            return 1;
        return 0;
    });
}
export function formatTasks(tasks) {
    let output = `# Task List\n\n`;
    tasks.forEach(task => {
        output += `## ${task.id}: ${task.title}\n`;
        output += `${task.description}\n`;
        output += `**Effort:** ${task.estimatedEffort}\n`;
        if (task.dependencies.length > 0) {
            output += `**Depends on:** ${task.dependencies.join(', ')}\n`;
        }
        output += `\n`;
    });
    return output;
}
//# sourceMappingURL=tasks.js.map