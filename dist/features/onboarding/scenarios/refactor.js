export const refactorScenario = {
    id: 'refactor',
    title: '重构工作流',
    description: '学习使用 architect 和 executor 进行安全重构',
    steps: [
        {
            id: 'refactor-1',
            title: '架构分析',
            instruction: '使用 architect agent 分析代码结构',
            example: 'Task(subagent_type="ultrapower:architect", prompt="分析 auth 模块的架构")',
            validation: 'architect agent 返回架构分析报告'
        },
        {
            id: 'refactor-2',
            title: '重构计划',
            instruction: '使用 planner 创建重构计划',
            example: 'Task(subagent_type="ultrapower:planner", prompt="创建 auth 模块重构计划")',
            validation: 'planner 返回分步重构计划'
        },
        {
            id: 'refactor-3',
            title: '执行重构',
            instruction: '使用 executor 执行重构',
            example: 'Task(subagent_type="ultrapower:executor", prompt="按计划重构 auth 模块")',
            validation: 'executor 完成重构并通过测试'
        },
        {
            id: 'refactor-4',
            title: '验证结果',
            instruction: '使用 verifier 验证重构结果',
            example: 'Task(subagent_type="ultrapower:verifier", prompt="验证 auth 模块重构")',
            validation: 'verifier 确认重构成功且无回归'
        }
    ]
};
//# sourceMappingURL=refactor.js.map