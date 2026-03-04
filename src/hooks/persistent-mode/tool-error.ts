/**
 * Tool error state management
 * Extracted to break circular dependencies
 */

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface ToolErrorState {
  tool_name: string;
  tool_input_preview?: string;
  error: string;
  timestamp: string;
  retry_count: number;
}

export function readLastToolError(directory: string): ToolErrorState | null {
  const stateDir = join(directory, '.omc', 'state');
  const errorPath = join(stateDir, 'last-tool-error.json');

  try {
    if (!existsSync(errorPath)) {
      return null;
    }

    const content = readFileSync(errorPath, 'utf-8');
    const toolError = JSON.parse(content) as ToolErrorState;

    if (!toolError || !toolError.timestamp) {
      return null;
    }

    // Check staleness - errors older than 60 seconds are ignored
    const parsedTime = new Date(toolError.timestamp).getTime();
    if (!Number.isFinite(parsedTime)) {
      return null;
    }
    const age = Date.now() - parsedTime;
    if (age > 60000) {
      return null;
    }

    return toolError;
  } catch {
    return null;
  }
}

export function clearToolErrorState(directory: string): void {
  const stateDir = join(directory, '.omc', 'state');
  const errorPath = join(stateDir, 'last-tool-error.json');

  try {
    if (existsSync(errorPath)) {
      unlinkSync(errorPath);
    }
  } catch {
    // Ignore errors - file may have been removed already
  }
}

export function getToolErrorRetryGuidance(toolError: ToolErrorState | null): string {
  if (!toolError) {
    return '';
  }

  const retryCount = toolError.retry_count || 1;
  const toolName = toolError.tool_name || 'unknown';
  const error = toolError.error || 'Unknown error';

  if (retryCount >= 5) {
    return `[TOOL ERROR - ALTERNATIVE APPROACH NEEDED]
The "${toolName}" operation has failed ${retryCount} times.

STOP RETRYING THE SAME APPROACH. Instead:
1. Try a completely different command or approach
2. Check if the environment/dependencies are correct
3. Consider breaking down the task differently
4. If stuck, ask the user for guidance

`;
  }

  return `[TOOL ERROR - RETRY REQUIRED]
The previous "${toolName}" operation failed.

Error: ${error}

REQUIRED ACTIONS:
1. Analyze why the command failed
2. Fix the issue (wrong path? permission? syntax? missing dependency?)
3. RETRY the operation with corrected parameters
4. Continue with your original task after success

Do NOT skip this step. Do NOT move on without fixing the error.

`;
}
