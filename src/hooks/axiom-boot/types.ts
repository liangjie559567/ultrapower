/**
 * Axiom Boot Hook - Types
 *
 * Type definitions for the Axiom memory system boot hook.
 */

export interface AxiomState {
  status: 'IDLE' | 'PLANNING' | 'CONFIRMING' | 'EXECUTING' | 'AUTO_FIX' | 'BLOCKED' | 'ARCHIVING';
  lastUpdated: string;
  lastCheckpoint?: string;
  activeTaskId?: string;
  suspensionNote?: string;
}

export interface AxiomBootInput {
  sessionId?: string;
  workingDirectory: string;
}

export interface AxiomBootOutput {
  contextInjected: boolean;
  state: AxiomState | null;
  message?: string;
}

export interface AxiomMemoryFiles {
  activeContext: string;
  projectDecisions: string;
  userPreferences: string;
  stateMachine: string;
}
