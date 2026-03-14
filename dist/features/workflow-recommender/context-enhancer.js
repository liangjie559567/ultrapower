import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
export class ContextEnhancer {
    static analyzeProject(cwd) {
        return {
            hasTests: this.checkTests(cwd),
            hasTypeScript: this.checkTypeScript(cwd),
            framework: this.detectFramework(cwd),
            recentErrors: [],
            modifiedFiles: []
        };
    }
    static checkTests(cwd) {
        return existsSync(join(cwd, 'vitest.config.ts')) ||
            existsSync(join(cwd, 'jest.config.js'));
    }
    static checkTypeScript(cwd) {
        return existsSync(join(cwd, 'tsconfig.json'));
    }
    static detectFramework(cwd) {
        const pkgPath = join(cwd, 'package.json');
        if (!existsSync(pkgPath))
            return undefined;
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps.react)
                return 'react';
            if (deps.vue)
                return 'vue';
            if (deps.svelte)
                return 'svelte';
            return undefined;
        }
        catch {
            return undefined;
        }
    }
}
//# sourceMappingURL=context-enhancer.js.map