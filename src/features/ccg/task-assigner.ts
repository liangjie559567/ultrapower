export type ModelType = 'claude' | 'codex' | 'gemini';
export type ChangeType = 'feature' | 'bugfix' | 'refactor';

export interface TaskAssignment {
  model: ModelType;
  reason: string;
  confidence: number;
}

export function assignTask(
  files: string[],
  changeType: ChangeType
): TaskAssignment {
  if (files.length === 0) {
    return { model: 'claude', reason: 'No files specified', confidence: 0.5 };
  }

  const uiFiles = files.filter(isUIFile);
  const logicFiles = files.filter(isLogicFile);
  const testFiles = files.filter(isTestFile);

  // Pure UI changes → Gemini
  if (uiFiles.length > 0 && logicFiles.length === 0 && testFiles.length === 0) {
    return {
      model: 'gemini',
      reason: `UI-only changes (${uiFiles.length} files)`,
      confidence: 0.9
    };
  }

  // Pure logic/test changes → Codex
  if (uiFiles.length === 0 && (logicFiles.length > 0 || testFiles.length > 0)) {
    return {
      model: 'codex',
      reason: `Logic/test changes (${logicFiles.length + testFiles.length} files)`,
      confidence: 0.9
    };
  }

  // Mixed changes → Claude coordinates
  if (uiFiles.length > 0 && logicFiles.length > 0) {
    return {
      model: 'claude',
      reason: `Cross-layer changes (${uiFiles.length} UI + ${logicFiles.length} logic)`,
      confidence: 0.85
    };
  }

  return { model: 'claude', reason: 'Default coordinator', confidence: 0.7 };
}

function isUIFile(file: string): boolean {
  return /\.(tsx|jsx|vue|svelte)$/.test(file) || /\.css$/.test(file);
}

function isLogicFile(file: string): boolean {
  return /\.(ts|js)$/.test(file) && !isTestFile(file) && !isUIFile(file);
}

function isTestFile(file: string): boolean {
  return /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(file);
}


