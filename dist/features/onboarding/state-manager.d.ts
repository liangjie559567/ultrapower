import type { TutorialState } from './types.js';
export declare class StateManager {
    static load(): Promise<TutorialState | null>;
    static save(state: TutorialState): Promise<void>;
    static update(updates: Partial<TutorialState>): Promise<void>;
}
//# sourceMappingURL=state-manager.d.ts.map