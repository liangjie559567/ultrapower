/**
 * Task Decomposer - 方案分解为可执行任务
 */
export async function generateTasks(plan) {
    const tasks = [];
    let taskId = 1;
    plan.components.forEach(component => {
        tasks.push({
            id: `TASK-${String(taskId++).padStart(3, '0')}`,
            title: `Implement ${component.name}`,
            description: component.purpose,
            dependencies: [],
            estimatedEffort: '2h'
        });
    });
    tasks.push({
        id: `TASK-${String(taskId++).padStart(3, '0')}`,
        title: 'Write tests',
        description: 'Add unit and integration tests',
        dependencies: [tasks[0].id],
        estimatedEffort: '1h'
    });
    return tasks;
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