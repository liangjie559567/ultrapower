import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function runCIValidation() {
    const errors = [];
    const warnings = [];
    try {
        await execAsync('tsc --noEmit', { cwd: process.cwd() });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`TypeScript compilation failed: ${message}`);
    }
    try {
        await execAsync('npm run build', { cwd: process.cwd() });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Build failed: ${message}`);
    }
    try {
        await execAsync('npm test', { cwd: process.cwd() });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Tests failed: ${message}`);
    }
    return {
        success: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=ci-validator.js.map