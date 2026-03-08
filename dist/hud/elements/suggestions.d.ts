/**
 * OMC HUD - Smart Suggestions Element
 *
 * Generates context-aware next-step suggestions based on current system state.
 * Analyzes: context usage, Axiom state, active agents, session health.
 */
import type { SmartSuggestion, AxiomStateForHud, SessionHealth } from '../types.js';
/**
 * Generate smart suggestions based on current HUD state.
 * Returns up to 2 most relevant suggestions.
 */
export declare function generateSuggestions(params: {
    contextPercent: number;
    axiom: AxiomStateForHud | null;
    sessionHealth: SessionHealth | null;
    activeAgentCount: number;
    contextWarningThreshold: number;
}): SmartSuggestion[];
/**
 * Render smart suggestions line.
 *
 * Format: 💡 建议: /ax-evolve（学习队列有3条待处理）
 */
export declare function renderSuggestions(suggestions: SmartSuggestion[]): string | null;
//# sourceMappingURL=suggestions.d.ts.map