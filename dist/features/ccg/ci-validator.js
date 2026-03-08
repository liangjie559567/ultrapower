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
        errors.push(`TypeScript compilation failed: ${err.message}`);
    }
    try {
        await execAsync('npm run build', { cwd: process.cwd() });
    }
    catch (err) {
        errors.push(`Build failed: ${err.message}`);
    }
    try {
        await execAsync('npm test', { cwd: process.cwd() });
    }
    catch (err) {
        errors.push(`Tests failed: ${err.message}`);
    }
    return {
        success: errors.length === 0,
        errors,
        warnings,
    };
}
//# sourceMappingURL=ci-validator.js.map