/**
 * OMC HUD - Autopilot Element
 *
 * Renders autopilot phase and progress display.
 */

import type { HudThresholds } from '../types.js';
import { RESET } from '../colors.js';

// ANSI color codes
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';

export interface AutopilotStateForHud {
  active: boolean;
  phase: string;
  iteration: number;
  maxIterations: number;
  tasksCompleted?: number;
  tasksTotal?: number;
  filesCreated?: number;
}

const PHASE_NAMES: Record<string, string> = {
  expansion: '扩展',
  planning: '规划',
  execution: '构建',
  qa: '测试',
  validation: '验证',
  complete: '完成',
  failed: '失败'
};

const PHASE_INDEX: Record<string, number> = {
  expansion: 1,
  planning: 2,
  execution: 3,
  qa: 4,
  validation: 5,
  complete: 5,
  failed: 0
};

/**
 * Render autopilot state.
 * Returns null if autopilot is not active.
 *
 * Format: [AUTOPILOT] Phase 2/5: Plan | Tasks: 5/12
 */
export function renderAutopilot(
  state: AutopilotStateForHud | null,
  _thresholds?: HudThresholds
): string | null {
  if (!state?.active) {
    return null;
  }

  const { phase, iteration, maxIterations, tasksCompleted, tasksTotal, filesCreated } = state;
  const phaseNum = PHASE_INDEX[phase] || 0;
  const phaseName = PHASE_NAMES[phase] || phase;

  // Color based on phase
  let phaseColor: string;
  switch (phase) {
    case 'complete':
      phaseColor = GREEN;
      break;
    case 'failed':
      phaseColor = RED;
      break;
    case 'validation':
      phaseColor = MAGENTA;
      break;
    case 'qa':
      phaseColor = YELLOW;
      break;
    default:
      phaseColor = CYAN;
  }

  let output = `${CYAN}[自动驾驶]${RESET} 阶段 ${phaseColor}${phaseNum}/5${RESET}: ${phaseName}`;

  // Add iteration count if not first iteration
  if (iteration > 1) {
    output += ` (迭代 ${iteration}/${maxIterations})`;
  }

  // Add task progress if in execution phase
  if (phase === 'execution' && tasksTotal && tasksTotal > 0) {
    const taskColor = tasksCompleted === tasksTotal ? GREEN : YELLOW;
    output += ` | 任务: ${taskColor}${tasksCompleted || 0}/${tasksTotal}${RESET}`;
  }

  // Add file count if available
  if (filesCreated && filesCreated > 0) {
    output += ` | ${filesCreated} 文件`;
  }

  return output;
}

/**
 * Render compact autopilot status for minimal displays.
 *
 * Format: AP:3/5 or AP:Done
 */
export function renderAutopilotCompact(
  state: AutopilotStateForHud | null
): string | null {
  if (!state?.active) {
    return null;
  }

  const { phase } = state;
  const phaseNum = PHASE_INDEX[phase] || 0;

  if (phase === 'complete') {
    return `${GREEN}AP:完成${RESET}`;
  }

  if (phase === 'failed') {
    return `${RED}AP:失败${RESET}`;
  }

  return `${CYAN}AP:${phaseNum}/5${RESET}`;
}
