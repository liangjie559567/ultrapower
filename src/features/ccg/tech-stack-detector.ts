import { promises as fs } from 'fs';
import * as path from 'path';

export interface TechStack {
  frontend?: 'react' | 'vue' | 'angular' | 'svelte' | 'none';
  backend?: 'express' | 'fastify' | 'nestjs' | 'none';
  language: 'typescript' | 'javascript' | 'mixed';
  buildTool?: 'vite' | 'webpack' | 'rollup';
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export async function detectTechStack(workingDir: string): Promise<TechStack> {
  const packageJsonPath = path.join(workingDir, 'package.json');

  try {
    await fs.access(packageJsonPath);
  } catch {
    return { language: 'javascript', frontend: 'none', backend: 'none' };
  }

  let packageJson: PackageJson;
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  } catch {
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

function detectFrontend(deps: Record<string, string>): TechStack['frontend'] {
  if (deps['react'] || deps['react-dom']) return 'react';
  if (deps['vue']) return 'vue';
  if (deps['@angular/core']) return 'angular';
  if (deps['svelte']) return 'svelte';
  return 'none';
}

function detectBackend(deps: Record<string, string>): TechStack['backend'] {
  if (deps['@nestjs/core']) return 'nestjs';
  if (deps['fastify']) return 'fastify';
  if (deps['express']) return 'express';
  return 'none';
}

async function detectLanguage(workingDir: string, deps: Record<string, string>): Promise<TechStack['language']> {
  if (deps['typescript']) {
    try {
      await fs.access(path.join(workingDir, 'tsconfig.json'));
      return 'typescript';
    } catch {
      return 'mixed';
    }
  }
  return 'javascript';
}

function detectBuildTool(deps: Record<string, string>): TechStack['buildTool'] {
  if (deps['vite']) return 'vite';
  if (deps['webpack']) return 'webpack';
  if (deps['rollup']) return 'rollup';
  return undefined;
}

