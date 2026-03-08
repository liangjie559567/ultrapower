import { promises as fs } from 'fs';
import * as path from 'path';
import { fileCache } from './file-cache.js';
export async function detectMicroservices(workingDir) {
    try {
        const entries = await fileCache.readdir(workingDir);
        const dirs = await Promise.all(entries.map(async (name) => {
            if (name.startsWith('.'))
                return null;
            const fullPath = path.join(workingDir, name);
            const stat = await fs.stat(fullPath).catch(() => null);
            return stat?.isDirectory() ? name : null;
        }));
        const validDirs = dirs.filter((d) => d !== null);
        const services = await Promise.all(validDirs.map(name => detectService(workingDir, name)));
        return services.filter((s) => s !== null);
    }
    catch {
        return [];
    }
}
async function detectService(workingDir, name) {
    const servicePath = path.join(workingDir, name);
    const pkgPath = path.join(servicePath, 'package.json');
    try {
        await fs.access(pkgPath);
        const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        return {
            name,
            path: servicePath,
            dependencies: extractServiceDeps(pkg.dependencies || {}),
        };
    }
    catch {
        return null;
    }
}
function extractServiceDeps(deps) {
    return Object.keys(deps).filter(d => d.startsWith('@services/'));
}
//# sourceMappingURL=microservice-detector.js.map