import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ProjectContext {
  hasTests: boolean;
  hasTypeScript: boolean;
  framework?: string;
  recentErrors: string[];
  modifiedFiles: string[];
}

export class ContextEnhancer {
  static analyzeProject(cwd: string): ProjectContext {
    return {
      hasTests: this.checkTests(cwd),
      hasTypeScript: this.checkTypeScript(cwd),
      framework: this.detectFramework(cwd),
      recentErrors: [],
      modifiedFiles: []
    };
  }

  private static checkTests(cwd: string): boolean {
    return existsSync(join(cwd, 'vitest.config.ts')) || 
           existsSync(join(cwd, 'jest.config.js'));
  }

  private static checkTypeScript(cwd: string): boolean {
    return existsSync(join(cwd, 'tsconfig.json'));
  }

  private static detectFramework(cwd: string): string | undefined {
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) return undefined;
    
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps.svelte) return 'svelte';
      return undefined;
    } catch {
      return undefined;
    }
  }
}
