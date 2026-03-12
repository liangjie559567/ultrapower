/**
 * Delegation Routing + Spec Kit Integration
 * 在委托路由中添加 Spec Kit 工作流支持
 */
import { shouldUseSpecKit } from '../speckit-integration/index.js';
import { getNextSpecKitStep } from '../speckit-integration/router.js';
/**
 * 检查是否应该路由到 Spec Kit 工作流
 */
export function shouldRouteToSpecKit(taskDescription) {
    return shouldUseSpecKit(taskDescription);
}
/**
 * 获取 Spec Kit 委托建议
 */
export function getSpecKitDelegation(currentStage) {
    const next = getNextSpecKitStep(currentStage);
    if (!next)
        return null;
    return {
        command: next.nextCommand,
        description: next.description,
        stage: next.stage
    };
}
//# sourceMappingURL=speckit-integration.js.map