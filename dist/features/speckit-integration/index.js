/**
 * Spec Kit Integration - 将 Spec Kit 工作流集成到 ultrapower
 */
/**
 * 检测是否应该使用 Spec Kit 工作流
 */
export function shouldUseSpecKit(intent) {
    const specKitKeywords = [
        'constitution', 'specify', 'spec-driven',
        'specification', 'requirements document'
    ];
    return specKitKeywords.some(kw => intent.toLowerCase().includes(kw));
}
/**
 * 获取 Spec Kit 命令路径
 */
export function getSpecKitCommand(workflow) {
    const validWorkflows = ['constitution', 'specify', 'plan', 'tasks', 'implement'];
    if (!validWorkflows.includes(workflow)) {
        throw new Error(`Invalid workflow: ${workflow}`);
    }
    return `.claude/commands/speckit.${workflow}.md`;
}
//# sourceMappingURL=index.js.map