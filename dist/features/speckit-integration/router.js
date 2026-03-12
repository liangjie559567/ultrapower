/**
 * Spec Kit Router Integration
 * 将 Spec Kit 工作流集成到 next-step-router
 */
/**
 * Spec Kit 工作流路由表
 */
export const SPECKIT_ROUTES = {
    'start': {
        stage: 'constitution',
        nextCommand: '/speckit.constitution',
        description: '定义项目原则和约束'
    },
    'constitution_complete': {
        stage: 'specify',
        nextCommand: '/speckit.specify',
        description: '编写功能规范'
    },
    'spec_complete': {
        stage: 'plan',
        nextCommand: '/speckit.plan',
        description: '生成技术实现计划'
    },
    'plan_complete': {
        stage: 'tasks',
        nextCommand: '/speckit.tasks',
        description: '分解为可执行任务'
    },
    'tasks_complete': {
        stage: 'implement',
        nextCommand: '/speckit.implement',
        description: '执行任务实现'
    }
};
/**
 * 获取下一步 Spec Kit 命令
 */
export function getNextSpecKitStep(currentStage) {
    return SPECKIT_ROUTES[currentStage] || null;
}
//# sourceMappingURL=router.js.map