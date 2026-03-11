/**
 * Mode Cancellation Synchronization
 *
 * Handles synchronized cancellation of linked modes (team+ralph, autopilot+team, etc.)
 */
/**
 * Clear a mode and all its linked modes recursively
 */
export declare function clearModeWithLinked(mode: string, directory: string, sessionId?: string, visited?: Set<string>, depth?: number): string[];
type ValidMode = 'autopilot' | 'ralph' | 'ultrapilot' | 'team' | 'ultraqa' | 'ultrawork' | 'pipeline' | 'swarm' | 'ralplan';
/**
 * Link two modes together bidirectionally
 */
export declare function linkModes(mode1: ValidMode, mode2: ValidMode, directory: string, sessionId?: string): boolean;
export {};
//# sourceMappingURL=mode-cancel-sync.d.ts.map