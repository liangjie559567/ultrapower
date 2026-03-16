import { BehaviorTracker } from './behavior-tracker.js';
export class PersonalizedRecommender {
    static getRecommendations(_prompt) {
        const profile = BehaviorTracker.buildProfile();
        const recommendations = [];
        if (profile.preferredWorkflows.length > 0) {
            recommendations.push({
                type: 'workflow',
                target: profile.preferredWorkflows[0],
                reason: `你经常使用 ${profile.preferredWorkflows[0]}`,
                confidence: 0.8
            });
        }
        if (profile.frequentAgents.length > 0) {
            recommendations.push({
                type: 'agent',
                target: profile.frequentAgents[0],
                reason: `你常用的 agent`,
                confidence: 0.75
            });
        }
        return recommendations;
    }
}
//# sourceMappingURL=recommender.js.map