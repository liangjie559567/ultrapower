/**
 * Axiom + Spec Kit Integration
 * 将 Spec Kit 工作流集成到 Axiom 需求分析流程
 */
/**
 * 在 Axiom draft 阶段推荐 Spec Kit
 */
export function shouldUseSpecKitInAxiom(requirement) {
    const keywords = ['formal spec', 'detailed requirements', 'specification'];
    return keywords.some(kw => requirement.toLowerCase().includes(kw));
}
/**
 * Axiom → Spec Kit 工作流映射
 */
export const AXIOM_SPECKIT_MAPPING = {
    'ax-draft': 'speckit.constitution',
    'ax-review': 'speckit.specify',
    'ax-decompose': 'speckit.plan',
    'ax-implement': 'speckit.tasks'
};
//# sourceMappingURL=axiom-bridge.js.map