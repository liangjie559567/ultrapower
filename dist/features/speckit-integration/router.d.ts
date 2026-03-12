/**
 * Spec Kit Router Integration
 * 将 Spec Kit 工作流集成到 next-step-router
 */
export interface SpecKitRoute {
    stage: string;
    nextCommand: string;
    description: string;
}
/**
 * Spec Kit 工作流路由表
 */
export declare const SPECKIT_ROUTES: Record<string, SpecKitRoute>;
/**
 * 获取下一步 Spec Kit 命令
 */
export declare function getNextSpecKitStep(currentStage: string): SpecKitRoute | null;
//# sourceMappingURL=router.d.ts.map