import { spawn } from 'child_process';

export interface LSPCheckResult {
  hasErrors: boolean;
  errors: string[];
}

export async function checkWithLSP(filePath: string): Promise<LSPCheckResult> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsc', '--noEmit', filePath], {
      cwd: process.cwd(),
      shell: true
    });

    let output = '';
    proc.stdout?.on('data', (data) => { output += data; });
    proc.stderr?.on('data', (data) => { output += data; });

    proc.on('close', (code) => {
      const hasErrors = code !== 0;
      const errors = hasErrors ? output.split('\n').filter(l => l.trim()) : [];
      resolve({ hasErrors, errors });
    });
  });
}
