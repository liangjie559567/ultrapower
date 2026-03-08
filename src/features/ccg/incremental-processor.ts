import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getChangedFiles(baseBranch = 'main'): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`git diff --name-only --cached`);
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export async function getUntrackedFiles(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git ls-files --others --exclude-standard');
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export async function getAllChangedFiles(baseBranch = 'main'): Promise<string[]> {
  const [changed, untracked] = await Promise.all([
    getChangedFiles(baseBranch),
    getUntrackedFiles()
  ]);
  return [...new Set([...changed, ...untracked])];
}
