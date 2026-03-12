import { execSync } from 'child_process';
import { join } from 'path';

/**
 * Get list of changed files in working directory
 */
export function getChangedFiles(workingDir: string): string[] {
  try {
    const output = execSync('git diff --name-only HEAD', {
      cwd: workingDir,
      encoding: 'utf-8'
    });

    return output
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)
      .map(f => join(workingDir, f));
  } catch {
    return [];
  }
}
