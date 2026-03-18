import { InputError, ValidationError } from './types.js';

export interface DeploymentConfig {
  type: 'docker' | 'kubernetes' | 'serverless';
  config: Record<string, any>;
}

export function generateDeploymentConfig(platform: string, techStack: string[]): DeploymentConfig {
  if (!platform?.trim()) {
    throw new InputError('Platform cannot be empty');
  }

  const hasNode = techStack.some(t => t.toLowerCase().includes('node'));
  const hasPython = techStack.some(t => t.toLowerCase().includes('python'));

  if (platform === 'api' || platform === 'web') {
    return {
      type: 'docker',
      config: {
        image: hasNode ? 'node:18-alpine' : hasPython ? 'python:3.11-slim' : 'node:18-alpine',
        port: 3000,
        env: ['NODE_ENV=production']
      }
    };
  }

  return {
    type: 'serverless',
    config: {
      runtime: hasNode ? 'nodejs18.x' : 'python3.11',
      memory: 512
    }
  };
}
