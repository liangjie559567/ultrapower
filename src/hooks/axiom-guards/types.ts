/**
 * Axiom Guards Hook - Types
 *
 * Type definitions for the Axiom gatekeeper system.
 */

export type GateType = 'expert' | 'user' | 'complexity' | 'ci';

export interface GateCheckResult {
  passed: boolean;
  gateType: GateType;
  message?: string;
  requiresAction?: string;
}

export interface AxiomGuardsInput {
  toolName: string;
  toolInput: Record<string, unknown>;
  workingDirectory: string;
}

export interface AxiomGuardsOutput {
  blocked: boolean;
  reason?: string;
  suggestion?: string;
}
