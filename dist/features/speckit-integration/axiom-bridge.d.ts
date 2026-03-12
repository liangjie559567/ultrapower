/**
 * Axiom + Spec Kit Integration
 * 将 Spec Kit 工作流集成到 Axiom 需求分析流程
 */
/**
 * 在 Axiom draft 阶段推荐 Spec Kit
 */
export declare function shouldUseSpecKitInAxiom(requirement: string): boolean;
/**
 * Axiom → Spec Kit 工作流映射
 */
export declare const AXIOM_SPECKIT_MAPPING: {
    readonly 'ax-draft': "speckit.constitution";
    readonly 'ax-review': "speckit.specify";
    readonly 'ax-decompose': "speckit.plan";
    readonly 'ax-implement': "speckit.tasks";
};
//# sourceMappingURL=axiom-bridge.d.ts.map