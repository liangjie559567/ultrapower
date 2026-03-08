/**
 * Axiom Boot Hook - Main Entry
 *
 * Injects Axiom memory context at session start when .omc/axiom/ exists.
 */
import type { AxiomBootInput, AxiomBootOutput } from './types.js';
export * from './types.js';
export * from './storage.js';
export declare function processAxiomBoot(input: AxiomBootInput): AxiomBootOutput;
export declare function buildAxiomBootContext(workingDirectory: string): string;
export declare function generateSessionReflection(workingDirectory: string): string | null;
//# sourceMappingURL=index.d.ts.map