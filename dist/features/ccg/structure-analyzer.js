import { promises as fs } from 'fs';
import * as path from 'path';
export async function analyzeProjectStructure(workingDir, techStack) {
    const hasWorkspaces = await detectMonorepo(workingDir);
    if (hasWorkspaces) {
        return {
            structure: 'monorepo',
            confidence: 1.0,
            reason: 'package.json contains workspaces'
        };
    }
    const hasClient = await hasDirectory(workingDir, ['client', 'frontend', 'web']);
    const hasServer = await hasDirectory(workingDir, ['server', 'backend', 'api']);
    const hasFrontend = techStack.frontend !== 'none';
    const hasBackend = techStack.backend !== 'none';
    if (hasClient && hasServer) {
        return {
            structure: 'fullstack-separated',
            confidence: 0.95,
            reason: 'Separate client/ and server/ directories detected'
        };
    }
    if (hasFrontend && hasBackend) {
        return {
            structure: 'fullstack-monolith',
            confidence: 0.9,
            reason: 'Both frontend and backend dependencies in single package.json'
        };
    }
    if (hasFrontend) {
        return {
            structure: 'frontend-only',
            confidence: 0.95,
            reason: `Frontend framework detected: ${techStack.frontend}`
        };
    }
    if (hasBackend) {
        return {
            structure: 'backend-only',
            confidence: 0.95,
            reason: `Backend framework detected: ${techStack.backend}`
        };
    }
    return {
        structure: 'frontend-only',
        confidence: 0.5,
        reason: 'No clear indicators, defaulting to frontend-only'
    };
}
async function detectMonorepo(workingDir) {
    try {
        const packageJsonPath = path.join(workingDir, 'package.json');
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);
        return !!pkg.workspaces;
    }
    catch {
        return false;
    }
}
async function hasDirectory(workingDir, names) {
    for (const name of names) {
        try {
            const stat = await fs.stat(path.join(workingDir, name));
            if (stat.isDirectory())
                return true;
        }
        catch {
            // Directory doesn't exist, continue
        }
    }
    return false;
}
//# sourceMappingURL=structure-analyzer.js.map