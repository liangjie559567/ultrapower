/**
 * Axiom Boot Hook - Storage
 *
 * Reads and parses Axiom memory files from .omc/axiom/ directory.
 */
import type { AxiomState, AxiomMemoryFiles } from './types.js';
export declare function getAxiomDir(workingDirectory: string): string;
export declare function isAxiomEnabled(workingDirectory: string): boolean;
export declare function getMemoryFilePaths(workingDirectory: string): AxiomMemoryFiles;
export declare function readActiveContext(workingDirectory: string): string | null;
export declare function readActiveContextRaw(workingDirectory: string): string | null;
export declare function parseAxiomState(activeContextContent: string): AxiomState;
export declare function readProjectDecisions(workingDirectory: string): string | null;
export declare function readUserPreferences(workingDirectory: string): string | null;
export declare function ensureConstitution(workingDirectory: string): void;
//# sourceMappingURL=storage.d.ts.map