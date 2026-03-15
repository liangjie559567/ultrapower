/**
 * Keyword Conflict Resolver
 * Detects and resolves conflicts between multiple detected keywords
 */
import type { KeywordType } from './index.js';
export interface ConflictResolution {
    hasConflict: boolean;
    winner: KeywordType | null;
    loser: KeywordType | null;
    reason: string;
}
/**
 * Detect and resolve conflicts between keywords
 */
export declare function resolveConflict(keywords: KeywordType[]): ConflictResolution;
//# sourceMappingURL=conflict-resolver.d.ts.map