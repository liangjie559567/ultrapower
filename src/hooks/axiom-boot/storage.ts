/**
 * Axiom Boot Hook - Storage
 *
 * Reads and parses Axiom memory files from .omc/axiom/ directory.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AxiomState, AxiomMemoryFiles } from './types.js';

const AXIOM_DIR = '.omc/axiom';

export function getAxiomDir(workingDirectory: string): string {
  return join(workingDirectory, AXIOM_DIR);
}

export function isAxiomEnabled(workingDirectory: string): boolean {
  return existsSync(getAxiomDir(workingDirectory));
}

export function getMemoryFilePaths(workingDirectory: string): AxiomMemoryFiles {
  const axiomDir = getAxiomDir(workingDirectory);
  return {
    activeContext: join(axiomDir, 'active_context.md'),
    projectDecisions: join(axiomDir, 'project_decisions.md'),
    userPreferences: join(axiomDir, 'user_preferences.md'),
    stateMachine: join(axiomDir, 'state_machine.md'),
  };
}

export function readActiveContext(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.activeContext)) return null;
  return readFileSync(paths.activeContext, 'utf-8');
}

export function parseAxiomState(activeContextContent: string): AxiomState {
  const statusMatch = activeContextContent.match(/当前状态:\s*(IDLE|PLANNING|CONFIRMING|EXECUTING|AUTO_FIX|BLOCKED|ARCHIVING)/);
  const checkpointMatch = activeContextContent.match(/上次检查点:\s*(\S+)/);
  const taskMatch = activeContextContent.match(/活跃任务:\s*(\S+)/);

  return {
    status: (statusMatch?.[1] as AxiomState['status']) ?? 'IDLE',
    lastUpdated: new Date().toISOString(),
    lastCheckpoint: checkpointMatch?.[1] !== '无' ? checkpointMatch?.[1] : undefined,
    activeTaskId: taskMatch?.[1] !== '无' ? taskMatch?.[1] : undefined,
  };
}

export function readProjectDecisions(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.projectDecisions)) return null;
  return readFileSync(paths.projectDecisions, 'utf-8');
}

export function readUserPreferences(workingDirectory: string): string | null {
  const paths = getMemoryFilePaths(workingDirectory);
  if (!existsSync(paths.userPreferences)) return null;
  return readFileSync(paths.userPreferences, 'utf-8');
}
