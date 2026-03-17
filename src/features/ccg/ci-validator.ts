import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CIResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export async function runCIValidation(): Promise<CIResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    await execAsync('tsc --noEmit', { cwd: process.cwd() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`TypeScript compilation failed: ${message}`);
  }

  try {
    await execAsync('npm run build', { cwd: process.cwd() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Build failed: ${message}`);
  }

  try {
    await execAsync('npm test', { cwd: process.cwd() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Tests failed: ${message}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}
