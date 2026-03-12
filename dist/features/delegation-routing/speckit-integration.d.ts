/**
 * Delegation Routing + Spec Kit Integration
 * 在委托路由中添加 Spec Kit 工作流支持
 */
/**
 * 检查是否应该路由到 Spec Kit 工作流
 */
export declare function shouldRouteToSpecKit(taskDescription: string): boolean;
/**
 * 获取 Spec Kit 委托建议
 */
export declare function getSpecKitDelegation(currentStage: string): {
    command: string;
    description: string;
    stage: string;
} | null;
//# sourceMappingURL=speckit-integration.d.ts.map