import type { UnifiedTeamMember } from './types.js';
import { UnifiedContextManager } from '../features/unified-context/index.js';
export type { UnifiedTeamMember };
export declare function setContextManager(teamName: string, manager: UnifiedContextManager): void;
export declare function getContextManager(teamName: string): UnifiedContextManager | null;
/**
 * Get all team members from both Claude native teams and MCP workers.
 */
export declare function getTeamMembers(teamName: string, workingDirectory: string): Promise<UnifiedTeamMember[]>;
//# sourceMappingURL=unified-team.d.ts.map