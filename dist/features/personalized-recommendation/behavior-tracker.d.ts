import type { UserBehavior, UserProfile } from './types.js';
export declare class BehaviorTracker {
    static track(behavior: UserBehavior): void;
    static buildProfile(): UserProfile;
    private static loadHistory;
    private static saveHistory;
}
//# sourceMappingURL=behavior-tracker.d.ts.map