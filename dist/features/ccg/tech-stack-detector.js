import { promises as fs } from 'fs';
import * as path from 'path';
export async function detectTechStack(workingDir) {
    const packageJsonPath = path.join(workingDir, 'package.json');
    try {
        await fs.access(packageJsonPath);
    }
    catch {
        return { language: 'javascript', frontend: 'none', backend: 'none' };
    }
    let packageJson;
    try {
        const content = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(content);
    }
    catch {
        return { language: 'javascript', frontend: 'none', backend: 'none' };
    }
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };
    return {
        frontend: detectFrontend(allDeps),
        backend: detectBackend(allDeps),
        language: await detectLanguage(workingDir, allDeps),
        buildTool: detectBuildTool(allDeps)
    };
}
function detectFrontend(deps) {
    if (deps['react'] || deps['react-dom'])
        return 'react';
    if (deps['vue'])
        return 'vue';
    if (deps['@angular/core'])
        return 'angular';
    if (deps['svelte'])
        return 'svelte';
    return 'none';
}
function detectBackend(deps) {
    if (deps['@nestjs/core'])
        return 'nestjs';
    if (deps['fastify'])
        return 'fastify';
    if (deps['express'])
        return 'express';
    return 'none';
}
async function detectLanguage(workingDir, deps) {
    if (deps['typescript']) {
        try {
            await fs.access(path.join(workingDir, 'tsconfig.json'));
            return 'typescript';
        }
        catch {
            return 'mixed';
        }
    }
    return 'javascript';
}
function detectBuildTool(deps) {
    if (deps['vite'])
        return 'vite';
    if (deps['webpack'])
        return 'webpack';
    if (deps['rollup'])
        return 'rollup';
    return undefined;
}
//# sourceMappingURL=tech-stack-detector.js.map