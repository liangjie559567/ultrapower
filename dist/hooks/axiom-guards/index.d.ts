/**
 * Axiom Guards Hook - Main Entry
 *
 * Enforces Axiom gatekeeper rules (Expert Gate, User Gate, CI Gate).
 */
import type { AxiomGuardsInput, AxiomGuardsOutput } from './types.js';
export * from './types.js';
export * from './constants.js';
export declare function processAxiomGuards(input: AxiomGuardsInput): AxiomGuardsOutput;
export declare function checkExpertGate(userIntent: string): boolean;
export declare function getExpertGateMessage(): string;
//# sourceMappingURL=index.d.ts.map