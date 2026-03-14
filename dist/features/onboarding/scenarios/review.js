export const reviewScenario = {
    id: 'review',
    title: '代码审查',
    description: '学习使用多维度代码审查',
    steps: [
        {
            id: 'review-1',
            title: '准备代码',
            instruction: '使用前面生成的代码作为审查对象',
            validation: '代码已准备'
        },
        {
            id: 'review-2',
            title: '启动审查',
            instruction: '运行全面代码审查',
            example: '/ultrapower:code-review "审查实现"',
            validation: 'code-reviewer 开始审查'
        },
        {
            id: 'review-3',
            title: '查看报告',
            instruction: '审查报告包含：风格、质量、安全、性能等维度',
            validation: '收到多维度审查报告'
        }
    ]
};
//# sourceMappingURL=review.js.map