import { promises as fs } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { assertValidMode } from '../../lib/validateMode.js';

interface ModeProgress {
  active: boolean;
  phase: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  startedAt: string;
  lastHeartbeat: string;
}

interface UnifiedProgress {
  currentMode: string | null;
  modes: Record<string, ModeProgress>;
  linkedModes: { primary: string; secondary: string[] } | null;
  lastUpdated: string;
}

const SUPPORTED_MODES = ['autopilot', 'ultrapilot', 'team', 'pipeline', 'ralph', 'ultrawork', 'ultraqa'];

export async function getProgress(directory: string): Promise<UnifiedProgress> {
  const start = performance.now();
  const stateDir = join(directory, '.omc', 'state');
  const modes: Record<string, ModeProgress> = {};
  let currentMode: string | null = null;
  let linkedModes: { primary: string; secondary: string[] } | null = null;

  for (const mode of SUPPORTED_MODES) {
    try {
      const validMode = assertValidMode(mode);
      const statePath = join(stateDir, `${validMode}-state.json`);
      const content = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(content);

      if (state.active) {
        currentMode = mode;
        modes[mode] = {
          active: true,
          phase: state.current_phase || state.phase || 'unknown',
          progress: calculateProgress(state),
          tasksTotal: state.tasksTotal || 0,
          tasksCompleted: state.tasksCompleted || 0,
          startedAt: state.started_at || state.startedAt || new Date().toISOString(),
          lastHeartbeat: state.last_checked_at || new Date().toISOString(),
        };

        if (state.linkedModes && Array.isArray(state.linkedModes)) {
          linkedModes = { primary: mode, secondary: state.linkedModes };
        }
      }
    } catch {
      // Mode not active
    }
  }

  const elapsed = performance.now() - start;
  if (elapsed > 10) {
    console.warn(`[Progress] Read took ${elapsed.toFixed(2)}ms (threshold: 10ms)`);
  }

  return {
    currentMode,
    modes,
    linkedModes,
    lastUpdated: new Date().toISOString(),
  };
}

interface StateWithProgress {
  tasksCompleted?: number;
  tasksTotal?: number;
  progress?: number;
  iteration?: number;
  max_iterations?: number;
  [key: string]: unknown;
}

function calculateProgress(state: StateWithProgress): number {
  if (state.tasksCompleted && state.tasksTotal) {
    return Math.round((state.tasksCompleted / state.tasksTotal) * 100);
  }
  if (state.progress) return state.progress;
  return 0;
}

export async function syncAllStates(directory: string): Promise<void> {
  const progress = await getProgress(directory);
  const unifiedPath = join(directory, '.omc', 'state', 'unified-progress.json');

  await fs.mkdir(join(directory, '.omc', 'state'), { recursive: true });
  await fs.writeFile(unifiedPath, JSON.stringify(progress, null, 2));
}
