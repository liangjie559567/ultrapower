export async function executeWorkflow(workflow, prompt) {
    console.log(`[Auto-Workflow] 执行 ${workflow}: ${prompt}`);
    // 实际执行逻辑由调用方处理
}
export function formatRecommendation(rec) {
    return `推荐: ${rec.workflow} (${(rec.confidence * 100).toFixed(0)}%)
原因: ${rec.reason}
备选: ${rec.alternatives?.join(', ') || '无'}`;
}
//# sourceMappingURL=executor.js.map