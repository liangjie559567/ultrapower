import { describe, it, expect, beforeEach } from 'vitest';
import { detectPlatform, extractRequirements } from '../../../../dist/agents/zerodev/requirement-clarifier.js';
import { selectTechStack } from '../../../../dist/agents/zerodev/tech-selector.js';
import { matchTemplate, generateCode } from '../../../../dist/agents/zerodev/code-generator.js';
import { analyzeLibrary } from '../../../../dist/agents/zerodev/opensource-analyzer.js';
import { generateDeploymentConfig } from '../../../../dist/agents/zerodev/deployment-manager.js';
import { ZeroDevStateManager } from '../../../../dist/agents/zerodev/state-manager.js';

describe('集成测试：完整工作流', () => {
  let stateManager: ZeroDevStateManager;
  let sessionId: string;

  beforeEach(() => {
    stateManager = new ZeroDevStateManager();
    sessionId = `integration-${Date.now()}`;
  });

  it('应该完成电商平台完整流程', async () => {
    const requirement = '做一个电商网站，用 React 和 Node.js，需要用户认证和支付功能';

    const platform = detectPlatform(requirement);
    expect(platform).toBe('web');

    const reqs = extractRequirements(requirement);
    expect(reqs.functional.length).toBeGreaterThan(0);

    const techStack = selectTechStack(requirement, platform);
    expect(techStack.frontend).toContain('React');
    expect(techStack.backend).toContain('Node.js');

    const template = matchTemplate('用户认证');
    const code = generateCode(template, { className: 'AuthService' });
    expect(code).toContain('AuthService');

    const libAnalysis = analyzeLibrary('stripe', 'MIT');
    expect(libAnalysis.compatible).toBe(true);

    const deployConfig = generateDeploymentConfig(platform, techStack.backend);
    expect(deployConfig.type).toBe('docker');

    await stateManager.writeState('integration-test', sessionId, {
      platform, techStack, code, deployConfig
    });

    const state = await stateManager.readState('integration-test', sessionId);
    expect(state?.platform).toBe('web');
  });

  it('应该完成移动应用完整流程', async () => {
    const requirement = '开发一个移动应用，使用 React Native，需要离线存储';

    const platform = detectPlatform(requirement);
    expect(platform).toBe('mobile');

    const techStack = selectTechStack(requirement, platform);
    expect(techStack.frontend).toContain('React Native');

    const deployConfig = generateDeploymentConfig(platform, techStack.frontend);
    expect(deployConfig.type).toBe('serverless');
  });

  it('应该完成 API 服务完整流程', async () => {
    const requirement = '构建 REST API，Python FastAPI，PostgreSQL 数据库';

    const platform = detectPlatform(requirement);
    expect(platform).toBe('api');

    const techStack = selectTechStack(requirement, platform);
    expect(techStack.backend).toContain('Python');
    expect(techStack.database).toContain('PostgreSQL');

    const deployConfig = generateDeploymentConfig(platform, techStack.backend);
    expect(deployConfig.type).toBe('docker');
    expect(deployConfig.config.image).toContain('python');
  });
});
