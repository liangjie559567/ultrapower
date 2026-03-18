import { describe, it, expect, beforeEach } from 'vitest';
import { detectPlatform, extractRequirements } from '../../../src/agents/zerodev/requirement-clarifier';
import { matchTemplate, generateCode } from '../../../src/agents/zerodev/code-generator';
import { selectTechStack } from '../../../src/agents/zerodev/tech-selector';
import { generateDeploymentConfig } from '../../../src/agents/zerodev/deployment-manager';
import { analyzeLibrary } from '../../../src/agents/zerodev/opensource-analyzer';
import { ZeroDevStateManager } from '../../../src/agents/zerodev/state-manager';

describe('场景 2: 完整 5-Agent 协作流程', () => {
  let stateManager: ZeroDevStateManager;
  let sessionId: string;

  beforeEach(() => {
    stateManager = new ZeroDevStateManager();
    sessionId = `test-${Date.now()}`;
  });

  it('应该完成从需求到部署的完整流程', async () => {
    // 步骤 1: 需求澄清
    const requirement = '我想做一个 Web API，用 Node.js 和 PostgreSQL，需要 JWT 认证';
    const platform = detectPlatform(requirement);
    expect(platform).toBe('api');

    const reqs = extractRequirements(requirement);
    expect(reqs.functional.length).toBeGreaterThan(0);

    // 步骤 2: 技术栈选择
    const techStack = selectTechStack(requirement, platform);
    expect(techStack.backend).toContain('Node.js');
    expect(techStack.database).toContain('PostgreSQL');

    // 步骤 3: 代码生成
    const template = matchTemplate('JWT 认证');
    const code = generateCode(template, { className: 'AuthService' });
    expect(code).toContain('AuthService');
    expect(code).toContain('export class');

    // 步骤 4: 开源库分析
    const libAnalysis = analyzeLibrary('jsonwebtoken', 'MIT');
    expect(libAnalysis.compatible).toBe(true);
    expect(libAnalysis.risk).toBe('low');

    // 步骤 5: 部署配置生成
    const deployConfig = generateDeploymentConfig(platform, techStack.backend);
    expect(deployConfig.type).toBe('docker');
    expect(deployConfig.config.image).toContain('node');

    // 验证状态管理
    await stateManager.writeState('zerodev-flow', sessionId, {
      platform,
      techStack,
      code,
      deployConfig
    });

    const state = await stateManager.readState('zerodev-flow', sessionId);
    expect(state).toBeDefined();
    expect(state?.platform).toBe('api');
  });

  it('应该处理 Mobile 平台的完整流程', async () => {
    const requirement = '做一个手机应用，用 React Native';
    const platform = detectPlatform(requirement);
    expect(platform).toBe('mobile');

    const techStack = selectTechStack(requirement, platform);
    expect(techStack.frontend).toContain('React Native');

    const deployConfig = generateDeploymentConfig(platform, techStack.frontend);
    expect(deployConfig.type).toBe('serverless');
  });
});
