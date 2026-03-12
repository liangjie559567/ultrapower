/**
 * Workflow Recommender Integration
 * 扩展工作流推荐引擎以支持 Spec Kit
 */
import { shouldUseSpecKit } from './index.js';
import { getNextSpecKitStep } from './router.js';
/**
 * 分析是否推荐使用 Spec Kit 工作流
 */
export function analyzeSpecKitFit(userInput, context) {
    const useSpecKit = shouldUseSpecKit(userInput);
    if (!useSpecKit) {
        return { useSpecKit: false, confidence: 0 };
    }
    // 确定当前阶段
    let currentStage = 'start';
    if (context.hasConstitution)
        currentStage = 'constitution_complete';
    if (context.hasSpecs)
        currentStage = 'spec_complete';
    const nextRoute = getNextSpecKitStep(currentStage);
    return {
        useSpecKit: true,
        currentStage,
        nextStep: nextRoute?.nextCommand,
        confidence: 85
    };
}
//# sourceMappingURL=recommender.js.map